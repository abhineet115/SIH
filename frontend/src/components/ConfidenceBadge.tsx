import React from "react";
import { ShieldCheck } from "lucide-react";
import type { ConfidenceScore } from "../types";

interface ConfidenceBadgeProps {
  confidence: ConfidenceScore | null;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence }) => {
  if (!confidence) return null;

  const { composite_score, rating, badge_color, breakdown } = confidence;

  const metrics = [
    { label: "Model Certainty (C_model)", val: breakdown.model_inference, color: "#38bdf8" },
    { label: "Sensor Radiometry (C_sensor)", val: breakdown.sensor_radiometry, color: "#a855f7" },
    { label: "Spatial Alignment (C_align)", val: breakdown.spatial_alignment, color: "#10b981" },
    { label: "Resolution Fit (C_res)", val: breakdown.resolution_suitability, color: "#f59e0b" },
  ];

  return (
    <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={16} color={badge_color} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
            Composite Harmonic Confidence
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: badge_color,
              fontFamily: 'var(--font-mono)'
            }}
          >
            {composite_score}%
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: `${badge_color}22`,
              color: badge_color,
              border: `1px solid ${badge_color}55`
            }}
          >
            {rating}
          </span>
        </div>
      </div>

      {/* 4-Signal Breakdown Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {metrics.map((m, idx) => (
          <div key={idx} style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '6px 8px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', marginBottom: '3px' }}>
              <span>{m.label.split(' ')[0]}</span>
              <strong style={{ color: '#f1f5f9' }}>{m.val}%</strong>
            </div>
            <div style={{ height: '4px', background: 'rgba(51, 65, 85, 0.6)', borderRadius: '2px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${m.val}%`,
                  backgroundColor: m.color,
                  borderRadius: '2px'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
