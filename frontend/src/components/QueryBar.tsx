import React, { useState } from "react";
import {
  Search,
  ArrowRight,
  Sparkles,
  Loader2,
  Globe,
  Building2,
  Droplets,
  Trees,
  ClipboardList,
} from "lucide-react";

interface QueryBarProps {
  onRunQuery: (query: string, mode?: string) => void;
  isLoading: boolean;
  suggestedQueries: string[];
  explanationMode: string;
  onChangeExplanationMode: (mode: string) => void;
}

const QUICK_OPTIONS = [
  {
    id: "plain",
    label: "Plain Overview",
    icon: Globe,
    query: "Explain this satellite scene in simple, plain English without technical jargon",
  },
  {
    id: "urban",
    label: "Urban & Buildings",
    icon: Building2,
    query: "Analyze city infrastructure, buildings, and urban expansion footprint",
  },
  {
    id: "water",
    label: "Water & Flood Risk",
    icon: Droplets,
    query: "Assess surface water bodies, reservoirs, and flood vulnerability",
  },
  {
    id: "veg",
    label: "Forest & Ecology",
    icon: Trees,
    query: "Check vegetation density, tree canopy, and agricultural crop health",
  },
  {
    id: "action",
    label: "Action Plan",
    icon: ClipboardList,
    query: "What are the key real-world risks and recommended actions for this location?",
  },
];

export const QueryBar: React.FC<QueryBarProps> = ({
  onRunQuery,
  isLoading,
  suggestedQueries,
  explanationMode,
  onChangeExplanationMode,
}) => {
  const [inputText, setInputText] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onRunQuery(inputText.trim(), explanationMode);
  };

  const handleQuickOptionClick = (q: string) => {
    setInputText(q);
    onRunQuery(q, explanationMode);
  };

  const handleChipClick = (q: string) => {
    setInputText(q);
    onRunQuery(q, explanationMode);
  };

  return (
    <div
      className="clean-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "14px 16px",
      }}
    >
      {/* Quick Analysis Category Pills */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto", paddingBottom: "2px" }} className="custom-scroll">
        <span style={{ fontSize: "0.71rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
          Quick Options:
        </span>
        {QUICK_OPTIONS.map((opt) => {
          const IconComponent = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleQuickOptionClick(opt.query)}
              disabled={isLoading}
              style={{
                background: "var(--bg-card-subtle)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "999px",
                padding: "3px 9px",
                fontSize: "0.72rem",
                color: "var(--text-main)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
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
              <IconComponent size={12} color="var(--primary)" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar Input & Tone Selector */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: "absolute", left: "12px", pointerEvents: "none" }}
          />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask anything about this satellite scene in simple words..."
            style={{
              width: "100%",
              padding: "10px 12px 10px 38px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-main)",
              color: "var(--text-main)",
              fontSize: "0.84rem",
              outline: "none",
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
          />
        </div>

        {/* Tone Selection Dropdown */}
        <select
          value={explanationMode}
          onChange={(e) => onChangeExplanationMode(e.target.value)}
          title="Explanation Tone / Simplicity"
          style={{
            padding: "9px 10px",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card-subtle)",
            color: "var(--text-main)",
            fontSize: "0.76rem",
            fontWeight: 600,
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="simple">✨ Simple Tone</option>
          <option value="executive">👔 Executive Brief</option>
          <option value="technical">🔬 Technical GIS</option>
        </select>

        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="btn-primary"
          style={{ padding: "8px 16px", fontSize: "0.82rem", whiteSpace: "nowrap" }}
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>Ask</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {/* Suggested Prompt Chips */}
      {suggestedQueries.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.71rem", color: "var(--text-muted)" }}>
            <Sparkles size={12} color="#f59e0b" />
            <span>Try:</span>
          </div>

          {suggestedQueries.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(sq)}
              disabled={isLoading}
              style={{
                background: "var(--bg-card-subtle)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "999px",
                padding: "3px 10px",
                fontSize: "0.73rem",
                color: "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.color = "var(--text-main)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              {sq}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
