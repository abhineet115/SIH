import React, { useState } from "react";
import {
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Lightbulb,
  Compass,
  FileText,
  Sliders,
} from "lucide-react";
import type { AnalysisResult } from "../types";

interface ResultCardProps {
  result: AnalysisResult | null;
  onRunQuery?: (query: string) => void;
  isLoading?: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onRunQuery, isLoading }) => {
  if (!result) return null;

  const [activeTab, setActiveTab] = useState<"simple" | "technical">("simple");

  const {
    answer,
    specialist,
    intent,
    key_findings,
    land_cover_distribution,
    built_up_change_pct,
    vegetation_change_pct,
    generalized_result,
  } = result;

  const hasLandCover = land_cover_distribution && Object.keys(land_cover_distribution).length > 0;
  const hasChangeStats = built_up_change_pct !== undefined || vegetation_change_pct !== undefined;
  const gen = generalized_result;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: "var(--bg-card)",
        padding: "16px",
        borderRadius: "12px",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Header & Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
            Satellite Scene Analysis
          </span>
          {gen?.powered_by_gemini ? (
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15))",
                color: "#c084fc",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Sparkles size={11} />
              <span>Gemini AI Enhanced</span>
            </span>
          ) : (
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "999px",
                background: "var(--bg-card-subtle)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Sparkles size={11} color="#f59e0b" />
              <span>Smart Generalizer</span>
            </span>
          )}
        </div>

        {/* View Mode Toggle Switcher */}
        <div
          style={{
            display: "flex",
            background: "var(--bg-card-subtle)",
            padding: "2px",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("simple")}
            style={{
              padding: "4px 10px",
              fontSize: "0.72rem",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: activeTab === "simple" ? "var(--primary)" : "transparent",
              color: activeTab === "simple" ? "#fff" : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
          >
            <Sparkles size={12} />
            <span>Plain English</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("technical")}
            style={{
              padding: "4px 10px",
              fontSize: "0.72rem",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: activeTab === "technical" ? "var(--primary)" : "transparent",
              color: activeTab === "technical" ? "#fff" : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
          >
            <Sliders size={12} />
            <span>Technical GIS</span>
          </button>
        </div>
      </div>

      {/* Mode Badges */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
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
        {gen?.model_used && (
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "4px",
              background: "rgba(59, 130, 246, 0.12)",
              color: "#60a5fa",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              marginLeft: "auto",
            }}
          >
            {gen.model_used}
          </span>
        )}
      </div>

      {/* TAB 1: SIMPLIFIED / PLAIN ENGLISH */}
      {activeTab === "simple" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Executive Verdict Banner */}
          {gen?.executive_verdict && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.1))",
                border: "1px solid rgba(168, 85, 247, 0.25)",
                padding: "8px 12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.82rem",
                color: "var(--text-main)",
                fontWeight: 600,
              }}
            >
              <Compass size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>{gen.executive_verdict}</span>
            </div>
          )}

          {/* Plain English Summary */}
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
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>
              In Plain English:
            </div>
            {gen?.simple_summary || answer}
          </div>

          {/* Friendly Land Cover Bar */}
          {hasLandCover && (
            <div
              style={{
                background: "var(--bg-card-subtle)",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--text-muted)" }}>
                  Scene Land-Use Breakdown:
                </span>
              </div>

              {/* Progress visual bar */}
              <div
                style={{
                  height: "10px",
                  borderRadius: "999px",
                  overflow: "hidden",
                  display: "flex",
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                {Object.entries(land_cover_distribution).map(([key, val]) => {
                  let color = "#94a3b8";
                  if (key.includes("Built")) color = "#ef4444";
                  else if (key.includes("Vegetation")) color = "#10b981";
                  else if (key.includes("Water")) color = "#3b82f6";
                  else if (key.includes("Soil") || key.includes("Barren") || key.includes("Fallow")) color = "#eab308";
                  return (
                    <div
                      key={key}
                      style={{
                        width: `${val}%`,
                        background: color,
                        height: "100%",
                      }}
                      title={`${key}: ${val}%`}
                    />
                  );
                })}
              </div>

              {/* Legend with friendly names */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", marginTop: "2px" }}>
                {Object.entries(land_cover_distribution).map(([key, val]) => {
                  let dotColor = "#94a3b8";
                  let friendlyName = key;
                  if (key.includes("Built")) {
                    dotColor = "#ef4444";
                    friendlyName = "Buildings & Roads";
                  } else if (key.includes("Vegetation")) {
                    dotColor = "#10b981";
                    friendlyName = "Trees & Vegetation";
                  } else if (key.includes("Water")) {
                    dotColor = "#3b82f6";
                    friendlyName = "Water Bodies";
                  } else if (key.includes("Soil") || key.includes("Barren") || key.includes("Fallow")) {
                    dotColor = "#eab308";
                    friendlyName = "Open / Farm Soil";
                  }
                  return (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.73rem",
                        padding: "3px 6px",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)" }}>
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: dotColor,
                            display: "inline-block",
                          }}
                        />
                        <span>{friendlyName}</span>
                      </span>
                      <strong style={{ color: "var(--text-main)", fontFamily: "var(--font-mono)" }}>
                        {val}%
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                    {built_up_change_pct > 0 ? `+${built_up_change_pct}` : built_up_change_pct}%
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
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Vegetation Shift</span>
                  </div>
                  <strong style={{ fontSize: "0.88rem", color: "#facc15", fontFamily: "var(--font-mono)" }}>
                    {vegetation_change_pct > 0 ? `+${vegetation_change_pct}` : vegetation_change_pct}%
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* What This Means (Real-World Impact) */}
          {gen?.what_this_means && gen.what_this_means.length > 0 && (
            <div
              style={{
                background: "var(--bg-card-subtle)",
                borderRadius: "8px",
                padding: "10px 12px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <ShieldAlert size={12} color="#3b82f6" />
                <span>What This Means (Real-World Impact):</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {gen.what_this_means.map((point, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "7px",
                      fontSize: "0.77rem",
                      lineHeight: 1.45,
                      color: "var(--text-main)",
                    }}
                  >
                    <span style={{ color: "#3b82f6", fontWeight: "bold" }}>•</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Recommendations */}
          {gen?.actionable_recommendations && gen.actionable_recommendations.length > 0 && (
            <div
              style={{
                background: "rgba(16, 185, 129, 0.05)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#10b981",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Lightbulb size={12} color="#10b981" />
                <span>Recommended Actions:</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {gen.actionable_recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "7px",
                      fontSize: "0.77rem",
                      lineHeight: 1.45,
                      color: "var(--text-main)",
                    }}
                  >
                    <CheckCircle2 size={13} color="#10b981" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TECHNICAL GIS DATA */}
      {activeTab === "technical" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              background: "var(--bg-card-subtle)",
              padding: "12px 14px",
              borderRadius: "8px",
              borderLeft: "3px solid #c084fc",
              fontSize: "0.84rem",
              lineHeight: 1.6,
              color: "var(--text-main)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {answer}
          </div>

          {/* Key Technical Findings */}
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
                <FileText size={12} color="var(--success)" />
                <span>Specialist Observations:</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {key_findings.map((f, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "7px",
                      fontSize: "0.76rem",
                      color: "var(--text-main)",
                      lineHeight: 1.45,
                      background: "var(--bg-card-subtle)",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <CheckCircle2 size={13} color="var(--success)" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Land Cover Table */}
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
                <span>Quantitative Radiometric Distribution:</span>
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
        </div>
      )}

      {/* Dynamic Follow-Up Questions ("Explore Further with Gemini") */}
      {gen?.follow_up_questions && gen.follow_up_questions.length > 0 && onRunQuery && (
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div
            style={{
              fontSize: "0.71rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            <Sparkles size={11} color="var(--primary)" />
            <span>Explore Further (Suggested Follow-ups):</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {gen.follow_up_questions.map((fq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onRunQuery(fq)}
                disabled={isLoading}
                style={{
                  background: "var(--bg-card-subtle)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "0.75rem",
                  color: "var(--text-main)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.background = "rgba(168, 85, 247, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.background = "var(--bg-card-subtle)";
                }}
              >
                <span>{fq}</span>
                <ArrowRight size={12} color="var(--primary)" style={{ flexShrink: 0, marginLeft: "6px" }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
