import React, { useState } from "react";
import { Sparkles, Terminal, CornerDownLeft, Zap } from "lucide-react";

interface QueryBarProps {
  onRunQuery: (query: string) => void;
  isLoading: boolean;
  suggestedQueries: string[];
}

export const QueryBar: React.FC<QueryBarProps> = ({
  onRunQuery,
  isLoading,
  suggestedQueries,
}) => {
  const [inputText, setInputText] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onRunQuery(inputText.trim());
  };

  const handleChipClick = (q: string) => {
    setInputText(q);
    onRunQuery(q);
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        background: "rgba(8, 14, 28, 0.85)",
        border: "1px solid rgba(0, 240, 255, 0.25)",
      }}
    >
      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Terminal
            size={16}
            color="#00f0ff"
            style={{ position: "absolute", left: "12px", pointerEvents: "none" }}
          />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask SatQuery Agent (e.g., 'Highlight runway corridors' or 'Detect urban expansion')..."
            style={{
              width: "100%",
              padding: "11px 12px 11px 38px",
              borderRadius: "8px",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              background: "rgba(4, 9, 22, 0.9)",
              color: "#f8fafc",
              fontSize: "0.85rem",
              outline: "none",
              transition: "all 0.2s ease",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="btn-primary"
          style={{ padding: "8px 16px", fontSize: "0.82rem" }}
        >
          {isLoading ? (
            <>
              <span
                className="pulse-indicator"
                style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ffffff" }}
              />
              Routing...
            </>
          ) : (
            <>
              <Zap size={14} />
              Execute
              <CornerDownLeft size={11} style={{ opacity: 0.6 }} />
            </>
          )}
        </button>
      </form>

      {/* Suggested Prompt Chips */}
      {suggestedQueries.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", color: "#64748b" }}>
            <Sparkles size={11} color="#f59e0b" />
            <span>Preset Chips:</span>
          </div>

          {suggestedQueries.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(sq)}
              disabled={isLoading}
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: "999px",
                padding: "3px 10px",
                fontSize: "0.72rem",
                color: "#cbd5e1",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-sans)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#00f0ff";
                e.currentTarget.style.color = "#00f0ff";
                e.currentTarget.style.boxShadow = "0 0 10px rgba(0,240,255,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.2)";
                e.currentTarget.style.color = "#cbd5e1";
                e.currentTarget.style.boxShadow = "none";
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

