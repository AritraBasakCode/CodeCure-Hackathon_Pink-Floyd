"""
train.py
Full training pipeline for drug toxicity prediction.
Run directly: python models/train.py
"""

import numpy as np
import pandas as pd
import joblib
import json
import os
from pathlib import Path
from sklearn.multioutput import MultiOutputClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import roc_auc_score, f1_score, classification_report
from sklearn.model_selection import cross_val_score
import warnings
warnings.filterwarnings("ignore")

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False
    print("XGBoost not available; falling back to RandomForest.")

# ── Project paths ──────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
ARTIFACTS_DIR = ROOT / "artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True)

# Add backend/ to sys.path so 'utils' is importable regardless of where
# the script is invoked from (e.g. python models/train.py or python train.py)
import sys
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from utils.dataset_loader import load_combined, TOX21_ENDPOINTS
from utils.molecular import compute_descriptors_batch
from utils.preprocessing import MolecularPreprocessor, prepare_labels, split_data


def build_model():
    """Return the best available classifier wrapped in MultiOutputClassifier."""
    if XGB_AVAILABLE:
        base = xgb.XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="auc",
            random_state=42,
            n_jobs=-1,
        )
        print("[Model] Using XGBoost.")
    else:
        base = RandomForestClassifier(
            n_estimators=300,
            max_depth=10,
            min_samples_leaf=5,
            random_state=42,
            n_jobs=-1,
        )
        print("[Model] Using RandomForest.")

    return MultiOutputClassifier(base, n_jobs=-1)


def evaluate(model, X_test: np.ndarray, y_test: np.ndarray,
             endpoints: list) -> dict:
    """Compute per-endpoint and mean AUC-ROC."""
    y_pred_proba = np.array(
        [est.predict_proba(X_test)[:, 1] for est in model.estimators_]
    ).T  # shape (n_samples, n_endpoints)

    y_pred = model.predict(X_test)

    results = {}
    aucs = []
    f1s = []

    for i, ep in enumerate(endpoints):
        # Skip endpoints with only one class in test set
        if len(np.unique(y_test[:, i])) < 2:
            continue
        try:
            auc = roc_auc_score(y_test[:, i], y_pred_proba[:, i])
            f1 = f1_score(y_test[:, i], y_pred[:, i], zero_division=0)
            results[ep] = {"auc_roc": round(auc, 4), "f1": round(f1, 4)}
            aucs.append(auc)
            f1s.append(f1)
        except Exception as e:
            results[ep] = {"error": str(e)}

    results["mean_auc_roc"] = round(np.mean(aucs), 4) if aucs else 0.0
    results["mean_f1"] = round(np.mean(f1s), 4) if f1s else 0.0
    return results


def train_pipeline(tox21_path=None, zinc_path=None):
    print("=" * 60)
    print("  ToxiScan — Model Training Pipeline")
    print("=" * 60)

    # 1. Load data
    print("\n[1/6] Loading datasets...")
    df = load_combined(tox21_path, zinc_path, zinc_sample=5000)

    # 2. Compute molecular descriptors
    print("\n[2/6] Computing molecular descriptors (this may take a few minutes)...")
    desc_df = compute_descriptors_batch(df["smiles"].tolist(), show_progress=True)

    # Merge with labels
    df = df.reset_index(drop=True)
    desc_df = desc_df.reset_index(drop=True)
    full_df = pd.concat([desc_df, df[TOX21_ENDPOINTS + ["source"]]], axis=1)

    # Remove rows with invalid SMILES
    full_df = full_df[full_df["valid"] == True].drop(columns=["valid", "smiles"])
    print(f"[2/6] Valid molecules: {len(full_df)}")

    # 3. Prepare features & labels
    print("\n[3/6] Preprocessing features...")
    non_feature_cols = TOX21_ENDPOINTS + ["source"]
    feature_cols = [c for c in full_df.columns if c not in non_feature_cols]
    X_raw = full_df[feature_cols]
    y = prepare_labels(full_df, TOX21_ENDPOINTS)

    preprocessor = MolecularPreprocessor()
    X = preprocessor.fit_transform(X_raw)

    # Save feature names for inference
    feature_meta = {
        "feature_names_in": preprocessor.feature_names_in_,
        "feature_names_out": preprocessor.feature_names_out_,
        "endpoints": TOX21_ENDPOINTS,
    }
    with open(ARTIFACTS_DIR / "feature_meta.json", "w") as f:
        json.dump(feature_meta, f, indent=2)

    # 4. Split
    print("\n[4/6] Splitting data...")
    X_train, X_val, X_test, y_train, y_val, y_test = split_data(X, y)

    # 5. Train
    print("\n[5/6] Training model...")
    model = build_model()
    model.fit(X_train, y_train)

    # 6. Evaluate
    print("\n[6/6] Evaluating...")
    results = evaluate(model, X_test, y_test, TOX21_ENDPOINTS)
    print("\n📊 Results:")
    for ep, metrics in results.items():
        if isinstance(metrics, dict) and "auc_roc" in metrics:
            print(f"  {ep:25s}  AUC={metrics['auc_roc']:.4f}  F1={metrics['f1']:.4f}")
    print(f"\n  ✅ Mean AUC-ROC: {results['mean_auc_roc']:.4f}")
    print(f"  ✅ Mean F1:      {results['mean_f1']:.4f}")

    # Save
    preprocessor.save()
    joblib.dump(model, ARTIFACTS_DIR / "model.joblib")
    with open(ARTIFACTS_DIR / "eval_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n✅ Artifacts saved to {ARTIFACTS_DIR}")
    return model, preprocessor, results


if __name__ == "__main__":
    train_pipeline()