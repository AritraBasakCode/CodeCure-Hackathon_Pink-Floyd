"""
molecular.py
Compute 200+ molecular descriptors from SMILES using RDKit.
"""

import numpy as np
import pandas as pd
from typing import Optional, List, Dict, Any

try:
    from rdkit import Chem
    from rdkit.Chem import Descriptors, rdMolDescriptors, GraphDescriptors
    from rdkit.Chem import Lipinski, Crippen, QED
    from rdkit.Chem.rdMolDescriptors import CalcTPSA
    from rdkit.ML.Descriptors import MoleculeDescriptors
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False
    print("WARNING: RDKit not available. Install with: pip install rdkit")


# ── Core descriptor names we compute manually (always included) ──────────────
CORE_DESCRIPTORS = [
    "MolWt", "ExactMolWt", "LogP", "MolMR",
    "TPSA", "NumHDonors", "NumHAcceptors",
    "NumRotatableBonds", "NumAromaticRings", "NumSaturatedRings",
    "NumAliphaticRings", "RingCount", "NumHeteroatoms",
    "HeavyAtomCount", "FractionCSP3",
    "NumValenceElectrons", "MaxAbsPartialCharge", "MinAbsPartialCharge",
    "NumAromaticCarbocycles", "NumAromaticHeterocycles",
    "NumSaturatedCarbocycles", "NumSaturatedHeterocycles",
    "NumAliphaticCarbocycles", "NumAliphaticHeterocycles",
    "qed",  # Drug-likeness score
]


def smiles_to_mol(smiles: str) -> Optional[Any]:
    """Convert SMILES string to RDKit Mol object."""
    if not RDKIT_AVAILABLE:
        raise RuntimeError("RDKit is not installed.")
    mol = Chem.MolFromSmiles(smiles)
    return mol


def compute_descriptors(smiles: str) -> Dict[str, float]:
    """
    Compute all molecular descriptors for a single SMILES string.
    Returns a dict of {descriptor_name: value}.
    Returns None if SMILES is invalid.
    """
    mol = smiles_to_mol(smiles)
    if mol is None:
        return None

    desc = {}

    # ── Core properties ───────────────────────────────────────────────────────
    desc["MolWt"] = Descriptors.MolWt(mol)
    desc["ExactMolWt"] = Descriptors.ExactMolWt(mol)
    desc["LogP"] = Crippen.MolLogP(mol)
    desc["MolMR"] = Crippen.MolMR(mol)
    desc["TPSA"] = CalcTPSA(mol)
    desc["NumHDonors"] = Lipinski.NumHDonors(mol)
    desc["NumHAcceptors"] = Lipinski.NumHAcceptors(mol)
    desc["NumRotatableBonds"] = Lipinski.NumRotatableBonds(mol)
    desc["HeavyAtomCount"] = mol.GetNumHeavyAtoms()
    desc["NumHeteroatoms"] = rdMolDescriptors.CalcNumHeteroatoms(mol)
    desc["RingCount"] = rdMolDescriptors.CalcNumRings(mol)
    desc["NumAromaticRings"] = rdMolDescriptors.CalcNumAromaticRings(mol)
    desc["NumSaturatedRings"] = rdMolDescriptors.CalcNumSaturatedRings(mol)
    desc["NumAliphaticRings"] = rdMolDescriptors.CalcNumAliphaticRings(mol)
    desc["FractionCSP3"] = rdMolDescriptors.CalcFractionCSP3(mol)
    desc["NumAromaticCarbocycles"] = rdMolDescriptors.CalcNumAromaticCarbocycles(mol)
    desc["NumAromaticHeterocycles"] = rdMolDescriptors.CalcNumAromaticHeterocycles(mol)
    desc["NumSaturatedCarbocycles"] = rdMolDescriptors.CalcNumSaturatedCarbocycles(mol)
    desc["NumSaturatedHeterocycles"] = rdMolDescriptors.CalcNumSaturatedHeterocycles(mol)
    desc["NumAliphaticCarbocycles"] = rdMolDescriptors.CalcNumAliphaticCarbocycles(mol)
    desc["NumAliphaticHeterocycles"] = rdMolDescriptors.CalcNumAliphaticHeterocycles(mol)
    desc["NumValenceElectrons"] = Descriptors.NumValenceElectrons(mol)

    # QED drug-likeness
    try:
        desc["qed"] = QED.qed(mol)
    except Exception:
        desc["qed"] = np.nan

    # ── Partial charges ───────────────────────────────────────────────────────
    try:
        desc["MaxAbsPartialCharge"] = Descriptors.MaxAbsPartialCharge(mol)
        desc["MinAbsPartialCharge"] = Descriptors.MinAbsPartialCharge(mol)
        desc["MaxPartialCharge"] = Descriptors.MaxPartialCharge(mol)
        desc["MinPartialCharge"] = Descriptors.MinPartialCharge(mol)
    except Exception:
        for k in ["MaxAbsPartialCharge", "MinAbsPartialCharge",
                  "MaxPartialCharge", "MinPartialCharge"]:
            desc[k] = np.nan

    # ── Topological / graph descriptors ──────────────────────────────────────
    desc["BalabanJ"] = GraphDescriptors.BalabanJ(mol)
    desc["BertzCT"] = GraphDescriptors.BertzCT(mol)
    desc["Chi0"] = GraphDescriptors.Chi0(mol)
    desc["Chi1"] = GraphDescriptors.Chi1(mol)
    desc["Chi0n"] = GraphDescriptors.Chi0n(mol)
    desc["Chi1n"] = GraphDescriptors.Chi1n(mol)
    desc["Chi2n"] = GraphDescriptors.Chi2n(mol)
    desc["Chi3n"] = GraphDescriptors.Chi3n(mol)
    desc["Chi4n"] = GraphDescriptors.Chi4n(mol)
    desc["Chi0v"] = GraphDescriptors.Chi0v(mol)
    desc["Chi1v"] = GraphDescriptors.Chi1v(mol)
    desc["Chi2v"] = GraphDescriptors.Chi2v(mol)
    desc["Chi3v"] = GraphDescriptors.Chi3v(mol)
    desc["Chi4v"] = GraphDescriptors.Chi4v(mol)
    desc["Kappa1"] = GraphDescriptors.Kappa1(mol)
    desc["Kappa2"] = GraphDescriptors.Kappa2(mol)
    desc["Kappa3"] = GraphDescriptors.Kappa3(mol)
    desc["HallKierAlpha"] = GraphDescriptors.HallKierAlpha(mol)

    # ── Additional RDKit descriptors (full list) ──────────────────────────────
    calculator = MoleculeDescriptors.MolecularDescriptorCalculator(
        [d[0] for d in Descriptors.descList]
    )
    try:
        all_descs = calculator.CalcDescriptors(mol)
        for name, val in zip(calculator.GetDescriptorNames(), all_descs):
            if name not in desc:
                desc[name] = val if np.isfinite(val) else np.nan
    except Exception:
        pass  # Partial failure OK

    return desc


def compute_descriptors_batch(smiles_list: List[str],
                               show_progress: bool = True) -> pd.DataFrame:
    """
    Compute descriptors for a list of SMILES strings.
    Invalid SMILES are filled with NaN rows.
    """
    records = []
    total = len(smiles_list)

    for i, smi in enumerate(smiles_list):
        if show_progress and i % 500 == 0:
            print(f"  Computing descriptors: {i}/{total}")
        try:
            desc = compute_descriptors(smi)
            if desc is not None:
                desc["smiles"] = smi
                desc["valid"] = True
            else:
                desc = {"smiles": smi, "valid": False}
        except Exception as e:
            desc = {"smiles": smi, "valid": False}
        records.append(desc)

    df = pd.DataFrame(records)
    return df


def get_lipinski_violations(smiles: str) -> Dict[str, Any]:
    """
    Check Lipinski Rule-of-Five violations.
    """
    mol = smiles_to_mol(smiles)
    if mol is None:
        return {"error": "Invalid SMILES"}

    mw = Descriptors.MolWt(mol)
    logp = Crippen.MolLogP(mol)
    hbd = Lipinski.NumHDonors(mol)
    hba = Lipinski.NumHAcceptors(mol)

    violations = []
    if mw > 500:
        violations.append(f"MW={mw:.1f} > 500")
    if logp > 5:
        violations.append(f"LogP={logp:.2f} > 5")
    if hbd > 5:
        violations.append(f"HBD={hbd} > 5")
    if hba > 10:
        violations.append(f"HBA={hba} > 10")

    return {
        "MW": round(mw, 2),
        "LogP": round(logp, 2),
        "HBD": hbd,
        "HBA": hba,
        "violations": violations,
        "drug_like": len(violations) <= 1,
    }
