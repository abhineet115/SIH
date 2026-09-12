import React, { useRef, useState, useCallback } from "react";
import {
  Upload,
  Layers,
  Radio,
  X,
  CheckCircle,
  Loader2,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import type { RasterMetadata } from "../types";
import { uploadRasterFile } from "../services/api";

interface ImageUploaderProps {
  primaryMeta: RasterMetadata | null;
  secondaryMeta: RasterMetadata | null;
  onPrimaryUploaded: (meta: RasterMetadata, path: string) => void;
  onSecondaryUploaded: (meta: RasterMetadata, path: string) => void;
  onClearPrimary: () => void;
  onClearSecondary: () => void;
}

type UploadState = "idle" | "uploading" | "done" | "error";

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  primaryMeta,
  secondaryMeta,
  onPrimaryUploaded,
  onSecondaryUploaded,
  onClearPrimary,
  onClearSecondary,
}) => {
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);

  const [primaryUploadState, setPrimaryUploadState] = useState<UploadState>("idle");
  const [secondaryUploadState, setSecondaryUploadState] = useState<UploadState>("idle");
  const [primaryError, setPrimaryError] = useState<string | null>(null);
  const [secondaryError, setSecondaryError] = useState<string | null>(null);
  const [primaryDragOver, setPrimaryDragOver] = useState(false);
  const [secondaryDragOver, setSecondaryDragOver] = useState(false);

  const handleUpload = useCallback(
    async (file: File, isPrimary: boolean) => {
      const setUploadState = isPrimary ? setPrimaryUploadState : setSecondaryUploadState;
      const setError = isPrimary ? setPrimaryError : setSecondaryError;

      setError(null);
      setUploadState("uploading");

      try {
        const resp = await uploadRasterFile(file);
        setUploadState("done");
        if (isPrimary) {
          onPrimaryUploaded(resp.metadata, resp.file_path);
        } else {
          onSecondaryUploaded(resp.metadata, resp.file_path);
        }
      } catch (err: any) {
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

  const renderSlot = (
    label: string,
    meta: RasterMetadata | null,
    inputRef: React.RefObject<HTMLInputElement | null>,
    isPrimary: boolean
  ) => {
    const uploadState = isPrimary ? primaryUploadState : secondaryUploadState;
    const error = isPrimary ? primaryError : secondaryError;
    const isDragOver = isPrimary ? primaryDragOver : secondaryDragOver;
    const isUploading = uploadState === "uploading";
    const modality = meta?.modality_info?.modality || (isPrimary ? "OPTICAL" : "SAR");
    const isSar = modality === "SAR";

    return (
      <div
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
          padding: "10px 12px",
          background: isDragOver ? "var(--primary-subtle)" : "var(--bg-card-subtle)",
          border: isDragOver
            ? "1px solid var(--primary)"
            : error
            ? "1px solid rgba(239, 68, 68, 0.4)"
            : "1px solid var(--border-subtle)",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          minWidth: 0,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {isSar ? <Radio size={13} color="#a855f7" /> : <Layers size={13} color="var(--primary)" />}
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-main)" }}>
              {label}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {meta && (
              <button
                title="Change file"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "2px",
                }}
              >
                <RefreshCw size={11} />
              </button>
            )}
            {meta && (
              <button
                onClick={isPrimary ? onClearPrimary : onClearSecondary}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "2px",
                }}
                title="Remove secondary"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {isUploading ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", color: "var(--primary)", padding: "12px 0", justifyContent: "center" }}>
            <Loader2 size={13} className="animate-spin" />
            <span>Processing GeoTIFF...</span>
          </div>
        ) : error ? (
          <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#f87171", fontSize: "0.72rem" }}>
            <AlertCircle size={12} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{error}</span>
          </div>
        ) : meta ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
              <CheckCircle size={12} color="var(--success)" />
              <span
                style={{
                  fontSize: "0.73rem",
                  color: "var(--text-main)",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={meta.filename}
              >
                {meta.filename}
              </span>
            </div>
            <div style={{ display: "flex", gap: "6px", fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              <span>{meta.gsd_meters}m</span>
              <span>•</span>
              <span>{meta.bands} bands</span>
              <span>•</span>
              <span>{meta.crs || "EPSG:32643"}</span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              padding: "8px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            <Upload size={13} />
            <span style={{ fontSize: "0.74rem" }}>Upload GeoTIFF</span>
          </div>
        )}

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
    <div
      style={{
        display: "flex",
        gap: "10px",
        background: "var(--bg-card)",
        padding: "12px 14px",
        borderRadius: "12px",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {renderSlot("Primary Image", primaryMeta, primaryInputRef, true)}
      {renderSlot("Secondary (T2 / SAR)", secondaryMeta, secondaryInputRef, false)}
    </div>
  );
};

export default ImageUploader;
