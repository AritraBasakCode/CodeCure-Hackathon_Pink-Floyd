"""
preprocessing.py
Clean, impute, and scale molecular descriptor data for ML training.
"""

import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import VarianceThreshold
import joblib
from pathlib import Path

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True)


class MolecularPreprocessor:
    """
    Pipeline: sanitize → impute → variance filter → scale.
    Fits on training data, applies to new molecules.
    """

    def __init__(self, variance_threshold: float = 0.01,
                 impute_strategy: str = "median"):
        self.imputer = SimpleImputer(strategy=impute_strategy)
        self.variance_filter = VarianceThreshold(threshold=variance_threshold)
        self.scaler = StandardScaler()
        self.feature_names_in_ = None
        self.feature_names_out_ = None
        self.is_fitted = False

    @staticmethod
    def _sanitize(arr: np.ndarray) -> np.ndarray:
        """
        Replace inf / -inf with NaN so SimpleImputer can handle them.
        RDKit descriptors like BalabanJ produce inf on disconnected graphs.
        """
        arr = arr.astype(np.float64)
        arr[~np.isfinite(arr)] = np.nan
        return arr

    def fit_transform(self, X: pd.DataFrame) -> np.ndarray:
        self.feature_names_in_ = list(X.columns)

        # Select only numeric columns
        num_df = X.select_dtypes(include=[np.number])
        num_cols = list(num_df.columns)
        X_arr = num_df.values

        # 0. Sanitize: replace inf/-inf with NaN before imputation
        X_arr = self._sanitize(X_arr)

        # 1. Impute missing / previously-inf values
        X_imp = self.imputer.fit_transform(X_arr)

        # 2. Remove low-variance features
        X_var = self.variance_filter.fit_transform(X_imp)

        # Track selected feature names
        selected_mask = self.variance_filter.get_support()
        self.feature_names_out_ = [num_cols[i] for i, m
                                   in enumerate(selected_mask) if m]

        # 3. Scale
        X_scaled = self.scaler.fit_transform(X_var)

        self.is_fitted = True
        print(f"[Preprocessor] Features: {len(self.feature_names_in_)} -> "
              f"{len(self.feature_names_out_)} after variance filter.")
        return X_scaled

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Preprocessor not fitted. Call fit_transform first.")

        # Align columns to training schema — fill missing cols with NaN
        for col in self.feature_names_in_:
            if col not in X.columns:
                X[col] = np.nan

        X_aligned = X[self.feature_names_in_]
        X_num = X_aligned.select_dtypes(include=[np.number]).values

        # Sanitize inf values at inference time too
        X_num = self._sanitize(X_num)

        X_imp = self.imputer.transform(X_num)
        X_var = self.variance_filter.transform(X_imp)
        X_scaled = self.scaler.transform(X_var)
        return X_scaled

    def save(self, path: str = None):
        path = path or ARTIFACTS_DIR / "preprocessor.joblib"
        joblib.dump(self, path)
        print(f"[Preprocessor] Saved to {path}")

    @classmethod
    def load(cls, path: str = None) -> "MolecularPreprocessor":
        path = path or ARTIFACTS_DIR / "preprocessor.joblib"
        obj = joblib.load(path)
        print(f"[Preprocessor] Loaded from {path}")
        return obj


def prepare_labels(df: pd.DataFrame, endpoints: list) -> np.ndarray:
    """
    Extract and binarize label matrix.
    NaN filled with column median (0 or 1).
    """
    label_df = df[endpoints].copy()

    for col in label_df.columns:
        median_val = label_df[col].median()
        if np.isnan(median_val):
            median_val = 0
        label_df[col] = label_df[col].fillna(median_val)

    return label_df.values.astype(int)


def split_data(X: np.ndarray, y: np.ndarray,
               test_size: float = 0.2,
               val_size: float = 0.1,
               random_state: int = 42):
    """Train / Val / Test split."""
    from sklearn.model_selection import train_test_split

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )
    val_fraction = val_size / (1 - test_size)
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=val_fraction, random_state=random_state
    )
    print(f"[Split] Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}")
    return X_train, X_val, X_test, y_train, y_val, y_test