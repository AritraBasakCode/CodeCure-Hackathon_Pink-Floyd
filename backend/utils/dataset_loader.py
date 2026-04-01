"""
dataset_loader.py
Loads and merges Tox21 + ZINC250k datasets for training.
"""

import pandas as pd
import numpy as np
import os
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

TOX21_ENDPOINTS = [
    "NR-AR", "NR-AR-LBD", "NR-AhR", "NR-Aromatase",
    "NR-ER", "NR-ER-LBD", "NR-PPAR-gamma",
    "SR-ARE", "SR-ATAD5", "SR-HSE", "SR-MMP", "SR-p53"
]


def load_tox21(path: str = None) -> pd.DataFrame:
    """
    Load the Tox21 dataset.
    Expected columns: smiles, mol_id, NR-AR, NR-AR-LBD, ..., SR-p53
    """
    csv_path = path or DATA_DIR / "tox21.csv"
    df = pd.read_csv(csv_path)

    # Normalize column names
    df.columns = [c.strip() for c in df.columns]

    # Drop rows with no SMILES
    smiles_col = _find_smiles_col(df)
    df = df.dropna(subset=[smiles_col])
    df = df.rename(columns={smiles_col: "smiles"})

    # Keep only valid endpoints present in this file
    available_endpoints = [e for e in TOX21_ENDPOINTS if e in df.columns]
    keep_cols = ["smiles"] + available_endpoints
    df = df[keep_cols]

    print(f"[Tox21] Loaded {len(df)} compounds, {len(available_endpoints)} endpoints.")
    return df


def load_zinc250k(path: str = None, sample_size: int = 10000) -> pd.DataFrame:
    """
    Load ZINC250k for negative-class augmentation & descriptor distribution.
    These are drug-like but generally non-toxic molecules used for balance.
    """
    csv_path = path or DATA_DIR / "zinc250k.csv"
    df = pd.read_csv(csv_path)
    df.columns = [c.strip() for c in df.columns]

    smiles_col = _find_smiles_col(df)
    df = df.dropna(subset=[smiles_col])
    df = df.rename(columns={smiles_col: "smiles"})

    # Sample to avoid memory issues
    if len(df) > sample_size:
        df = df.sample(n=sample_size, random_state=42)

    # Add all-zero labels (assumed non-toxic for augmentation)
    for ep in TOX21_ENDPOINTS:
        df[ep] = 0

    print(f"[ZINC250k] Loaded {len(df)} molecules for augmentation.")
    return df[["smiles"] + TOX21_ENDPOINTS]


def load_combined(tox21_path=None, zinc_path=None,
                  zinc_sample=5000) -> pd.DataFrame:
    """
    Merge Tox21 (labeled) + ZINC250k (negative augmentation).
    Returns a unified DataFrame ready for feature extraction.
    """
    tox21_df = load_tox21(tox21_path)
    zinc_df = load_zinc250k(zinc_path, sample_size=zinc_sample)

    # Tag source
    tox21_df["source"] = "tox21"
    zinc_df["source"] = "zinc"

    combined = pd.concat([tox21_df, zinc_df], ignore_index=True)
    combined = combined.drop_duplicates(subset=["smiles"])
    print(f"[Combined] Total: {len(combined)} compounds.")
    return combined


def _find_smiles_col(df: pd.DataFrame) -> str:
    """Heuristically find the SMILES column."""
    for candidate in ["smiles", "SMILES", "Smiles", "canonical_smiles"]:
        if candidate in df.columns:
            return candidate
    # Fallback: first column that looks like SMILES
    for col in df.columns:
        sample = df[col].dropna().iloc[0] if len(df) > 0 else ""
        if isinstance(sample, str) and any(c in sample for c in ["C", "N", "O", "c", "n"]):
            return col
    raise ValueError("Cannot find SMILES column in dataset.")


if __name__ == "__main__":
    df = load_tox21()
    print(df.head())
    print(df[TOX21_ENDPOINTS].describe())
