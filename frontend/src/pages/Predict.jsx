import React, { useState } from 'react';
import MoleculeInput from '../components/MoleculeInput';
import ToxicityRadar from '../components/ToxicityRadar';
import FeatureImportanceChart from '../components/FeatureImportanceChart';
import {
  OverallRiskCard,
  EndpointGrid,
  MolecularPropertiesCard,
} from '../components/ResultCard';
import { predictToxicity } from '../utils/api';

const RISK_COLORS = {
  High: 'var(--red)',
  Moderate: 'var(--amber)',
  Low: 'var(--cyan)',
  Minimal: 'var(--green)',
};

export default function Predict() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handlePredict = async (smiles) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await predictToxicity(smiles);
      setResult(data);
      setActiveTab('overview');
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Prediction failed. Make sure the backend is running on port 8000.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const tabs = ['overview', 'endpoints', 'explainability', 'properties'];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
          Toxicity Predictor
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
          Enter a SMILES string to predict toxicity across 12 Tox21 endpoints
        </p>
      </div>

      {/* Input */}
      <div style={{ marginBottom: 32 }}>
        <MoleculeInput onSubmit={handlePredict} loading={loading} />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: 24,
          padding: '16px 20px',
          background: 'rgba(255,59,107,0.08)',
          border: '1px solid rgba(255,59,107,0.4)',
          borderRadius: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚠</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>Prediction Error</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{error}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                Make sure the backend is running: <code style={{ color: 'var(--cyan)' }}>uvicorn main:app --reload --port 8000</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[200, 120, 300].map((h, i) => (
            <div key={i} style={{
              height: h,
              background: 'var(--surface)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.04), transparent)',
                animation: 'shimmer 1.5s infinite',
              }} />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="animate-in">
          {/* SMILES display */}
          <div style={{
            marginBottom: 24,
            padding: '12px 16px',
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              SMILES
            </span>
            <code style={{ fontSize: 13, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
              {result.smiles}
            </code>
            <span style={{
              marginLeft: 'auto',
              padding: '4px 12px',
              background: RISK_COLORS[result.overall_risk] + '22',
              border: `1px solid ${RISK_COLORS[result.overall_risk]}55`,
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              color: RISK_COLORS[result.overall_risk],
              fontFamily: 'var(--font-mono)',
            }}>
              {result.overall_risk} Risk
            </span>
          </div>

          {/* Tab nav */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 18px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--cyan)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--cyan)' : 'var(--text-3)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <OverallRiskCard result={result} />
              </div>
              <ToxicityRadar endpoints={result.endpoints} />
            </div>
          )}

          {activeTab === 'endpoints' && (
            <EndpointGrid endpoints={result.endpoints} />
          )}

          {activeTab === 'explainability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <FeatureImportanceChart shapFeatures={result.shap_top_features} />
              <div className="card" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 10, fontFamily: 'var(--font-display)', fontSize: 14 }}>
                  How to Read SHAP Values
                </div>
                <div style={{ color: 'var(--text-2)', lineHeight: 1.8 }}>
                  <div>• <span style={{ color: 'var(--red)' }}>Positive SHAP</span> → feature pushes prediction toward <strong>toxic</strong></div>
                  <div>• <span style={{ color: 'var(--green)' }}>Negative SHAP</span> → feature pushes prediction toward <strong>non-toxic</strong></div>
                  <div>• Bar length = magnitude of influence on the model output</div>
                  <div>• Values are computed using <strong>TreeExplainer</strong> on the first Tox21 endpoint</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'properties' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
              <MolecularPropertiesCard
                descriptors={result.molecular_descriptors}
                lipinski={result.lipinski}
              />
              {result.lipinski && (
                <div className="card">
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Lipinski Rule of Five</div>
                  {[
                    { label: 'Molecular Weight', value: result.lipinski.MW, limit: '≤ 500 Da', ok: result.lipinski.MW <= 500 },
                    { label: 'LogP', value: result.lipinski.LogP, limit: '≤ 5', ok: result.lipinski.LogP <= 5 },
                    { label: 'H-Bond Donors', value: result.lipinski.HBD, limit: '≤ 5', ok: result.lipinski.HBD <= 5 },
                    { label: 'H-Bond Acceptors', value: result.lipinski.HBA, limit: '≤ 10', ok: result.lipinski.HBA <= 10 },
                  ].map(({ label, value, limit, ok }) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0', borderBottom: '1px solid var(--border)',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{limit}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15 }}>{value}</span>
                        <span style={{ fontSize: 14 }}>{ok ? '✅' : '❌'}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    Drug-like: <strong style={{ color: result.lipinski.drug_like ? 'var(--green)' : 'var(--amber)' }}>
                      {result.lipinski.drug_like ? 'Yes (≤1 violation)' : 'No'}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
