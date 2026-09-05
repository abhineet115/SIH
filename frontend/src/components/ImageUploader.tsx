import React, { useRef, useState, useCallback } from "react";
import { Upload, Layers, Radio, X, CheckCircle, Loader, RefreshCw, AlertTriangle } from "lucide-react";
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

  const handleUpload = useCallback(async (file: File, isPrimary: boolean) => {
    const setUploadState = isPrimary ? setPrimaryUploadState : setSecondaryUploadState;
    const setProgress = isPrimary ? setPrimaryProgress : setSecondaryProgress;
    const setError = isPrimary ? setPrimaryError : setSecondaryError;

    setError(null);
    setProgress(0);
    setUploadState("uploading");

    // Simulate progress while the real upload goes through
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
  }, [onPrimaryUploaded, onSecondaryUploaded]);

  const handleDrop = useCallback((e: React.DragEvent, isPrimary: boolean) => {
    e.preventDefault();
    if (isPrimary) setPrimaryDragOver(false);
    else setSecondaryDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file, isPrimary);
  }, [handleUpload]);

  const renderSlotCard = (
    label: string,
    meta: RasterMetadata | null,
    inputRef: React.RefObject<HTMLInputElement | null>,
    isPrimary: boolean
  ) => {
    const uploadState = isPrimary ? primaryUploadState : secondaryUploadState;
    const progress = isPrimary ? primaryProgress : secondaryProgress;
    const error = isPrimary ? primaryError : secondaryError;
    const isDragOver = isPrimary ? primaryDragOver : secondaryDragOver;
    const modality = meta?.modality_info?.modality || "OPTICAL";
    const isSar = modality === "SAR";
    const isUploading = uploadState === "uploading";

    const accentColor = isSar ? "#a855f7" : "#38bdf8";
    const accentBg = isSar ? "rgba(168,85,247,0.18)" : "rgba(56,189,248,0.15)";

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
          flex: 1,
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          position: "relative",
          background: isDragOver
            ? `rgba(56,189,248,0.12)`
            : meta
            ? "rgba(15, 23, 42, 0.85)"
            : "rgba(15, 23, 42, 0.45)",
          borderStyle: meta ? "solid" : "dashed",
          borderColor: isDragOver ? "#38bdf8" : error ? "rgba(239,68,68,0.5)" : undefined,
          transition: "all 0.2s ease",
          transform: isDragOver ? "scale(1.01)" : "scale(1)",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {isSar ? (
              <Radio size={15} color="#a855f7" />
            ) : (
              <Layers size={15} color="#38bdf8" />
            )}
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0" }}>{label}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {meta && (
              <button
                title="Replace with new file"
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
                <RefreshCw size={13} />
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
                <X size={14} />
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
                fontSize: "0.7rem",
                color: "#94a3b8",
                marginBottom: "4px",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Loader size={11} style={{ animation: "spin 1s linear infinite" }} />
                Uploading &amp; analysing raster...
              </span>
              <span style={{ color: accentColor, fontWeight: 600 }}>{progress}%</span>
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
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}aa)`,
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
              padding: "6px 10px",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "6px",
              fontSize: "0.72rem",
              color: "#fca5a5",
            }}
          >
            <AlertTriangle size={12} />
            <span>{error}</span>
            <button
              onClick={() => inputRef.current?.click()}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "none",
                color: "#f87171",
                cursor: "pointer",
                fontSize: "0.7rem",
                textDecoration: "underline",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Metadata chips or empty drop zone */}
        {meta && !isUploading ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <CheckCircle size={13} color="#10b981" />
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: accentBg,
                  color: accentColor,
                  border: `1px solid ${accentColor}60`,
                }}
              >
                {modality}
              </span>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "#f1f5f9",
                  fontWeight: 500,
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
                gap: "5px",
                fontSize: "0.72rem",
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
                    background: "rgba(30, 41, 59, 0.6)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    color: "#94a3b8",
                  }}
                >
                  {k}:{" "}
                  <strong style={{ color: "#e2e8f0" }}>{v}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : !isUploading && !error ? (
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              flex: 1,
              minHeight: "76px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
              gap: "6px",
              borderRadius: "8px",
              transition: "all 0.2s ease",
            }}
          >
            <Upload size={20} color={isDragOver ? "#38bdf8" : "#475569"} style={{ transition: "color 0.2s" }} />
            <span style={{ fontSize: "0.75rem", color: isDragOver ? "#94a3b8" : undefined }}>
              {isDragOver ? "Drop to upload" : "Drag & Drop or Click to Upload"}
            </span>
            <span style={{ fontSize: "0.65rem", color: "#475569" }}>GeoTIFF, TIFF, PNG, JPEG</span>
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
    <div style={{ display: "flex", gap: "12px", width: "100%" }}>
      {renderSlotCard("Primary Slot (T1 / Optical)", primaryMeta, primaryInputRef, true)}
      {renderSlotCard("Secondary Slot (T2 / SAR)", secondaryMeta, secondaryInputRef, false)}
    </div>
  );
};

export default ImageUploader;
