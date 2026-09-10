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
    { label: "Model Certainty", code: "C_model", val: breakdown.model_inference, color: "var(--primary)" },
    { label: "Sensor Radiometry", code: "C_sensor", val: breakdown.sensor_radiometry, color: "#a855f7" },
    { label: "Spatial Alignment", code: "C_align", val: breakdown.spatial_alignment, color: "#10b981" },
    { label: "Resolution Fit", code: "C_res", val: breakdown.resolution_suitability, color: "#f59e0b" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        background: "var(--bg-card)",
        padding: "14px 16px",
        borderRadius: "12px",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <ShieldCheck size={16} color={badge_color} />
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)" }}>
            Composite Confidence
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: badge_color,
              fontFamily: "var(--font-mono)",
            }}
          >
            {composite_score}%
          </span>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: "4px",
              backgroundColor: `${badge_color}18`,
              color: badge_color,
              border: `1px solid ${badge_color}40`,
            }}
          >
            {rating}
          </span>
        </div>
      </div>

      {/* 4-Signal Breakdown Bars */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
        {metrics.map((m, idx) => (
          <div
            key={idx}
            style={{
              background: "var(--bg-card-subtle)",
              border: "1px solid var(--border-subtle)",
              padding: "6px 10px",
              borderRadius: "6px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              <span>{m.label}</span>
              <strong style={{ color: "var(--text-main)", fontFamily: "var(--font-mono)" }}>{m.val}%</strong>
            </div>
            <div style={{ height: "4px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "2px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${m.val}%`,
                  backgroundColor: m.color,
                  borderRadius: "2px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
