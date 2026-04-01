# 🧬 ToxiScan — Drug Toxicity Prediction Platform

A machine learning web application that predicts potential drug toxicity using chemical structure and molecular descriptor data from the **Tox21** and **ZINC250k** datasets.

---

## 📁 Project Structure

```
drug-tox-app/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt         # Python dependencies
│   ├── models/
│   │   ├── train.py             # Model training pipeline
│   │   ├── predict.py           # Inference logic
│   │   └── feature_importance.py# SHAP explainability
│   ├── utils/
│   │   ├── molecular.py         # RDKit descriptor computation
│   │   ├── preprocessing.py     # Data cleaning & encoding
│   │   └── dataset_loader.py    # Tox21 + ZINC250k loaders
│   └── data/                    # Place Kaggle CSVs here
│       ├── tox21.csv
│       └── zinc250k.csv
├── frontend/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       │   ├── MoleculeInput.jsx
│       │   ├── ToxicityRadar.jsx
│       │   ├── FeatureImportanceChart.jsx
│       │   ├── ResultCard.jsx
│       │   └── Navbar.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Predict.jsx
│       │   └── About.jsx
│       └── utils/
│           └── api.js
├── notebooks/
│   └── EDA_and_Training.ipynb   # Full EDA + model training notebook
└── docs/
    └── architecture.md
```

---

## 🚀 Quick Start

### 1. Download Datasets
Place the following Kaggle CSVs in `backend/data/`:
- `tox21.csv` → from https://www.kaggle.com/datasets/epicskills/tox21-dataset
- `zinc250k.csv` → from https://www.kaggle.com/datasets/basu369victor/zinc250k

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Train the model (first time)
python models/train.py

# Start API server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev   # Runs on http://localhost:5173
```

---

## 🧠 ML Pipeline

| Step | Detail |
|------|--------|
| **Features** | 200+ RDKit molecular descriptors (MW, LogP, TPSA, HBD, HBA, rotatable bonds, ring counts, etc.) |
| **Primary Model** | XGBoost multi-label classifier (12 Tox21 endpoints) |
| **Secondary** | Random Forest for feature importance cross-validation |
| **Explainability** | SHAP TreeExplainer for per-prediction feature contributions |
| **Augmentation** | ZINC250k used for negative class balancing & descriptor distribution analysis |

### Tox21 Endpoints Predicted
`NR-AR`, `NR-AR-LBD`, `NR-AhR`, `NR-Aromatase`, `NR-ER`, `NR-ER-LBD`, `NR-PPAR-gamma`, `SR-ARE`, `SR-ATAD5`, `SR-HSE`, `SR-MMP`, `SR-p53`

---

## 🔬 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/predict` | Predict toxicity from SMILES string |
| `GET` | `/health` | Health check |
| `GET` | `/endpoints` | List all 12 Tox21 targets |
| `POST` | `/batch-predict` | Predict for multiple SMILES |

---

## 📊 Model Performance (Expected)
- **AUC-ROC**: ~0.82–0.88 across endpoints
- **F1-Score**: ~0.74–0.80
- Best endpoints: `SR-MMP`, `NR-AhR`
