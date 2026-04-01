# ToxiScan — Architecture Documentation

## System Overview

```
                    ┌─────────────────────────────┐
                    │       User Browser           │
                    │   React + Recharts + Vite    │
                    └────────────┬────────────────┘
                                 │ HTTP (port 5173 → proxy → 8000)
                    ┌────────────▼────────────────┐
                    │       FastAPI Backend        │
                    │       (port 8000)            │
                    │  ┌─────────────────────────┐ │
                    │  │   /predict              │ │
                    │  │   /batch-predict        │ │
                    │  │   /model-metrics        │ │
                    │  │   /example-molecules    │ │
                    │  └──────────┬──────────────┘ │
                    └─────────────┼───────────────┘
                                  │
          ┌───────────────────────▼───────────────────────┐
          │               Prediction Pipeline              │
          │                                               │
          │  SMILES → [RDKit Descriptors] → [Preprocessor]│
          │         → [XGBoost MultiOutput] → [SHAP]      │
          └───────────────────────────────────────────────┘
```

## Component Details

### Frontend (React)
- **Home.jsx** — Landing page with project overview, pipeline visualization, stats
- **Predict.jsx** — Main prediction interface with tabbed results display
- **About.jsx** — Dataset and methodology documentation
- **MoleculeInput.jsx** — SMILES text input with example molecule picker
- **ToxicityRadar.jsx** — Recharts RadarChart across all 12 Tox21 endpoints
- **FeatureImportanceChart.jsx** — Horizontal bar chart of SHAP values
- **ResultCard.jsx** — Gauge chart, endpoint grid, molecular properties panel
- **Navbar.jsx** — Sticky navigation with scroll-aware styling

### Backend (FastAPI)
- **main.py** — API routes, CORS config, Pydantic models
- **models/predict.py** — `ToxicityPredictor` singleton with lazy artifact loading
- **models/train.py** — Full training pipeline (descriptor → preprocess → train → eval)
- **utils/molecular.py** — RDKit descriptor computation (200+ features)
- **utils/preprocessing.py** — Imputer + variance filter + scaler pipeline
- **utils/dataset_loader.py** — Tox21 + ZINC250k loading and merging

### ML Pipeline

```
Input SMILES
    │
    ▼ RDKit (rdkit.Chem.Descriptors, rdMolDescriptors, Crippen, etc.)
200+ Molecular Descriptors
    │
    ▼ SimpleImputer (median)
Imputed Features
    │
    ▼ VarianceThreshold (0.01)
Filtered Features (~150-180)
    │
    ▼ StandardScaler
Normalized Features
    │
    ▼ XGBoostClassifier × 12 (MultiOutputClassifier)
Toxicity Probabilities [12]
    │
    ├──▶ SHAP TreeExplainer → Top feature attributions
    └──▶ Lipinski RoF check → Drug-likeness flags
```

## API Contract

### POST /predict
**Request:**
```json
{ "smiles": "CC(=O)Oc1ccccc1C(=O)O" }
```

**Response:**
```json
{
  "smiles": "...",
  "overall_toxicity_score": 0.12,
  "overall_risk": "Minimal",
  "highest_risk_endpoint": "NR-AhR",
  "highest_risk_probability": 0.23,
  "endpoints": {
    "NR-AR": {
      "probability": 0.08,
      "label": "Non-Toxic",
      "risk": "Minimal",
      "full": "Androgen Receptor",
      "category": "Nuclear Receptor"
    }
  },
  "lipinski": {
    "MW": 180.16,
    "LogP": 1.19,
    "HBD": 1,
    "HBA": 4,
    "violations": [],
    "drug_like": true
  },
  "shap_top_features": [
    { "feature": "NumAromaticRings", "shap_value": 0.031, "impact": "positive" }
  ],
  "molecular_descriptors": {
    "MW": 180.16, "LogP": 1.19, "TPSA": 63.6,
    "HBD": 1, "HBA": 4, "RotBonds": 3,
    "ArRings": 1, "QED": 0.58
  }
}
```

## Training Configuration

| Parameter | Value |
|-----------|-------|
| Train/Val/Test split | 70/10/20 |
| Random state | 42 |
| ZINC250k sample size | 5,000 (for augmentation) |
| XGB n_estimators | 300 |
| XGB max_depth | 6 |
| XGB learning_rate | 0.05 |
| XGB subsample | 0.8 |
| Variance filter threshold | 0.01 |
| Missing value strategy | Median imputation |

## Expected Performance

| Endpoint | AUC-ROC (expected) |
|----------|--------------------|
| NR-AhR   | ~0.88              |
| SR-MMP   | ~0.87              |
| SR-p53   | ~0.85              |
| NR-ER    | ~0.82              |
| NR-AR    | ~0.80              |
| Mean     | ~0.83-0.86         |
