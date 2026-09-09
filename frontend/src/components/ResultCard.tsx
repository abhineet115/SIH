import React from "react";
import { Bot, CheckCircle2, TrendingUp, TrendingDown, Layers, Sparkles } from "lucide-react";
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
      className="glass-panel"
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: "rgba(8, 14, 28, 0.88)",
        border: "1px solid rgba(56, 189, 248, 0.22)",
      }}
    >
      {/* Header Badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              backgroundColor: "rgba(0, 240, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(0, 240, 255, 0.3)",
            }}
          >
            <Bot size={16} color="#00f0ff" />
          </div>
          <span style={{ fontSize: "0.84rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "0.02em" }}>
            Mission Intelligence Output
          </span>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 800,
              padding: "2px 7px",
              borderRadius: "4px",
              background: "rgba(0, 240, 255, 0.15)",
              color: "#00f0ff",
              border: "1px solid rgba(0, 240, 255, 0.35)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {intent}
          </span>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: "4px",
              background: "rgba(168, 85, 247, 0.15)",
              color: "#c084fc",
              border: "1px solid rgba(168, 85, 247, 0.35)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {specialist}
          </span>
        </div>
      </div>

      {/* Answer Paragraph */}
      <div
        style={{
          background: "rgba(4, 9, 22, 0.75)",
          padding: "12px 14px",
          borderRadius: "8px",
          borderLeft: "3px solid #00f0ff",
          fontSize: "0.84rem",
          lineHeight: 1.55,
          color: "#e2e8f0",
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
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "8px 12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <TrendingUp size={14} color="#ef4444" />
                <span style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>Built-up Expansion</span>
              </div>
              <strong style={{ fontSize: "0.88rem", color: "#f87171", fontFamily: "var(--font-mono)" }}>
                +{built_up_change_pct}%
              </strong>
            </div>
          )}

          {vegetation_change_pct !== undefined && (
            <div
              style={{
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                padding: "8px 12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <TrendingDown size={14} color="#f59e0b" />
                <span style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>Vegetation Conversion</span>
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
              fontWeight: 700,
              color: "#94a3b8",
              marginBottom: "6px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            <Layers size={12} color="#00f0ff" />
            <span>Land Cover Segmentation Distribution:</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "5px" }}>
            {Object.entries(land_cover_distribution).map(([cat, pct]) => (
              <div
                key={cat}
                style={{
                  background: "rgba(15, 23, 42, 0.65)",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  border: "1px solid rgba(56, 189, 248, 0.12)",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.72rem",
                }}
              >
                <span style={{ color: "#94a3b8" }}>{cat}</span>
                <strong style={{ color: "#00f0ff", fontFamily: "var(--font-mono)" }}>{pct}%</strong>
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
              fontWeight: 700,
              color: "#94a3b8",
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Sparkles size={11} color="#10b981" />
            <span>Geospatial Evidence Points:</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {key_findings.map((f, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "7px",
                  fontSize: "0.74rem",
                  color: "#cbd5e1",
                  lineHeight: 1.4,
                }}
              >
                <CheckCircle2 size={13} color="#10b981" style={{ marginTop: "2px", flexShrink: 0 }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

