import React from "react";
import { Satellite, Download, Database } from "lucide-react";
import type { SampleScenario } from "../types";

interface NavbarProps {
  scenarios: SampleScenario[];
  currentScenario: SampleScenario | null;
  onSelectScenario: (sc: SampleScenario) => void;
  onExportReport: () => void;
  hasResult: boolean;
  backendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  scenarios,
  currentScenario,
  onSelectScenario,
  onExportReport,
  hasResult,
  backendOnline,
}) => {
  return (
    <header className="glass-header sticky top-0 z-50 px-6 py-3 flex items-center justify-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {/* Left: Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #ea580c 0%, #0284c7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(234, 88, 12, 0.4)'
        }}>
          <Satellite size={24} color="#ffffff" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              SatQuery <span style={{ color: '#38bdf8' }}>AI</span>
            </h1>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '999px',
              background: 'rgba(234, 88, 12, 0.2)',
              color: '#fb923c',
              border: '1px solid rgba(234, 88, 12, 0.4)'
            }}>
              ISRO SIH 26167
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Interactive Multimodal Remote Sensing Agent
          </p>
        </div>
      </div>

      {/* Middle: Scenario Quick-Load */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Database size={16} color="#38bdf8" />
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
          Benchmark Scenario:
        </span>
        <select
          value={currentScenario?.id || ""}
          onChange={(e) => {
            const found = scenarios.find((s) => s.id === e.target.value);
            if (found) onSelectScenario(found);
          }}
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            color: '#e2e8f0',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.82rem',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {scenarios.map((sc) => (
            <option key={sc.id} value={sc.id} style={{ background: '#0f172a', color: '#f8fafc' }}>
              {sc.title}
            </option>
          ))}
        </select>
      </div>

      {/* Right: Status & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '999px',
          background: backendOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${backendOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          fontSize: '0.75rem',
          color: backendOnline ? '#34d399' : '#f87171'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: backendOnline ? '#10b981' : '#ef4444'
          }} className={backendOnline ? "pulse-indicator" : ""} />
          {backendOnline ? "FastAPI Gateway Online" : "Connecting..."}
        </div>

        <button
          onClick={onExportReport}
          disabled={!hasResult}
          className="btn-secondary"
          title="Export official ISRO Mission PDF Report"
        >
          <Download size={15} />
          Export PDF
        </button>
      </div>
    </header>
  );
};
