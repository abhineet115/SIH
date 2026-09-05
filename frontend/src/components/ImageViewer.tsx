import React, { useState, useRef } from "react";
import { Eye, EyeOff, Compass, Move } from "lucide-react";
import type { BoundingBox, ChangePolygon, FusionLayer, RasterMetadata } from "../types";

interface ImageViewerProps {
  primaryPreview: string | null;
  secondaryPreview: string | null;
  primaryMeta: RasterMetadata | null;
  secondaryMeta?: RasterMetadata | null;
  boundingBoxes: BoundingBox[];
  changePolygons: ChangePolygon[];
  fusionLayers: FusionLayer[];
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  primaryPreview,
  secondaryPreview,
  primaryMeta,
  boundingBoxes,
  changePolygons,
  fusionLayers,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100%
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.85);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const isDualMode = Boolean(primaryPreview && secondaryPreview);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDualMode) return;
    setIsDragging(true);
    updateSlider(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && isDualMode) {
      updateSlider(e.clientX);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updateSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = (offsetX / rect.width) * 100;
    setSliderPos(pct);
  };

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '480px',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Top Toolbar */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.8)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Compass size={18} color="#38bdf8" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
            {isDualMode ? "Co-Registered Split-Screen Comparator" : "Geospatial Viewport"}
          </span>
          {isDualMode && (
            <span style={{
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              Wipe: {Math.round(sliderPos)}%
            </span>
          )}
        </div>

        {/* Overlay Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Opacity:</span>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
              style={{ width: '70px', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
          </div>

          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            {showOverlays ? <Eye size={13} color="#38bdf8" /> : <EyeOff size={13} color="#94a3b8" />}
            {showOverlays ? "Overlays On" : "Overlays Off"}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          flex: 1,
          position: 'relative',
          background: '#040711',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDualMode ? (isDragging ? 'ew-resize' : 'default') : 'default'
        }}
        className="gis-grid"
      >
        {primaryPreview ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', maxHeight: '540px' }}>
            {/* Primary Image (Base / Left side) */}
            <img
              src={primaryPreview}
              alt="Primary Raster"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none'
              }}
            />

            {/* Secondary Image (Revealed on Right side via Clip-Path) */}
            {isDualMode && secondaryPreview && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
                  pointerEvents: 'none',
                }}
              >
                <img
                  src={secondaryPreview}
                  alt="Secondary Raster"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </div>
            )}

            {/* Split Slider Line & Handle */}
            {isDualMode && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${sliderPos}%`,
                  width: '2px',
                  background: '#38bdf8',
                  boxShadow: '0 0 12px #38bdf8',
                  zIndex: 30,
                  cursor: 'ew-resize'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#0f172a',
                    border: '2px solid #38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(56, 189, 248, 0.8)',
                    color: '#38bdf8',
                    cursor: 'ew-resize'
                  }}
                >
                  <Move size={15} />
                </div>
              </div>
            )}

            {/* Vector Overlays Layer (Bounding Boxes & Change Polygons) */}
            {showOverlays && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'auto',
                  opacity: overlayOpacity,
                  zIndex: 25
                }}
              >
                {/* 1. Bounding Boxes */}
                {boundingBoxes.map((b) => {
                  const [ymin, xmin, ymax, xmax] = b.box;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedItem(b)}
                      style={{
                        position: 'absolute',
                        top: `${ymin}%`,
                        left: `${xmin}%`,
                        width: `${xmax - xmin}%`,
                        height: `${ymax - ymin}%`,
                        border: `2px solid ${b.color}`,
                        backgroundColor: `${b.color}22`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        boxShadow: `0 0 10px ${b.color}66`,
                        transition: 'all 0.15s ease'
                      }}
                      title={`${b.label} (${Math.round(b.confidence * 100)}%)`}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: '-20px',
                          left: '0',
                          backgroundColor: b.color,
                          color: '#0f172a',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                        }}
                      >
                        {b.label}
                      </span>
                    </div>
                  );
                })}

                {/* 2. Change Polygons */}
                {changePolygons.map((cp) => {
                  const [ymin, xmin, ymax, xmax] = cp.box;
                  return (
                    <div
                      key={cp.id}
                      onClick={() => setSelectedItem(cp)}
                      style={{
                        position: 'absolute',
                        top: `${ymin}%`,
                        left: `${xmin}%`,
                        width: `${xmax - xmin}%`,
                        height: `${ymax - ymin}%`,
                        border: `2px dashed ${cp.color}`,
                        backgroundColor: `${cp.color}25`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        boxShadow: `0 0 12px ${cp.color}55`
                      }}
                      title={`${cp.label} (${cp.delta_area_sqkm > 0 ? '+' : ''}${cp.delta_area_sqkm} km²)`}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-20px',
                          left: '0',
                          backgroundColor: cp.color,
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                        }}
                      >
                        {cp.category}: {cp.delta_area_sqkm > 0 ? `+${cp.delta_area_sqkm} km²` : `${cp.delta_area_sqkm} km²`}
                      </span>
                    </div>
                  );
                })}

                {/* 3. Fusion Layers */}
                {fusionLayers.map((fl) => {
                  const [ymin, xmin, ymax, xmax] = fl.box;
                  return (
                    <div
                      key={fl.id}
                      onClick={() => setSelectedItem(fl)}
                      style={{
                        position: 'absolute',
                        top: `${ymin}%`,
                        left: `${xmin}%`,
                        width: `${xmax - xmin}%`,
                        height: `${ymax - ymin}%`,
                        border: `2px solid ${fl.color}`,
                        backgroundColor: `${fl.color}30`,
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: '-20px',
                          left: '0',
                          backgroundColor: fl.color,
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {fl.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '6px' }}>No satellite raster loaded</p>
            <p style={{ fontSize: '0.75rem', color: '#475569' }}>
              Select a benchmark scenario from the top bar or upload images into the slots above.
            </p>
          </div>
        )}

        {/* Selected Item Detail Floating Pill */}
        {selectedItem && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              right: '16px',
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${selectedItem.color || '#38bdf8'}`,
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 35
            }}
          >
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                {selectedItem.label}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {selectedItem.details || selectedItem.description || selectedItem.notes}
              </div>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#e2e8f0',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Coordinate & Reference Footer Bar */}
      <div
        style={{
          padding: '6px 16px',
          borderTop: '1px solid rgba(56, 189, 248, 0.12)',
          background: 'rgba(10, 17, 36, 0.9)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#64748b'
        }}
      >
        <span>
          CRS: <strong style={{ color: '#94a3b8' }}>{primaryMeta?.crs || "EPSG:32643"}</strong> | Bounds:{" "}
          <strong style={{ color: '#94a3b8' }}>
            {primaryMeta?.bounds.west.toFixed(2)}°E, {primaryMeta?.bounds.north.toFixed(2)}°N
          </strong>
        </span>
        <span>
          Ground Sample Distance: <strong style={{ color: '#94a3b8' }}>{primaryMeta?.gsd_meters || 10}m/px</strong>
        </span>
      </div>
    </div>
  );
};
