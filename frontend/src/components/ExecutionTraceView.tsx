import React, { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Cpu, Clock } from "lucide-react";
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
    <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
            Observable Agentic Pipeline Trace
          </span>
          <span style={{
            fontSize: '0.68rem',
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8'
          }}>
            {trace.length} Steps
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#94a3b8' }}>
            <Clock size={12} />
            <span>Total: <strong>{totalLatencyMs} ms</strong></span>
          </div>
          {isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
        </div>
      </div>

      {/* Expanded Timeline Steps */}
      {isExpanded && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {trace.map((step) => (
            <div
              key={step.step}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '8px 10px',
                borderRadius: '6px',
                borderLeft: '2px solid #38bdf8',
                fontSize: '0.75rem'
              }}
            >
              <div style={{ marginTop: '1px' }}>
                <CheckCircle2 size={14} color="#10b981" />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
                    Step {step.step}: {step.action}
                  </span>
                  <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                    {step.latency_ms} ms
                  </span>
                </div>

                <div style={{ color: '#94a3b8', marginTop: '2px', fontSize: '0.72rem' }}>
                  Tool: <code style={{ color: '#c084fc', background: 'rgba(192, 132, 252, 0.1)', padding: '1px 4px', borderRadius: '3px' }}>{step.tool}</code>
                </div>

                <div style={{ color: '#cbd5e1', marginTop: '4px', fontSize: '0.72rem', lineHeight: 1.4 }}>
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
