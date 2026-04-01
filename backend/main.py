"""
main.py — ToxiScan FastAPI Backend
Run with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import json
from pathlib import Path

from models.predict import predictor, TOX21_ENDPOINTS, ENDPOINT_INFO

app = FastAPI(
    title="ToxiScan API",
    description="Drug toxicity prediction using ML + molecular descriptors",
    version="1.0.0",
)

# ── CORS: allow frontend dev server ──────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ──────────────────────────────────────────────
class PredictRequest(BaseModel):
    smiles: str = Field(..., example="CC(=O)Oc1ccccc1C(=O)O",
                        description="SMILES string of the molecule")


class BatchPredictRequest(BaseModel):
    smiles_list: List[str] = Field(..., max_items=50,
                                   description="Up to 50 SMILES strings")


# ── Routes ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ToxiScan API"}


@app.get("/endpoints")
def list_endpoints():
    """List all 12 Tox21 toxicity endpoints with descriptions."""
    return {
        "endpoints": [
            {"id": ep, **ENDPOINT_INFO.get(ep, {})}
            for ep in TOX21_ENDPOINTS
        ]
    }


@app.get("/model-metrics")
def model_metrics():
    """Return training evaluation metrics."""
    metrics_path = Path("artifacts/eval_results.json")
    if not metrics_path.exists():
        raise HTTPException(
            status_code=503,
            detail="Model not trained yet. Run: python models/train.py"
        )
    with open(metrics_path) as f:
        return json.load(f)


@app.post("/predict")
def predict_toxicity(req: PredictRequest):
    """
    Predict toxicity for a single SMILES string.
    Returns probabilities for all 12 Tox21 endpoints + SHAP explanation.
    """
    try:
        result = predictor.predict(req.smiles.strip())
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])

    return result


@app.post("/batch-predict")
def batch_predict(req: BatchPredictRequest):
    """
    Predict toxicity for multiple SMILES (up to 50).
    """
    try:
        predictor.load()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    results = []
    for smi in req.smiles_list:
        try:
            result = predictor.predict(smi.strip())
            results.append(result)
        except Exception as e:
            results.append({"smiles": smi, "error": str(e)})

    return {"results": results, "count": len(results)}


@app.get("/example-molecules")
def example_molecules():
    """Return a few example molecules for UI demos."""
    return {
        "molecules": [
            {"name": "Aspirin",      "smiles": "CC(=O)Oc1ccccc1C(=O)O"},
            {"name": "Caffeine",     "smiles": "Cn1c(=O)c2c(ncn2C)n(c1=O)C"},
            {"name": "Bisphenol A",  "smiles": "CC(c1ccc(O)cc1)(c1ccc(O)cc1)C"},
            {"name": "Benzene",      "smiles": "c1ccccc1"},
            {"name": "Paracetamol",  "smiles": "CC(=O)Nc1ccc(O)cc1"},
            {"name": "Dioxin (TCDD)","smiles": "Clc1cc2c(cc1Cl)Oc1cc(Cl)c(Cl)cc1O2"},
        ]
    }
