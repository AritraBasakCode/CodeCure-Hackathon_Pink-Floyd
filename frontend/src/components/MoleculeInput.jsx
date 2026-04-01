import React, { useState } from 'react';

const EXAMPLES = [
  { name: 'Aspirin',       smiles: 'CC(=O)Oc1ccccc1C(=O)O',                    tag: 'Safe' },
  { name: 'Caffeine',      smiles: 'Cn1c(=O)c2c(ncn2C)n(c1=O)C',              tag: 'Safe' },
  { name: 'Bisphenol A',   smiles: 'CC(c1ccc(O)cc1)(c1ccc(O)cc1)C',           tag: 'Toxic' },
  { name: 'Paracetamol',   smiles: 'CC(=O)Nc1ccc(O)cc1',                       tag: 'Safe' },
  { name: 'Dioxin (TCDD)', smiles: 'Clc1cc2c(cc1Cl)Oc1cc(Cl)c(Cl)cc1O2',     tag: 'Toxic' },
  { name: 'Benzene',       smiles: 'c1ccccc1',                                  tag: 'Toxic' },
];

export default function MoleculeInput({ onSubmit, loading }) {
  const [smiles, setSmiles] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!smiles.trim()) {
      setError('Please enter a SMILES string.');
      return;
    }
    setError('');
    onSubmit(smiles.trim());
  };

  const handleExample = (smi) => {
    setSmiles(smi);
    setError('');
  };

  return (
    <div className="card" style={{ border: '1px solid var(--border2)' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
          Enter Molecule SMILES
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
          Simplified Molecular Input Line Entry System
        </p>
      </div>

      {/* Input */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <textarea
          className="input-field"
          value={smiles}
          onChange={e => { setSmiles(e.target.value); setError(''); }}
          placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O  (Aspirin)"
          rows={3}
          style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 13 }}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
        />
        {smiles && (
          <button
            onClick={() => setSmiles('')}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: 'var(--border)', border: 'none', borderRadius: 4,
              color: 'var(--text-3)', cursor: 'pointer', padding: '2px 8px', fontSize: 11,
            }}
          >
            clear
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(255,59,107,0.1)', border: '1px solid rgba(255,59,107,0.3)', borderRadius: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>⚠ {error}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !smiles.trim()}
          style={{ flex: 1 }}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16 }} />
              Analyzing...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
              </svg>
              Predict Toxicity
            </>
          )}
        </button>
        <span style={{ display: 'flex', alignItems: 'center', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          Ctrl+Enter
        </span>
      </div>

      {/* Example molecules */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Example Molecules
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {EXAMPLES.map(({ name, smiles: smi, tag }) => (
            <button
              key={name}
              onClick={() => handleExample(smi)}
              style={{
                background: 'var(--bg3)',
                border: `1px solid ${tag === 'Toxic' ? 'rgba(255,59,107,0.3)' : 'rgba(0,255,157,0.2)'}`,
                borderRadius: 6,
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = tag === 'Toxic' ? 'var(--red)' : 'var(--green)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = tag === 'Toxic' ? 'rgba(255,59,107,0.3)' : 'rgba(0,255,157,0.2)'}
            >
              <span style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{name}</span>
              <span style={{ fontSize: 10, color: tag === 'Toxic' ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>
                {tag === 'Toxic' ? '⚠' : '✓'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
