import React, { useState } from "react";
import { Send, Sparkles, Terminal } from "lucide-react";

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
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <div style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Terminal
            size={18}
            color="#38bdf8"
            style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }}
          />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a remote sensing question (e.g., 'Highlight runway corridors' or 'Detect urban expansion')..."
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              borderRadius: '10px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              background: 'rgba(15, 23, 42, 0.9)',
              color: '#f8fafc',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="btn-primary"
        >
          {isLoading ? (
            <>
              <span className="pulse-indicator" style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
              Routing Agent...
            </>
          ) : (
            <>
              <Send size={15} />
              Execute Query
            </>
          )}
        </button>
      </form>

      {/* Suggested Prompt Chips */}
      {suggestedQueries.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#64748b' }}>
            <Sparkles size={13} color="#f59e0b" />
            <span>Preset Chips:</span>
          </div>

          {suggestedQueries.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(sq)}
              disabled={isLoading}
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '999px',
                padding: '4px 12px',
                fontSize: '0.74rem',
                color: '#cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.color = '#38bdf8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                e.currentTarget.style.color = '#cbd5e1';
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
