import React from "react";
import { Satellite, Download, Sun, Moon, Sparkles } from "lucide-react";
import type { SampleScenario } from "../types";

interface NavbarProps {
  scenarios: SampleScenario[];
  currentScenario: SampleScenario | null;
  onSelectScenario: (sc: SampleScenario) => void;
  onExportReport: () => void;
  hasResult: boolean;
  backendOnline: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenGeminiSettings: () => void;
  hasGeminiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  scenarios,
  currentScenario,
  onSelectScenario,
  onExportReport,
  hasResult,
  backendOnline,
  theme,
  onToggleTheme,
  onOpenGeminiSettings,
  hasGeminiKey,
}) => {
  return (
    <header
      className="clean-header"
      style={{
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        zIndex: 50,
      }}
    >
      {/* Left: Branding */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
          }}
        >
          <Satellite size={17} color="#ffffff" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.01em" }}>
            SatQuery AI
          </span>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 600,
              padding: "1px 6px",
              borderRadius: "4px",
              background: "var(--bg-card-subtle)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            ISRO SAC
          </span>
        </div>
      </div>

      {/* Center: Scenario Switcher Pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          background: "var(--bg-card-subtle)",
          padding: "3px",
          borderRadius: "8px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {scenarios.map((sc) => {
          const isSelected = currentScenario?.id === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc)}
              style={{
                background: isSelected ? "var(--bg-card)" : "transparent",
                color: isSelected ? "var(--text-main)" : "var(--text-muted)",
                border: isSelected ? "1px solid var(--border-subtle)" : "1px solid transparent",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "0.76rem",
                fontWeight: isSelected ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: isSelected ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {sc.title.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* Right: Theme Toggle, Connection Status & Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Connection status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "0.74rem",
            color: backendOnline ? "var(--success)" : "#f43f5e",
            fontWeight: 500,
            marginRight: "4px",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: backendOnline ? "var(--success)" : "#f43f5e",
            }}
          />
          <span>{backendOnline ? "Online" : "Offline"}</span>
        </div>

        {/* Gemini AI Settings Button */}
        <button
          onClick={onOpenGeminiSettings}
          className="btn-secondary"
          style={{
            padding: "6px 12px",
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: hasGeminiKey ? "rgba(168, 85, 247, 0.12)" : "var(--bg-card-subtle)",
            borderColor: hasGeminiKey ? "rgba(168, 85, 247, 0.35)" : "var(--border-subtle)",
            color: hasGeminiKey ? "#c084fc" : "var(--text-muted)",
          }}
          title="Configure Google Gemini AI & Models"
          id="gemini-settings-btn"
        >
          <Sparkles size={13} color={hasGeminiKey ? "#c084fc" : "#f59e0b"} />
          <span style={{ fontWeight: 600 }}>{hasGeminiKey ? "Gemini Active" : "Gemini AI"}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="btn-secondary"
          style={{ padding: "6px 10px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "5px" }}
          title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
          id="theme-toggle-btn"
        >
          {theme === "dark" ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#0284c7" />}
          <span style={{ textTransform: "capitalize" }}>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>

        {/* Export PDF Button */}
        <button
          onClick={onExportReport}
          disabled={!hasResult}
          className="btn-secondary"
          style={{ padding: "6px 12px", fontSize: "0.78rem" }}
          title="Export official ISRO Mission PDF Report"
        >
          <Download size={13} />
          Export Report
        </button>
      </div>
    </header>
  );
};
