import React, { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Cpu, Clock, Terminal } from "lucide-react";
import type { ExecutionTraceStep } from "../types";

interface ExecutionTraceViewProps {
  trace: ExecutionTraceStep[];
  totalLatencyMs: number;
}

export const ExecutionTraceView: React.FC<ExecutionTraceViewProps> = ({
  trace,
  totalLatencyMs,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!trace || trace.length === 0) return null;

  return (
    <div
      className="glass-panel"
      style={{
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        background: "rgba(8, 14, 28, 0.85)",
        border: "1px solid rgba(56, 189, 248, 0.2)",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Cpu size={15} color="#00f0ff" />
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f8fafc", letterSpacing: "0.02em" }}>
            Observable Agent Pipeline DAG
          </span>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: "4px",
              background: "rgba(0, 240, 255, 0.15)",
              color: "#00f0ff",
              fontFamily: "var(--font-mono)",
            }}
          >
            {trace.length} Steps
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.72rem",
              color: "#94a3b8",
              fontFamily: "var(--font-mono)",
            }}
          >
            <Clock size={12} color="#00f0ff" />
            <span>
              Total: <strong style={{ color: "#f8fafc" }}>{totalLatencyMs} ms</strong>
            </span>
          </div>
          {isExpanded ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
        </div>
      </div>

      {/* Expanded Timeline Steps */}
      {isExpanded && (
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {trace.map((step) => (
            <div
              key={step.step}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                background: "rgba(12, 20, 40, 0.7)",
                border: "1px solid rgba(56, 189, 248, 0.12)",
                padding: "8px 10px",
                borderRadius: "6px",
                borderLeft: "3px solid #00f0ff",
                fontSize: "0.75rem",
              }}
            >
              <div style={{ marginTop: "2px" }}>
                <CheckCircle2 size={13} color="#10b981" />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "#f1f5f9" }}>
                    Step {step.step}: {step.action}
                  </span>
                  <span style={{ color: "#00f0ff", fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700 }}>
                    {step.latency_ms} ms
                  </span>
                </div>

                <div style={{ color: "#94a3b8", marginTop: "2px", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Terminal size={11} color="#c084fc" />
                  <span>Specialist Tool:</span>
                  <code
                    style={{
                      color: "#c084fc",
                      background: "rgba(192, 132, 252, 0.12)",
                      padding: "1px 5px",
                      borderRadius: "3px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {step.tool}
                  </code>
                </div>

                <div style={{ color: "#cbd5e1", marginTop: "4px", fontSize: "0.72rem", lineHeight: 1.4 }}>
                  {step.details}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

