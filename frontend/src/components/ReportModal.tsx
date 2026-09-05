import React, { useState } from "react";
import { FileText, Download, X, Check, Code } from "lucide-react";
import type { AnalysisResult } from "../types";
import { exportPDFReport } from "../services/api";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  if (!isOpen || !result) return null;

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      const url = await exportPDFReport(result);
      setDownloadUrl(url);
    } catch (err: any) {
      alert(`PDF Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Export Intelligence Dispatch
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
          Download an official ISRO mission intelligence document containing the executive assessment, 4-signal confidence metrics, spatial coordinates, and the complete auditable execution trace.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {downloadUrl ? (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ justifyContent: 'center', textDecoration: 'none' }}
            >
              <Download size={16} />
              Download Generated PDF Report
            </a>
          ) : (
            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="btn-primary"
              style={{ justifyContent: 'center' }}
            >
              <FileText size={16} />
              {isGenerating ? "Compiling PDF Report..." : "Generate Official PDF Report"}
            </button>
          )}

          <button
            onClick={handleCopyJSON}
            className="btn-secondary"
            style={{ justifyContent: 'center' }}
          >
            {copiedJson ? <Check size={16} color="#10b981" /> : <Code size={16} />}
            {copiedJson ? "Copied Analysis JSON to Clipboard!" : "Copy Full Analysis JSON Payload"}
          </button>
        </div>
      </div>
    </div>
  );
};
