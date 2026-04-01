import React from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12,
      }}>
        <div style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 4 }}>{d.endpoint}</div>
        <div style={{ color: 'var(--cyan)' }}>Probability: {d.probability}%</div>
        <div style={{ color: 'var(--text-3)', fontSize: 11 }}>{d.full}</div>
      </div>
    );
  }
  return null;
};

export default function ToxicityRadar({ endpoints }) {
  const data = Object.entries(endpoints).map(([ep, val]) => ({
    endpoint: ep.replace('NR-', '').replace('SR-', ''),
    fullEndpoint: ep,
    full: val.full || ep,
    probability: Math.round(val.probability * 100),
  }));

  return (
    <div className="card">
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Toxicity Profile Radar</span>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
          Across all 12 Tox21 endpoints
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="endpoint"
            tick={{ fill: 'var(--text-2)', fontSize: 10, fontFamily: 'Space Mono' }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: 'var(--text-3)', fontSize: 9, fontFamily: 'Space Mono' }}
            tickCount={4}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Toxicity"
            dataKey="probability"
            stroke="var(--cyan)"
            fill="var(--cyan)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
