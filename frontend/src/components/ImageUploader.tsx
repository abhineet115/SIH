import React, { useRef, useState, useCallback } from "react";
import {
  Upload,
  Layers,
  Radio,
  X,
  CheckCircle,
  Loader,
  RefreshCw,
  AlertTriangle,
  Cpu
} from "lucide-react";
import type { RasterMetadata } from "../types";
import { uploadRasterFile } from "../services/api";

interface ImageUploaderProps {
  primaryMeta: RasterMetadata | null;
  secondaryMeta: RasterMetadata | null;
  onPrimaryUploaded: (meta: RasterMetadata, path: string) => void;
  onSecondaryUploaded: (meta: RasterMetadata, path: string) => void;
  onClearSecondary: () => void;
}

type UploadState = "idle" | "uploading" | "done" | "error";

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  primaryMeta,
  secondaryMeta,
  onPrimaryUploaded,
  onSecondaryUploaded,
  onClearSecondary,
}) => {
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);

  const [primaryUploadState, setPrimaryUploadState] = useState<UploadState>("idle");
  const [secondaryUploadState, setSecondaryUploadState] = useState<UploadState>("idle");
  const [primaryProgress, setPrimaryProgress] = useState(0);
  const [secondaryProgress, setSecondaryProgress] = useState(0);
  const [primaryError, setPrimaryError] = useState<string | null>(null);
  const [secondaryError, setSecondaryError] = useState<string | null>(null);
  const [primaryDragOver, setPrimaryDragOver] = useState(false);
  const [secondaryDragOver, setSecondaryDragOver] = useState(false);

  const simulateProgress = (setProgress: (v: number) => void, onDone: () => void) => {
    let val = 0;
    const interval = setInterval(() => {
      val += Math.random() * 25;
      if (val >= 90) {
        clearInterval(interval);
        setProgress(90);
        onDone();
      } else {
        setProgress(Math.round(val));
      }
    }, 120);
    return interval;
  };

  const handleUpload = useCallback(
    async (file: File, isPrimary: boolean) => {
      const setUploadState = isPrimary ? setPrimaryUploadState : setSecondaryUploadState;
      const setProgress = isPrimary ? setPrimaryProgress : setSecondaryProgress;
      const setError = isPrimary ? setPrimaryError : setSecondaryError;

      setError(null);
      setProgress(0);
      setUploadState("uploading");

      const interval = simulateProgress(setProgress, () => {});

      try {
        const resp = await uploadRasterFile(file);
        clearInterval(interval);
        setProgress(100);
        setUploadState("done");
        if (isPrimary) {
          onPrimaryUploaded(resp.metadata, resp.file_path);
        } else {
          onSecondaryUploaded(resp.metadata, resp.file_path);
        }
      } catch (err: any) {
        clearInterval(interval);
        setProgress(0);
        setUploadState("error");
        setError(err.message || "Upload failed");
      }
    },
    [onPrimaryUploaded, onSecondaryUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, isPrimary: boolean) => {
      e.preventDefault();
      if (isPrimary) setPrimaryDragOver(false);
      else setSecondaryDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleUpload(file, isPrimary);
    },
    [handleUpload]
  );

  const renderSlotCard = (
    label: string,
    tag: string,
    meta: RasterMetadata | null,
    inputRef: React.RefObject<HTMLInputElement | null>,
    isPrimary: boolean
  ) => {
    const uploadState = isPrimary ? primaryUploadState : secondaryUploadState;
    const progress = isPrimary ? primaryProgress : secondaryProgress;
    const error = isPrimary ? primaryError : secondaryError;
    const isDragOver = isPrimary ? primaryDragOver : secondaryDragOver;
    const modality = meta?.modality_info?.modality || (isPrimary ? "OPTICAL" : "SAR");
    const isSar = modality === "SAR";
    const isUploading = uploadState === "uploading";

    const accentColor = isSar ? "#a855f7" : "#00f0ff";
    const accentBg = isSar ? "rgba(168,85,247,0.16)" : "rgba(0,240,255,0.14)";

    return (
      <div
        className="glass-panel"
        onDragOver={(e) => {
          e.preventDefault();
          if (isPrimary) setPrimaryDragOver(true);
          else setSecondaryDragOver(true);
        }}
        onDragLeave={() => {
          if (isPrimary) setPrimaryDragOver(false);
          else setSecondaryDragOver(false);
        }}
        onDrop={(e) => handleDrop(e, isPrimary)}
        style={{
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          background: isDragOver
            ? "rgba(0,240,255,0.12)"
            : meta
            ? "rgba(10, 18, 36, 0.88)"
            : "rgba(8, 14, 28, 0.55)",
          border: isDragOver
            ? "1px solid #00f0ff"
            : error
            ? "1px solid rgba(239,68,68,0.5)"
            : meta
            ? "1px solid rgba(56, 189, 248, 0.25)"
            : "1px dashed rgba(56, 189, 248, 0.2)",
          borderRadius: "10px",
          transition: "all 0.2s ease",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {isSar ? <Radio size={14} color="#a855f7" /> : <Layers size={14} color="#00f0ff" />}
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#f1f5f9" }}>{label}</span>
            <span
              style={{
                fontSize: "0.62rem",
                padding: "1px 5px",
                borderRadius: "3px",
                background: "rgba(56, 189, 248, 0.12)",
                color: "#94a3b8",
                fontFamily: "var(--font-mono)",
              }}
            >
              {tag}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {meta && (
              <button
                title="Replace with new GeoTIFF"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                }}
              >
                <RefreshCw size={12} />
              </button>
            )}
            {!isPrimary && meta && (
              <button
                onClick={onClearSecondary}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
                title="Remove secondary raster"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Upload progress bar */}
        {isUploading && (
          <div style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.68rem",
                color: "#94a3b8",
                marginBottom: "4px",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Loader size={11} style={{ animation: "spin 1s linear infinite" }} />
                Calibrating raster...
              </span>
              <span style={{ color: accentColor, fontWeight: 700 }}>{progress}%</span>
            </div>
            <div
              style={{
                height: "4px",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
                  borderRadius: "4px",
                  transition: "width 0.15s ease",
                  boxShadow: `0 0 8px ${accentColor}80`,
                }}
              />
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isUploading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 8px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: "6px",
              fontSize: "0.7rem",
              color: "#fca5a5",
            }}
          >
            <AlertTriangle size={12} />
            <span>{error}</span>
          </div>
        )}

        {/* Metadata chips or dropzone */}
        {meta && !isUploading ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <CheckCircle size={12} color="#10b981" />
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: "3px",
                  background: accentBg,
                  color: accentColor,
                  border: `1px solid ${accentColor}60`,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {modality}
              </span>
              <span
                style={{
                  fontSize: "0.74rem",
                  color: "#f1f5f9",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
              >
                {meta.filename}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "4px",
                fontSize: "0.68rem",
                fontFamily: "var(--font-mono)",
              }}
            >
              {[
                ["CRS", meta.crs],
                ["GSD", `${meta.gsd_meters}m`],
                ["Bands", `${meta.bands} (${meta.dtype})`],
                ["Dim", `${meta.width}×${meta.height}`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    background: "rgba(20, 32, 56, 0.6)",
                    padding: "3px 6px",
                    borderRadius: "4px",
                    color: "#94a3b8",
                  }}
                >
                  {k}: <strong style={{ color: "#f8fafc" }}>{v}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : !isUploading && !error ? (
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              minHeight: "68px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
              gap: "4px",
              borderRadius: "6px",
              transition: "all 0.2s ease",
            }}
          >
            <Upload size={16} color={isDragOver ? "#00f0ff" : "#475569"} />
            <span style={{ fontSize: "0.72rem", color: isDragOver ? "#94a3b8" : "#94a3b8" }}>
              {isDragOver ? "Drop to Ingest" : "Ingest Raster"}
            </span>
            <span style={{ fontSize: "0.62rem", color: "#475569" }}>GeoTIFF, TIFF, PNG</span>
          </div>
        ) : null}

        <input
          ref={inputRef as any}
          type="file"
          accept=".tif,.tiff,.png,.jpg,.jpeg"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleUpload(file, isPrimary);
              e.target.value = "";
            }
          }}
        />
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Cpu size={15} color="#00f0ff" />
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f8fafc", letterSpacing: "0.03em", textTransform: "uppercase" }}>
            Sensor Ingestion Console
          </span>
        </div>
        <span style={{ fontSize: "0.65rem", color: "#64748b", fontFamily: "var(--font-mono)" }}>
          Dual-Band Telemetry
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {renderSlotCard("Primary Ingest (T1 / Base)", "SLOT-01", primaryMeta, primaryInputRef, true)}
        {renderSlotCard("Secondary Ingest (T2 / Radar)", "SLOT-02", secondaryMeta, secondaryInputRef, false)}
      </div>
    </div>
  );
};

export default ImageUploader;

