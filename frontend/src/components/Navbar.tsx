import React, { useState, useEffect } from "react";
import { Satellite, Download, Radio, Shield, Clock } from "lucide-react";
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
  const [timeUtc, setTimeUtc] = useState<string>("");
  const [timeIst, setTimeIst] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().slice(17, 25) + " UTC");
      setTimeIst(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " IST"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      className="glass-header"
      style={{
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        zIndex: 50,
        position: "relative",
      }}
    >
      {/* Left: Branding & ISRO Operations */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #ff7a00 0%, #0284c7 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(255, 122, 0, 0.45)",
            position: "relative",
          }}
        >
          <Satellite size={22} color="#ffffff" />
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#00f0ff",
              boxShadow: "0 0 8px #00f0ff",
            }}
          />
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#f8fafc",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              SatQuery <span style={{ color: "var(--primary)" }}>AI</span>
            </h1>
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: "4px",
                background: "rgba(255, 122, 0, 0.18)",
                color: "#ff9a3c",
                border: "1px solid rgba(255, 122, 0, 0.4)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              ISRO SAC 26167
            </span>
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>Multimodal Autonomous Remote Sensing Intelligence</span>
          </p>
        </div>
      </div>

      {/* Center: Benchmark Mission Scenarios Switcher */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(10, 18, 36, 0.8)",
          padding: "4px 8px",
          borderRadius: "10px",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          gap: "6px",
        }}
      >
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "0 6px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Shield size={12} color="#00f0ff" />
          Mission:
        </span>

        {scenarios.map((sc) => {
          const isSelected = currentScenario?.id === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc)}
              style={{
                background: isSelected
                  ? "linear-gradient(135deg, rgba(0, 240, 255, 0.25) 0%, rgba(2, 132, 199, 0.35) 100%)"
                  : "transparent",
                color: isSelected ? "#00f0ff" : "#94a3b8",
                border: isSelected
                  ? "1px solid rgba(0, 240, 255, 0.5)"
                  : "1px solid transparent",
                borderRadius: "7px",
                padding: "4px 10px",
                fontSize: "0.74rem",
                fontWeight: isSelected ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: isSelected ? "0 0 12px rgba(0, 240, 255, 0.25)" : "none",
              }}
            >
              {sc.title.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* Right: Mission Telemetry & Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Live Mission Clock */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "6px",
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(56, 189, 248, 0.18)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.72rem",
            color: "#94a3b8",
          }}
          title={`UTC Time: ${timeUtc}`}
        >
          <Clock size={12} color="#00f0ff" />
          <span style={{ color: "#e2e8f0" }}>{timeIst || "00:00:00 IST"}</span>
        </div>

        {/* Constellation Link Chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 9px",
            borderRadius: "6px",
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(56, 189, 248, 0.18)",
            fontSize: "0.7rem",
            color: "#94a3b8",
          }}
        >
          <Radio size={12} color="#10b981" />
          <span style={{ color: "#cbd5e1" }}>Cartosat-3 / RISAT-1A</span>
        </div>

        {/* Gateway Health Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 11px",
            borderRadius: "999px",
            background: backendOnline ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
            border: `1px solid ${backendOnline ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)"}`,
            fontSize: "0.74rem",
            fontWeight: 600,
            color: backendOnline ? "#34d399" : "#f87171",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: backendOnline ? "#10b981" : "#ef4444",
            }}
            className={backendOnline ? "pulse-indicator" : ""}
          />
          {backendOnline ? "AI Engine Online" : "Connecting..."}
        </div>

        {/* Export Mission PDF Button */}
        <button
          onClick={onExportReport}
          disabled={!hasResult}
          className="btn-secondary"
          style={{
            padding: "6px 14px",
            fontSize: "0.78rem",
            fontWeight: 600,
            borderColor: hasResult ? "rgba(0, 240, 255, 0.4)" : "rgba(56, 189, 248, 0.2)",
          }}
          title="Export official ISRO Mission PDF Report"
        >
          <Download size={14} color="#00f0ff" />
          Export Dossier
        </button>
      </div>
    </header>
  );
};

