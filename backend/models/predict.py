"""
predict.py
Load trained artifacts and run inference on new SMILES strings.
"""

import numpy as np
import pandas as pd
import joblib
import json
from pathlib import Path
from typing import List, Dict, Optional

import sys
_BACKEND_DIR = Path(__file__).parent.parent
ARTIFACTS_DIR = _BACKEND_DIR / "artifacts"
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))
TOX21_ENDPOINTS = [
    "NR-AR", "NR-AR-LBD", "NR-AhR", "NR-Aromatase",
    "NR-ER", "NR-ER-LBD", "NR-PPAR-gamma",
    "SR-ARE", "SR-ATAD5", "SR-HSE", "SR-MMP", "SR-p53"
]

# Endpoint descriptions for the UI
ENDPOINT_INFO = {
    "NR-AR":        {"full": "Androgen Receptor",            "category": "Nuclear Receptor"},
    "NR-AR-LBD":    {"full": "Androgen Receptor LBD",        "category": "Nuclear Receptor"},
    "NR-AhR":       {"full": "Aryl Hydrocarbon Receptor",    "category": "Nuclear Receptor"},
    "NR-Aromatase": {"full": "Aromatase",                    "category": "Nuclear Receptor"},
    "NR-ER":        {"full": "Estrogen Receptor Alpha",      "category": "Nuclear Receptor"},
    "NR-ER-LBD":    {"full": "Estrogen Receptor LBD",        "category": "Nuclear Receptor"},
    "NR-PPAR-gamma":{"full": "PPAR Gamma",                   "category": "Nuclear Receptor"},
    "SR-ARE":       {"full": "Antioxidant Response Element", "category": "Stress Response"},
    "SR-ATAD5":     {"full": "ATAD5 (Genotoxicity)",         "category": "Stress Response"},
    "SR-HSE":       {"full": "Heat Shock Factor Response",   "category": "Stress Response"},
    "SR-MMP":       {"full": "Mitochondrial Membrane Potential","category":"Stress Response"},
    "SR-p53":       {"full": "p53 Tumor Suppressor",         "category": "Stress Response"},
}


class ToxicityPredictor:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.feature_meta = None
        self._loaded = False

    def load(self):
        """Lazy-load artifacts on first use."""
        if self._loaded:
            return
        try:
            self.model = joblib.load(ARTIFACTS_DIR / "model.joblib")
            self.preprocessor = joblib.load(ARTIFACTS_DIR / "preprocessor.joblib")
            with open(ARTIFACTS_DIR / "feature_meta.json") as f:
                self.feature_meta = json.load(f)
            self._loaded = True
            print("[Predictor] Artifacts loaded successfully.")
        except FileNotFoundError:
            raise RuntimeError(
                "Model artifacts not found. Run `python models/train.py` first."
            )

    def predict(self, smiles: str) -> Dict:
        """
        Full prediction pipeline for a single SMILES string.
        Returns probabilities for each Tox21 endpoint + SHAP explanation.
        """
        self.load()

        from utils.molecular import compute_descriptors, get_lipinski_violations

        # 1. Compute descriptors
        desc = compute_descriptors(smiles)
        if desc is None:
            return {"error": "Invalid SMILES string. Cannot parse molecule."}

        desc_df = pd.DataFrame([desc])

        # 2. Preprocess
        X = self.preprocessor.transform(desc_df)

        # 3. Predict probabilities for each endpoint
        predictions = {}
        for i, ep in enumerate(TOX21_ENDPOINTS):
            estimator = self.model.estimators_[i]
            prob = estimator.predict_proba(X)[0]
            toxic_prob = float(prob[1]) if prob.shape[0] > 1 else float(prob[0])
            predictions[ep] = {
                "probability": round(toxic_prob, 4),
                "label": "Toxic" if toxic_prob >= 0.5 else "Non-Toxic",
                "risk": self._risk_level(toxic_prob),
                **ENDPOINT_INFO.get(ep, {}),
            }

        # 4. Overall toxicity score (mean of all probabilities)
        all_probs = [v["probability"] for v in predictions.values()]
        overall_score = round(float(np.mean(all_probs)), 4)
        max_prob = max(all_probs)
        max_ep = TOX21_ENDPOINTS[np.argmax(all_probs)]

        # 5. Lipinski + drug-likeness
        lipinski = get_lipinski_violations(smiles)

        # 6. SHAP explanation
        shap_values = self._get_shap(X)

        return {
            "smiles": smiles,
            "overall_toxicity_score": overall_score,
            "overall_risk": self._risk_level(overall_score),
            "highest_risk_endpoint": max_ep,
            "highest_risk_probability": round(max_prob, 4),
            "endpoints": predictions,
            "lipinski": lipinski,
            "shap_top_features": shap_values,
            "molecular_descriptors": {
                "MW": round(desc.get("MolWt", 0), 2),
                "LogP": round(desc.get("LogP", 0), 2),
                "TPSA": round(desc.get("TPSA", 0), 2),
                "HBD": int(desc.get("NumHDonors", 0)),
                "HBA": int(desc.get("NumHAcceptors", 0)),
                "RotBonds": int(desc.get("NumRotatableBonds", 0)),
                "ArRings": int(desc.get("NumAromaticRings", 0)),
                "QED": round(desc.get("qed", 0), 3),
            },
        }

    def _get_shap(self, X: np.ndarray, top_n: int = 15) -> List[Dict]:
        """Compute SHAP values using first estimator (most important endpoint)."""
        try:
            import shap
            # Use first estimator as representative
            explainer = shap.TreeExplainer(self.model.estimators_[0])
            shap_vals = explainer.shap_values(X)

            # shap_vals may be (n_classes, n_samples, n_features) or (n_samples, n_features)
            if isinstance(shap_vals, list):
                sv = shap_vals[1][0]  # class 1 (toxic) for first sample
            else:
                sv = shap_vals[0]

            feature_names = self.feature_meta.get("feature_names_out", [])
            if len(feature_names) != len(sv):
                return []

            pairs = sorted(
                zip(feature_names, sv.tolist()),
                key=lambda x: abs(x[1]),
                reverse=True
            )[:top_n]

            return [
                {"feature": name, "shap_value": round(val, 5), "impact": "positive" if val > 0 else "negative"}
                for name, val in pairs
            ]
        except Exception as e:
            return [{"error": f"SHAP unavailable: {str(e)}"}]

    @staticmethod
    def _risk_level(prob: float) -> str:
        if prob >= 0.75:
            return "High"
        elif prob >= 0.5:
            return "Moderate"
        elif prob >= 0.25:
            return "Low"
        else:
            return "Minimal"


# Singleton
predictor = ToxicityPredictor()