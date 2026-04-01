import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div style={{
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12,
      }}>
        <div style={{ color: 'var(--text-2)', marginBottom: 4 }}>{payload[0].payload.feature}</div>
        <div style={{ color: val > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>
          SHAP: {val.toFixed(4)}
        </div>
        <div style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 2 }}>
          {val > 0 ? '↑ Increases toxicity risk' : '↓ Decreases toxicity risk'}
        </div>
      </div>
    );
  }
  return null;
};

export default function FeatureImportanceChart({ shapFeatures }) {
  if (!shapFeatures || shapFeatures.length === 0 || shapFeatures[0]?.error) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>
        SHAP explanations unavailable
      </div>
    );
  }

  const data = [...shapFeatures]
    .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
    .slice(0, 12)
    .map(d => ({
      feature: d.feature.length > 20 ? d.feature.slice(0, 20) + '…' : d.feature,
      fullFeature: d.feature,
      value: parseFloat(d.shap_value.toFixed(5)),
    }));

  return (
    <div className="card">
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Feature Importance (SHAP)</span>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
          Molecular properties driving the toxicity prediction
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--red)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>Toxic impact</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--green)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>Protective impact</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
          <XAxis
            type="number"
            tick={{ fill: 'var(--text-3)', fontSize: 10, fontFamily: 'Space Mono' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            dataKey="feature"
            type="category"
            width={130}
            tick={{ fill: 'var(--text-2)', fontSize: 10, fontFamily: 'Space Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine x={0} stroke="var(--border2)" />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.value > 0 ? 'var(--red)' : 'var(--green)'}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
