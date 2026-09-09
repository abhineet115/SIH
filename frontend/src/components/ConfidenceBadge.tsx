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
    { label: "Model Certainty", code: "C_model", val: breakdown.model_inference, color: "#00f0ff" },
    { label: "Sensor Radiometry", code: "C_sensor", val: breakdown.sensor_radiometry, color: "#a855f7" },
    { label: "Spatial Alignment", code: "C_align", val: breakdown.spatial_alignment, color: "#10b981" },
    { label: "GSD Suitability", code: "C_res", val: breakdown.resolution_suitability, color: "#f59e0b" },
  ];

  return (
    <div
      className="glass-panel"
      style={{
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        background: "rgba(8, 14, 28, 0.85)",
        border: "1px solid rgba(56, 189, 248, 0.2)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <ShieldCheck size={16} color={badge_color} />
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f8fafc", letterSpacing: "0.02em" }}>
            Harmonic Composite Confidence
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              color: badge_color,
              fontFamily: "var(--font-mono)",
            }}
          >
            {composite_score}%
          </span>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 800,
              padding: "2px 7px",
              borderRadius: "4px",
              backgroundColor: `${badge_color}22`,
              color: badge_color,
              border: `1px solid ${badge_color}55`,
              letterSpacing: "0.04em",
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
              background: "rgba(15, 23, 42, 0.65)",
              border: "1px solid rgba(56, 189, 248, 0.1)",
              padding: "6px 9px",
              borderRadius: "6px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.68rem",
                color: "#94a3b8",
                marginBottom: "4px",
              }}
            >
              <span>{m.label}</span>
              <strong style={{ color: "#f1f5f9", fontFamily: "var(--font-mono)" }}>{m.val}%</strong>
            </div>
            <div style={{ height: "4px", background: "rgba(30, 41, 59, 0.8)", borderRadius: "2px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${m.val}%`,
                  backgroundColor: m.color,
                  borderRadius: "2px",
                  boxShadow: `0 0 8px ${m.color}88`,
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

