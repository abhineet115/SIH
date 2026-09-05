import React from "react";
import { Bot, CheckCircle2, TrendingUp, TrendingDown, Layers } from "lucide-react";
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
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={17} color="#38bdf8" />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
            Mission Intelligence Output
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '4px',
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}>
            {intent}
          </span>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: '4px',
            background: 'rgba(168, 85, 247, 0.15)',
            color: '#c084fc',
            border: '1px solid rgba(168, 85, 247, 0.3)'
          }}>
            {specialist}
          </span>
        </div>
      </div>

      {/* Answer Paragraph */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        padding: '12px 14px',
        borderRadius: '8px',
        borderLeft: '3px solid #38bdf8',
        fontSize: '0.85rem',
        lineHeight: 1.55,
        color: '#e2e8f0'
      }}>
        {answer}
      </div>

      {/* Change Delta Metrics (if Bi-temporal) */}
      {hasChangeStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {built_up_change_pct !== undefined && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={15} color="#ef4444" />
                <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>Built-up Expansion</span>
              </div>
              <strong style={{ fontSize: '0.9rem', color: '#f87171' }}>+{built_up_change_pct}%</strong>
            </div>
          )}

          {vegetation_change_pct !== undefined && (
            <div style={{
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingDown size={15} color="#eab308" />
                <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>Vegetation Conversion</span>
              </div>
              <strong style={{ fontSize: '0.9rem', color: '#facc15' }}>{vegetation_change_pct}%</strong>
            </div>
          )}
        </div>
      )}

      {/* Land Cover Distribution (if VQA/Classification) */}
      {hasLandCover && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Layers size={13} />
            <span>Land Cover Segmentation Distribution:</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            {Object.entries(land_cover_distribution).map(([cat, pct]) => (
              <div
                key={cat}
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.72rem'
                }}
              >
                <span style={{ color: '#94a3b8' }}>{cat}</span>
                <strong style={{ color: '#38bdf8' }}>{pct}%</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Findings List */}
      {key_findings && key_findings.length > 0 && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
            Key Geospatial Findings:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {key_findings.map((f, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={13} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
