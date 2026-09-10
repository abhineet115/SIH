import React, { useState } from "react";
import { Search, ArrowRight, Sparkles, Loader2 } from "lucide-react";

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
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        background: "var(--bg-card)",
        padding: "14px 16px",
        borderRadius: "12px",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Search Bar Input */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
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
            placeholder="Ask a question about this satellite scene..."
            style={{
              width: "100%",
              padding: "10px 12px 10px 38px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-main)",
              color: "var(--text-main)",
              fontSize: "0.85rem",
              outline: "none",
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
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
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "var(--text-muted)" }}>
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
