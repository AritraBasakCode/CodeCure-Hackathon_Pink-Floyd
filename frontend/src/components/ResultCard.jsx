import React from 'react';

const RISK_COLORS = {
  High:     'var(--red)',
  Moderate: 'var(--amber)',
  Low:      'var(--cyan)',
  Minimal:  'var(--green)',
};

const RISK_BG = {
  High:     'rgba(255,59,107,0.1)',
  Moderate: 'rgba(255,179,0,0.1)',
  Low:      'rgba(0,229,255,0.1)',
  Minimal:  'rgba(0,255,157,0.1)',
};

export function OverallRiskCard({ result }) {
  const risk = result.overall_risk;
  const color = RISK_COLORS[risk] || 'var(--text)';
  const score = Math.round(result.overall_toxicity_score * 100);

  return (
    <div className="card" style={{
      borderColor: color,
      boxShadow: `0 0 30px ${RISK_BG[risk]}`,
      textAlign: 'center',
      padding: '32px 24px',
    }}>
      {/* Gauge */}
      <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 20px' }}>
        <svg viewBox="0 0 160 160" width="160" height="160">
          {/* Background arc */}
          <circle cx="80" cy="80" r="66" fill="none" stroke="var(--border)" strokeWidth="10" />
          {/* Score arc */}
          <circle
            cx="80" cy="80" r="66"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 66 * score / 100} ${2 * Math.PI * 66 * (1 - score / 100)}`}
            transform="rotate(-90 80 80)"
            style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 36, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>
            {score}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
            /100
          </span>
        </div>
      </div>

      <div style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 4 }}>
        {risk} Risk
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
        Overall Toxicity Score
      </div>
      <div style={{ marginTop: 16, padding: '8px 12px', background: RISK_BG[risk], borderRadius: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
          Highest concern: <span style={{ color }}>{result.highest_risk_endpoint}</span>
          {' '}({Math.round(result.highest_risk_probability * 100)}%)
        </span>
      </div>
    </div>
  );
}


export function EndpointGrid({ endpoints }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 12,
    }}>
      {Object.entries(endpoints).map(([ep, data]) => {
        const prob = Math.round(data.probability * 100);
        const color = RISK_COLORS[data.risk] || 'var(--text)';

        return (
          <div key={ep} className="card" style={{
            padding: '16px',
            borderColor: data.label === 'Toxic' ? color : 'var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                {ep}
              </span>
              <span className={`badge badge-${data.risk === 'High' ? 'red' : data.risk === 'Moderate' ? 'amber' : data.risk === 'Low' ? 'cyan' : 'green'}`}>
                {data.risk}
              </span>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>
              {data.full}
            </div>

            {/* Progress bar */}
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${prob}%`,
                background: color,
                borderRadius: 3,
                transition: 'width 1s ease',
                boxShadow: `0 0 8px ${color}50`,
              }} />
            </div>

            <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                {data.category}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
                {prob}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}


export function MolecularPropertiesCard({ descriptors, lipinski }) {
  const props = [
    { label: 'Molecular Weight', value: `${descriptors.MW} Da`, key: 'MW' },
    { label: 'LogP (Lipophilicity)', value: descriptors.LogP, key: 'LogP' },
    { label: 'TPSA', value: `${descriptors.TPSA} Å²`, key: 'TPSA' },
    { label: 'H-Bond Donors', value: descriptors.HBD, key: 'HBD' },
    { label: 'H-Bond Acceptors', value: descriptors.HBA, key: 'HBA' },
    { label: 'Rotatable Bonds', value: descriptors.RotBonds, key: 'RotBonds' },
    { label: 'Aromatic Rings', value: descriptors.ArRings, key: 'ArRings' },
    { label: 'QED Drug-Likeness', value: descriptors.QED, key: 'QED' },
  ];

  return (
    <div className="card">
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Molecular Properties</span>
        {lipinski?.drug_like !== undefined && (
          <span className={`badge ${lipinski.drug_like ? 'badge-green' : 'badge-amber'}`}>
            {lipinski.drug_like ? '✓ Drug-like' : '⚠ Lipinski Violation'}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {props.map(({ label, value }) => (
          <div key={label} style={{
            padding: '10px 12px',
            background: 'var(--bg3)',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 2, textTransform: 'uppercase' }}>
              {label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {lipinski?.violations?.length > 0 && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(255,179,0,0.08)', borderRadius: 8, border: '1px solid rgba(255,179,0,0.3)' }}>
          <span style={{ fontSize: 11, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
            ⚠ Violations: {lipinski.violations.join(' · ')}
          </span>
        </div>
      )}
    </div>
  );
}
