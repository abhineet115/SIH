import React from "react";
import { CheckCircle2, TrendingUp, TrendingDown, Layers, Sparkles } from "lucide-react";
import type { AnalysisResult } from "../types";

interface ResultCardProps {
  result: AnalysisResult | null;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  if (!result) return null;

  const {
    answer,
    specialist,
    intent,
    key_findings,
    land_cover_distribution,
    built_up_change_pct,
    vegetation_change_pct,
  } = result;

  const hasLandCover = land_cover_distribution && Object.keys(land_cover_distribution).length > 0;
  const hasChangeStats = built_up_change_pct !== undefined || vegetation_change_pct !== undefined;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        background: "var(--bg-card)",
        padding: "16px",
        borderRadius: "12px",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Header & Badges */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
            Analysis Result
          </span>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "4px",
              background: "var(--bg-card-subtle)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {intent}
          </span>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "4px",
              background: "rgba(168, 85, 247, 0.12)",
              color: "#c084fc",
              border: "1px solid rgba(168, 85, 247, 0.25)",
            }}
          >
            {specialist}
          </span>
        </div>
      </div>

      {/* Answer Paragraph */}
      <div
        style={{
          background: "var(--bg-card-subtle)",
          padding: "12px 14px",
          borderRadius: "8px",
          borderLeft: "3px solid var(--primary)",
          fontSize: "0.86rem",
          lineHeight: 1.6,
          color: "var(--text-main)",
        }}
      >
        {answer}
      </div>

      {/* Change Delta Metrics (if Bi-temporal) */}
      {hasChangeStats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
          {built_up_change_pct !== undefined && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                padding: "8px 12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <TrendingUp size={14} color="#ef4444" />
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Built-up Expansion</span>
              </div>
              <strong style={{ fontSize: "0.88rem", color: "#f87171", fontFamily: "var(--font-mono)" }}>
                +{built_up_change_pct}%
              </strong>
            </div>
          )}

          {vegetation_change_pct !== undefined && (
            <div
              style={{
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                padding: "8px 12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <TrendingDown size={14} color="#f59e0b" />
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Vegetation Change</span>
              </div>
              <strong style={{ fontSize: "0.88rem", color: "#facc15", fontFamily: "var(--font-mono)" }}>
                {vegetation_change_pct}%
              </strong>
            </div>
          )}
        </div>
      )}

      {/* Land Cover Distribution (if VQA/Classification) */}
      {hasLandCover && (
        <div>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              marginBottom: "6px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            <Layers size={12} color="var(--primary)" />
            <span>Land Cover Breakdown:</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
            {Object.entries(land_cover_distribution).map(([cat, pct]) => (
              <div
                key={cat}
                style={{
                  background: "var(--bg-card-subtle)",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.74rem",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>{cat}</span>
                <strong style={{ color: "var(--text-main)", fontFamily: "var(--font-mono)" }}>{pct}%</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Findings List */}
      {key_findings && key_findings.length > 0 && (
        <div>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <Sparkles size={12} color="var(--success)" />
            <span>Key Observations:</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {key_findings.map((f, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "7px",
                  fontSize: "0.78rem",
                  color: "var(--text-main)",
                  lineHeight: 1.45,
                }}
              >
                <CheckCircle2 size={14} color="var(--success)" style={{ marginTop: "2px", flexShrink: 0 }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
