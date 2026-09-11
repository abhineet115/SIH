import React, { useState, useEffect } from "react";
import { Sparkles, Key, CheckCircle, AlertCircle, ExternalLink, X, Cpu, ShieldCheck } from "lucide-react";
import { testGeminiConnection } from "../services/api";

interface GeminiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string, model: string) => void;
  currentModel: string;
}

export const GeminiSettingsModal: React.FC<GeminiSettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
  currentModel,
}) => {
  const [inputKey, setInputKey] = useState<string>(apiKey);
  const [selectedModel, setSelectedModel] = useState<string>(currentModel || "gemini-2.5-flash");
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);

  useEffect(() => {
    setInputKey(apiKey);
    setSelectedModel(currentModel || "gemini-2.5-flash");
    setTestResult(null);
  }, [apiKey, currentModel, isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiConnection(inputKey.trim(), selectedModel);
      setTestResult({ valid: res.valid, message: res.message });
    } catch (err: any) {
      setTestResult({ valid: false, message: err.message || "Connection failed." });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveKey(inputKey.trim(), selectedModel);
    onClose();
  };

  const handleClear = () => {
    setInputKey("");
    setTestResult(null);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg-card-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #a855f7, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>
                Google Gemini AI Settings
              </h3>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Generate plain-English, simplified summaries & actionable insights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Smart Fallback Info Banner */}
          <div
            style={{
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "10px",
              padding: "12px 14px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: "0.78rem",
              lineHeight: 1.45,
              color: "var(--text-main)",
            }}
          >
            <ShieldCheck size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong>Built-in Smart Fallback:</strong> SatQuery automatically provides simplified, plain-English
              explanations even without an API key! Supplying your Gemini API key activates multimodal live AI reasoning.
            </div>
          </div>

          {/* API Key Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--text-main)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Key size={14} color="var(--primary)" />
                Gemini API Key:
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "var(--primary)",
                  fontSize: "0.72rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  textDecoration: "none",
                }}
              >
                <span>Get Free Key</span>
                <ExternalLink size={11} />
              </a>
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy... (leave blank to use smart offline mode)"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-main)",
                  color: "var(--text-main)",
                  fontSize: "0.82rem",
                  fontFamily: "monospace",
                  outline: "none",
                }}
              />
              {inputKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    position: "absolute",
                    right: "8px",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "0.7rem",
                    padding: "2px 6px",
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Model Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--text-main)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Cpu size={14} color="var(--primary)" />
              Gemini Model:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {[
                { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", badge: "Fastest & Newest" },
                { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", badge: "High Speed" },
                { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", badge: "Deep Analysis" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: `1px solid ${selectedModel === m.id ? "var(--primary)" : "var(--border-subtle)"}`,
                    background: selectedModel === m.id ? "rgba(168, 85, 247, 0.12)" : "var(--bg-card-subtle)",
                    color: selectedModel === m.id ? "var(--text-main)" : "var(--text-muted)",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{m.name}</span>
                  <span style={{ fontSize: "0.65rem", color: selectedModel === m.id ? "var(--primary)" : "var(--text-muted)" }}>
                    {m.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Test Feedback */}
          {testResult && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: testResult.valid ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${testResult.valid ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.76rem",
                color: testResult.valid ? "#10b981" : "#ef4444",
              }}
            >
              {testResult.valid ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg-card-subtle)",
          }}
        >
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting}
            className="btn-secondary"
            style={{ fontSize: "0.78rem", padding: "6px 14px" }}
          >
            {isTesting ? "Testing..." : "Test Connection"}
          </button>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ fontSize: "0.78rem", padding: "6px 14px" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary"
              style={{ fontSize: "0.78rem", padding: "6px 16px" }}
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
