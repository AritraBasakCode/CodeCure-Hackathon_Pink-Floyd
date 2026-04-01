import React from 'react';
import { Link } from 'react-router-dom';

const STATS = [
  { value: '12', label: 'Tox21 Endpoints', sub: 'Nuclear receptor + stress response' },
  { value: '7K+', label: 'Training Compounds', sub: 'Tox21 labeled molecules' },
  { value: '200+', label: 'Molecular Descriptors', sub: 'RDKit computed features' },
  { value: '~0.85', label: 'Mean AUC-ROC', sub: 'Across all endpoints' },
];

const FEATURES = [
  {
    icon: '🧬',
    title: 'Multi-Label Prediction',
    desc: 'Simultaneously predicts toxicity across 12 biological assay endpoints from Tox21.',
  },
  {
    icon: '🔬',
    title: '200+ Molecular Descriptors',
    desc: 'RDKit-computed features: LogP, TPSA, chi indices, QED, ring counts, partial charges, and more.',
  },
  {
    icon: '🤖',
    title: 'XGBoost + SHAP',
    desc: 'Gradient-boosted tree model with SHAP-based explainability to pinpoint which molecular properties drive toxicity.',
  },
  {
    icon: '💊',
    title: 'Lipinski Drug-Likeness',
    desc: 'Evaluates Rule-of-Five compliance and QED score alongside toxicity prediction.',
  },
  {
    icon: '📊',
    title: 'ZINC250k Augmentation',
    desc: 'ZINC250k drug-like molecules used for negative-class balancing, improving model recall on non-toxic compounds.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Inference',
    desc: 'Instant predictions via FastAPI backend — paste a SMILES, get results in under a second.',
  },
];

const PIPELINE = [
  { step: '01', label: 'SMILES Input', desc: 'User provides a chemical structure string' },
  { step: '02', label: 'Descriptor Computation', desc: 'RDKit computes 200+ molecular features' },
  { step: '03', label: 'Preprocessing', desc: 'Imputation, variance filter, standard scaling' },
  { step: '04', label: 'XGBoost Inference', desc: 'Multi-output classifier scores all 12 endpoints' },
  { step: '05', label: 'SHAP Explanation', desc: 'TreeExplainer identifies key driving features' },
  { step: '06', label: 'Results Dashboard', desc: 'Radar chart, bar charts, risk summary' },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section style={{
        padding: '80px 24px 60px',
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
      }}>
        {/* Decorative glow */}
        <div style={{
          position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 200,
          background: 'radial-gradient(ellipse, rgba(0,229,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div className="badge badge-cyan" style={{ marginBottom: 20, display: 'inline-flex' }}>
            Hackathon Project · Pharmacology + AI
          </div>

          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
            Predict Drug Toxicity<br />
            <span style={{ color: 'var(--cyan)' }}>Before It Fails in Trials</span>
          </h1>

          <p style={{
            fontSize: 17, color: 'var(--text-2)', maxWidth: 620, margin: '0 auto 36px',
            lineHeight: 1.7, fontFamily: 'var(--font-mono)',
          }}>
            ML-powered toxicity screening using chemical structure &amp; molecular descriptor data from the{' '}
            <span style={{ color: 'var(--cyan)' }}>Tox21</span> and{' '}
            <span style={{ color: 'var(--purple)' }}>ZINC250k</span> datasets.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/predict" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 15 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Start Predicting
            </Link>
            <Link to="/about" className="btn btn-outline" style={{ padding: '14px 32px', fontSize: 15 }}>
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '0 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {STATS.map(({ value, label, sub }) => (
            <div key={label} className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                {value}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ML Pipeline */}
      <section style={{ padding: '0 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
          ML Pipeline
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 0,
          position: 'relative',
        }}>
          {PIPELINE.map(({ step, label, desc }, i) => (
            <div key={step} style={{ position: 'relative' }}>
              {/* connector line */}
              {i < PIPELINE.length - 1 && (
                <div style={{
                  position: 'absolute', top: 20, right: 0, width: '50%',
                  height: 1, background: 'linear-gradient(to right, var(--border2), transparent)',
                  zIndex: 0,
                }} />
              )}
              <div style={{
                padding: '20px 16px',
                background: 'var(--bg3)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                margin: '0 4px',
                position: 'relative', zIndex: 1,
              }}>
                <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: 8 }}>
                  {step}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="card" style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
