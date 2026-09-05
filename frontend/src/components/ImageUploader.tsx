import React, { useRef } from "react";
import { Upload, Layers, Radio, X } from "lucide-react";
import type { RasterMetadata } from "../types";
import { uploadRasterFile } from "../services/api";

interface ImageUploaderProps {
  primaryMeta: RasterMetadata | null;
  secondaryMeta: RasterMetadata | null;
  onPrimaryUploaded: (meta: RasterMetadata, path: string) => void;
  onSecondaryUploaded: (meta: RasterMetadata, path: string) => void;
  onClearSecondary: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  primaryMeta,
  secondaryMeta,
  onPrimaryUploaded,
  onSecondaryUploaded,
  onClearSecondary,
}) => {
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File, isPrimary: boolean) => {
    try {
      const resp = await uploadRasterFile(file);
      if (isPrimary) {
        onPrimaryUploaded(resp.metadata, resp.file_path);
      } else {
        onSecondaryUploaded(resp.metadata, resp.file_path);
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    }
  };

  const renderSlotCard = (
    label: string,
    meta: RasterMetadata | null,
    inputRef: React.RefObject<HTMLInputElement | null>,
    isPrimary: boolean
  ) => {
    const modality = meta?.modality_info?.modality || "OPTICAL";
    const isSar = modality === "SAR";

    return (
      <div
        className="glass-panel"
        style={{
          flex: 1,
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: meta ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.45)',
          borderStyle: meta ? 'solid' : 'dashed'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isSar ? <Radio size={15} color="#a855f7" /> : <Layers size={15} color="#38bdf8" />}
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{label}</span>
          </div>

          {!isPrimary && meta && (
            <button
              onClick={onClearSecondary}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              title="Remove secondary raster"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {meta ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: isSar ? 'rgba(168, 85, 247, 0.2)' : 'rgba(2, 132, 199, 0.2)',
                color: isSar ? '#c084fc' : '#38bdf8',
                border: `1px solid ${isSar ? 'rgba(168, 85, 247, 0.4)' : 'rgba(2, 132, 199, 0.4)'}`
              }}>
                {modality}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#f1f5f9', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {meta.filename}
              </span>
            </div>

            {/* Quick Metadata Chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '0.72rem' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '4px 8px', borderRadius: '4px', color: '#94a3b8' }}>
                CRS: <strong style={{ color: '#e2e8f0' }}>{meta.crs}</strong>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '4px 8px', borderRadius: '4px', color: '#94a3b8' }}>
                GSD: <strong style={{ color: '#e2e8f0' }}>{meta.gsd_meters}m</strong>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '4px 8px', borderRadius: '4px', color: '#94a3b8' }}>
                Bands: <strong style={{ color: '#e2e8f0' }}>{meta.bands} ({meta.dtype})</strong>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '4px 8px', borderRadius: '4px', color: '#94a3b8' }}>
                Dim: <strong style={{ color: '#e2e8f0' }}>{meta.width}×{meta.height}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              flex: 1,
              minHeight: '76px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              gap: '6px'
            }}
          >
            <Upload size={20} color="#38bdf8" />
            <span style={{ fontSize: '0.75rem' }}>Drag & Drop or Click to Upload</span>
            <span style={{ fontSize: '0.65rem', color: '#475569' }}>GeoTIFF, TIFF, PNG, JPEG</span>
          </div>
        )}

        <input
          ref={inputRef as any}
          type="file"
          accept=".tif,.tiff,.png,.jpg,.jpeg"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file, isPrimary);
          }}
        />
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
      {renderSlotCard("Primary Slot (T1 / Optical)", primaryMeta, primaryInputRef, true)}
      {renderSlotCard("Secondary Slot (T2 / SAR)", secondaryMeta, secondaryInputRef, false)}
    </div>
  );
};
