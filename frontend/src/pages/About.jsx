import React from 'react';

const TOX21_ENDPOINTS = [
  { id: 'NR-AR',         full: 'Androgen Receptor',              cat: 'Nuclear Receptor', desc: 'Key target in prostate cancer and endocrine disruption.' },
  { id: 'NR-AR-LBD',     full: 'Androgen Receptor LBD',          cat: 'Nuclear Receptor', desc: 'Ligand binding domain of androgen receptor.' },
  { id: 'NR-AhR',        full: 'Aryl Hydrocarbon Receptor',       cat: 'Nuclear Receptor', desc: 'Activated by dioxins and polycyclic aromatic hydrocarbons.' },
  { id: 'NR-Aromatase',  full: 'Aromatase',                       cat: 'Nuclear Receptor', desc: 'Enzyme involved in estrogen biosynthesis.' },
  { id: 'NR-ER',         full: 'Estrogen Receptor Alpha',         cat: 'Nuclear Receptor', desc: 'Primary mediator of estrogen-dependent signaling.' },
  { id: 'NR-ER-LBD',     full: 'Estrogen Receptor LBD',           cat: 'Nuclear Receptor', desc: 'Ligand binding domain of estrogen receptor.' },
  { id: 'NR-PPAR-gamma', full: 'PPAR Gamma',                      cat: 'Nuclear Receptor', desc: 'Regulates fatty acid storage and glucose metabolism.' },
  { id: 'SR-ARE',        full: 'Antioxidant Response Element',    cat: 'Stress Response',  desc: 'Induced by oxidative stress and electrophilic compounds.' },
  { id: 'SR-ATAD5',      full: 'ATAD5 (Genotoxicity)',            cat: 'Stress Response',  desc: 'Marker for DNA damage and genotoxic compounds.' },
  { id: 'SR-HSE',        full: 'Heat Shock Factor Response',      cat: 'Stress Response',  desc: 'Triggered by proteotoxic stress.' },
  { id: 'SR-MMP',        full: 'Mitochondrial Membrane Potential',cat: 'Stress Response',  desc: 'Indicates mitochondrial dysfunction.' },
  { id: 'SR-p53',        full: 'p53 Tumor Suppressor',            cat: 'Stress Response',  desc: 'Key mediator of cell cycle arrest and apoptosis.' },
];

const DATASETS = [
  {
    name: 'Tox21 Dataset',
    role: 'Primary (Labeled Training Data)',
    link: 'https://www.kaggle.com/datasets/epicskills/tox21-dataset',
    color: 'var(--cyan)',
    points: [
      '~8,000 chemical compounds',
      '12 toxicity endpoints (binary labels)',
      'Nuclear receptor & stress response assays',
      'Used for supervised multi-label training',
    ],
  },
  {
    name: 'ZINC250k Dataset',
    role: 'Secondary (Negative Augmentation)',
    link: 'https://www.kaggle.com/datasets/basu369victor/zinc250k',
    color: 'var(--purple)',
    points: [
      '250,000 drug-like molecules',
      'No toxicity labels (treated as negative class)',
      'Improves class balance for non-toxic compounds',
      'Descriptor distribution analysis & QED validation',
    ],
  },
];

export default function About() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>About ToxiScan</h1>
      <p style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 13, marginBottom: 40 }}>
        Architecture, datasets, and model methodology
      </p>

      {/* Datasets */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>📦 Datasets</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {DATASETS.map(({ name, role, link, color, points }) => (
            <div key={name} className="card" style={{ borderColor: color + '44' }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color, marginBottom: 4 }}>{name}</div>
                <div className="badge" style={{ background: color + '15', color, borderColor: color + '40', fontSize: 10 }}>
                  {role}
                </div>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {points.map(p => (
                  <li key={p} style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', display: 'flex', gap: 8 }}>
                    <span style={{ color }}>→</span> {p}
                  </li>
                ))}
              </ul>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                style={{ marginTop: 14, display: 'inline-block', fontSize: 11, color, fontFamily: 'var(--font-mono)', textDecoration: 'none' }}
              >
                View on Kaggle ↗
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Model Architecture */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>🤖 Model Architecture</h2>
        <div className="card" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          {[
            ['Algorithm',       'XGBoostClassifier wrapped in MultiOutputClassifier'],
            ['n_estimators',    '300 trees per endpoint'],
            ['max_depth',       '6'],
            ['learning_rate',   '0.05'],
            ['subsample',       '0.8'],
            ['colsample_bytree','0.8'],
            ['Fallback',        'RandomForestClassifier (if XGBoost unavailable)'],
            ['Explainability',  'SHAP TreeExplainer (per-prediction feature attribution)'],
            ['Class Imbalance', 'ZINC250k negative augmentation + scale_pos_weight'],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', gap: 16, padding: '10px 0',
              borderBottom: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}>
              <span style={{ color: 'var(--cyan)', minWidth: 160 }}>{k}</span>
              <span style={{ color: 'var(--text-2)' }}>{v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Preprocessing */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>⚙️ Feature Engineering</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {[
            { title: '1. Descriptor Computation', body: 'RDKit computes 200+ molecular descriptors: physicochemical (MW, LogP, TPSA), topological (Chi indices, Balaban J), constitutional (heavy atom count, ring counts), and electronic (partial charges, valence electrons).' },
            { title: '2. Imputation', body: 'Missing descriptor values are filled using median imputation (SimpleImputer), ensuring all molecules have complete feature vectors even when RDKit fails on specific descriptors.' },
            { title: '3. Variance Filtering', body: 'Low-variance descriptors (threshold 0.01) are removed to eliminate near-constant features that add noise without contributing predictive signal.' },
            { title: '4. Standard Scaling', body: 'All features are standardized (zero mean, unit variance) using StandardScaler, ensuring no single descriptor dominates due to scale differences.' },
          ].map(({ title, body }) => (
            <div key={title} className="card">
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--cyan)', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', lineHeight: 1.7 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tox21 Endpoints */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>🧬 Tox21 Endpoints</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TOX21_ENDPOINTS.map(({ id, full, cat, desc }) => (
            <div key={id} className="card" style={{ padding: '14px 18px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 130 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: 'var(--cyan)' }}>{id}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{full}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{desc}</div>
              </div>
              <span className={`badge ${cat === 'Nuclear Receptor' ? 'badge-purple' : 'badge-cyan'}`} style={{ flexShrink: 0 }}>
                {cat}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>🛠 Tech Stack</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { layer: 'ML', tools: ['XGBoost', 'scikit-learn', 'SHAP', 'imbalanced-learn'] },
            { layer: 'Chemistry', tools: ['RDKit', 'SMILES parsing', 'Descriptor calc', 'QED scoring'] },
            { layer: 'Backend', tools: ['FastAPI', 'Uvicorn', 'Pydantic', 'Joblib'] },
            { layer: 'Frontend', tools: ['React 18', 'Recharts', 'React Router', 'Vite'] },
          ].map(({ layer, tools }) => (
            <div key={layer} className="card">
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {layer}
              </div>
              {tools.map(t => (
                <div key={t} style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-2)', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                  {t}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
