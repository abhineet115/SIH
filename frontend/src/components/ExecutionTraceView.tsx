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
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-card)",
        padding: "14px 16px",
        borderRadius: "12px",
        border: "1px solid var(--border-subtle)",
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
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Cpu size={15} color="var(--primary)" />
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)" }}>
            Execution Trace
          </span>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 600,
              padding: "1px 6px",
              borderRadius: "4px",
              background: "var(--bg-card-subtle)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
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
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <Clock size={12} color="var(--text-muted)" />
            <span>
              Total: <strong style={{ color: "var(--text-main)" }}>{totalLatencyMs} ms</strong>
            </span>
          </div>
          {isExpanded ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
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
                background: "var(--bg-card-subtle)",
                border: "1px solid var(--border-subtle)",
                padding: "8px 10px",
                borderRadius: "6px",
                borderLeft: "3px solid var(--primary)",
                fontSize: "0.76rem",
              }}
            >
              <div style={{ marginTop: "2px" }}>
                <CheckCircle2 size={13} color="var(--success)" />
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{step.action}</span>
                  <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
                    {step.latency_ms} ms
                  </span>
                </div>
                {step.details && (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", lineHeight: 1.35 }}>
                    {step.details}
                  </span>
                )}

                {step.tool && (
                  <div
                    style={{
                      marginTop: "3px",
                      background: "var(--bg-main)",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.68rem",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Terminal size={10} color="var(--primary)" />
                    <span>Tool: {step.tool} ({step.status})</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
