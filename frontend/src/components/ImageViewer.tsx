import React, { useState, useRef, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  Info,
  Sliders,
  Check,
  Maximize2
} from "lucide-react";
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
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.85);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [layerFilters, setLayerFilters] = useState({
    boxes: true,
    polygons: true,
    fusion: true,
  });

  const [cursorGeo, setCursorGeo] = useState<{ lat: number; lon: number } | null>(null);
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
    trackCoordinates(e);
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

  const trackCoordinates = useCallback(
    (e: React.PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pctX = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
      const pctY = Math.max(0, Math.min((e.clientY - rect.top) / rect.height, 1));

      const west = primaryMeta?.bounds?.west ?? 77.10;
      const east = primaryMeta?.bounds?.east ?? 77.35;
      const north = primaryMeta?.bounds?.north ?? 28.75;
      const south = primaryMeta?.bounds?.south ?? 28.50;

      const lon = west + pctX * (east - west);
      const lat = north - pctY * (north - south);
      setCursorGeo({ lat, lon });
    },
    [primaryMeta]
  );

  const handleZoomChange = (delta: number) => {
    setZoomLevel((prev) => Math.max(1, Math.min(2.5, Number((prev + delta).toFixed(2)))));
  };

  const resetZoom = () => setZoomLevel(1);

  const activeBoxCount = layerFilters.boxes ? boundingBoxes.length : 0;
  const activePolyCount = layerFilters.polygons ? changePolygons.length : 0;
  const activeFusionCount = layerFilters.fusion ? fusionLayers.length : 0;
  const totalDetections = activeBoxCount + activePolyCount + activeFusionCount;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "480px",
        overflow: "hidden",
        position: "relative",
        background: "var(--bg-card)",
        borderRadius: "12px",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Viewport Clean Header Toolbar */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-card)",
          zIndex: 30,
        }}
      >
        {/* Left: View mode & targets count */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
            {isDualMode ? "Before / After Split" : "Satellite View"}
          </span>

          {totalDetections > 0 && (
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "999px",
                background: "var(--primary-subtle)",
                color: "var(--primary)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
              }}
            >
              {totalDetections} {totalDetections === 1 ? "detection" : "detections"}
            </span>
          )}

          {isDualMode && (
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                borderRadius: "999px",
                background: "rgba(245, 158, 11, 0.12)",
                color: "#f59e0b",
                fontFamily: "var(--font-mono)",
              }}
            >
              Split: {Math.round(sliderPos)}%
            </span>
          )}
        </div>

        {/* Right: Layer filters, opacity, & zoom controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Layer Filter Toggles */}
          {boundingBoxes.length > 0 && (
            <button
              onClick={() => setLayerFilters((p) => ({ ...p, boxes: !p.boxes }))}
              className="btn-control"
              style={{
                background: layerFilters.boxes ? "var(--primary-subtle)" : "transparent",
                color: layerFilters.boxes ? "var(--primary)" : "var(--text-muted)",
                borderColor: layerFilters.boxes ? "rgba(56, 189, 248, 0.3)" : "var(--border-subtle)",
              }}
              title="Toggle Bounding Boxes"
            >
              <Check size={12} color={layerFilters.boxes ? "var(--primary)" : "var(--text-muted)"} />
              Boxes ({boundingBoxes.length})
            </button>
          )}

          {changePolygons.length > 0 && (
            <button
              onClick={() => setLayerFilters((p) => ({ ...p, polygons: !p.polygons }))}
              className="btn-control"
              style={{
                background: layerFilters.polygons ? "rgba(239, 68, 68, 0.12)" : "transparent",
                color: layerFilters.polygons ? "#f87171" : "var(--text-muted)",
                borderColor: layerFilters.polygons ? "rgba(239, 68, 68, 0.3)" : "var(--border-subtle)",
              }}
              title="Toggle Change Polygons"
            >
              <Check size={12} color={layerFilters.polygons ? "#f87171" : "var(--text-muted)"} />
              Changes ({changePolygons.length})
            </button>
          )}

          {fusionLayers.length > 0 && (
            <button
              onClick={() => setLayerFilters((p) => ({ ...p, fusion: !p.fusion }))}
              className="btn-control"
              style={{
                background: layerFilters.fusion ? "rgba(168, 85, 247, 0.12)" : "transparent",
                color: layerFilters.fusion ? "#c084fc" : "var(--text-muted)",
                borderColor: layerFilters.fusion ? "rgba(168, 85, 247, 0.3)" : "var(--border-subtle)",
              }}
              title="Toggle Radar Fusion"
            >
              <Check size={12} color={layerFilters.fusion ? "#c084fc" : "var(--text-muted)"} />
              SAR ({fusionLayers.length})
            </button>
          )}

          {/* Opacity slider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
              background: "var(--bg-card-subtle)",
              borderRadius: "6px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Sliders size={12} color="var(--text-muted)" />
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
              style={{ width: "48px", accentColor: "var(--primary)", cursor: "pointer" }}
              title={`Overlay Opacity: ${Math.round(overlayOpacity * 100)}%`}
            />
          </div>

          {/* Master Overlay Toggle */}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className="btn-secondary"
            style={{ padding: "5px 10px", fontSize: "0.75rem" }}
            title="Toggle All Overlays"
          >
            {showOverlays ? <Eye size={13} color="var(--primary)" /> : <EyeOff size={13} color="var(--text-muted)" />}
            {showOverlays ? "Annotations" : "Hidden"}
          </button>
        </div>
      </div>

      {/* Main Image Canvas Area */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          handlePointerUp();
          setCursorGeo(null);
        }}
        style={{
          flex: 1,
          position: "relative",
          background: "#080c14",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isDualMode ? (isDragging ? "ew-resize" : "crosshair") : "crosshair",
        }}
      >
        {primaryPreview ? (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.15s ease",
            }}
          >
            {/* Primary Image Layer */}
            <img
              src={primaryPreview}
              alt="Primary Satellite Scene"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
                pointerEvents: "none",
                userSelect: "none",
              }}
            />

            {/* Secondary Co-Registered Layer with Split Polygon */}
            {isDualMode && secondaryPreview && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
                  pointerEvents: "none",
                }}
              >
                <img
                  src={secondaryPreview}
                  alt="Secondary Satellite Scene"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            )}

            {/* Clean Split Divider Line & Handle */}
            {isDualMode && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${sliderPos}%`,
                  width: "2px",
                  background: "#ffffff",
                  boxShadow: "0 0 8px rgba(0, 0, 0, 0.6)",
                  zIndex: 25,
                  cursor: "ew-resize",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "#0f172a",
                    border: "2px solid #ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                    color: "#ffffff",
                    cursor: "ew-resize",
                  }}
                >
                  <Move size={14} />
                </div>
              </div>
            )}

            {/* Annotations & Detections Overlays */}
            {showOverlays && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "auto",
                  opacity: overlayOpacity,
                  zIndex: 20,
                }}
              >
                {/* 1. Visual Grounding Bounding Boxes */}
                {layerFilters.boxes &&
                  boundingBoxes.map((b) => {
                    const [ymin, xmin, ymax, xmax] = b.box;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedItem(b)}
                        style={{
                          position: "absolute",
                          top: `${ymin}%`,
                          left: `${xmin}%`,
                          width: `${xmax - xmin}%`,
                          height: `${ymax - ymin}%`,
                          border: `2px solid ${b.color}`,
                          backgroundColor: `${b.color}20`,
                          borderRadius: "4px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        title={`${b.label} (${Math.round(b.confidence * 100)}%)`}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: "-20px",
                            left: "0",
                            backgroundColor: b.color,
                            color: "#ffffff",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: "3px",
                            whiteSpace: "nowrap",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
                          }}
                        >
                          {b.label} ({Math.round(b.confidence * 100)}%)
                        </span>
                      </div>
                    );
                  })}

                {/* 2. Bi-Temporal Change Detection Polygons */}
                {layerFilters.polygons &&
                  changePolygons.map((cp) => {
                    const [ymin, xmin, ymax, xmax] = cp.box;
                    return (
                      <div
                        key={cp.id}
                        onClick={() => setSelectedItem(cp)}
                        style={{
                          position: "absolute",
                          top: `${ymin}%`,
                          left: `${xmin}%`,
                          width: `${xmax - xmin}%`,
                          height: `${ymax - ymin}%`,
                          border: `2px dashed ${cp.color}`,
                          backgroundColor: `${cp.color}25`,
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                        title={`${cp.label} (${cp.delta_area_sqkm > 0 ? "+" : ""}${cp.delta_area_sqkm} km²)`}
                      >
                        <span
                          style={{
                            position: "absolute",
                            bottom: "-20px",
                            left: "0",
                            backgroundColor: cp.color,
                            color: "#ffffff",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: "3px",
                            whiteSpace: "nowrap",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
                          }}
                        >
                          {cp.category}: {cp.delta_area_sqkm > 0 ? `+${cp.delta_area_sqkm} km²` : `${cp.delta_area_sqkm} km²`}
                        </span>
                      </div>
                    );
                  })}

                {/* 3. Cross-Sensor Fusion Masks */}
                {layerFilters.fusion &&
                  fusionLayers.map((fl) => {
                    const [ymin, xmin, ymax, xmax] = fl.box;
                    return (
                      <div
                        key={fl.id}
                        onClick={() => setSelectedItem(fl)}
                        style={{
                          position: "absolute",
                          top: `${ymin}%`,
                          left: `${xmin}%`,
                          width: `${xmax - xmin}%`,
                          height: `${ymax - ymin}%`,
                          border: `2px solid ${fl.color}`,
                          backgroundColor: `${fl.color}30`,
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: "-20px",
                            left: "0",
                            backgroundColor: fl.color,
                            color: "#ffffff",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: "3px",
                            whiteSpace: "nowrap",
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
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>
            <Maximize2 size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <p style={{ fontSize: "0.95rem", color: "var(--text-main)", fontWeight: 600, marginBottom: "6px" }}>
              No Satellite Scene Loaded
            </p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Select a benchmark scenario from the top bar or load raster files.
            </p>
          </div>
        )}

        {/* Clean Zoom & Navigation Controls */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(17, 24, 39, 0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            padding: "3px",
            zIndex: 25,
          }}
        >
          <button
            onClick={() => handleZoomChange(-0.25)}
            className="btn-control"
            style={{ padding: "4px 6px" }}
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--text-main)", padding: "0 4px", minWidth: "36px", textAlign: "center" }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => handleZoomChange(0.25)}
            className="btn-control"
            style={{ padding: "4px 6px" }}
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          {zoomLevel !== 1 && (
            <button
              onClick={resetZoom}
              className="btn-control"
              style={{ padding: "4px 6px" }}
              title="Reset Zoom"
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>

        {/* Target Inspector Card */}
        {selectedItem && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              maxWidth: "300px",
              background: "var(--bg-card)",
              border: `1px solid ${selectedItem.color || "var(--border-subtle)"}`,
              borderRadius: "8px",
              padding: "10px 14px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              zIndex: 35,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Info size={14} color={selectedItem.color || "var(--primary)"} />
                {selectedItem.label}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  padding: "2px",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.45, marginBottom: "8px" }}>
              {selectedItem.details || selectedItem.description || selectedItem.notes || "Detected spatial feature."}
            </div>
            {selectedItem.confidence && (
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>Confidence:</span>
                <strong style={{ color: "var(--primary)" }}>{Math.round(selectedItem.confidence * 100)}%</strong>
              </div>
            )}
            {selectedItem.delta_area_sqkm && (
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>Area Change:</span>
                <strong style={{ color: selectedItem.color }}>
                  {selectedItem.delta_area_sqkm > 0 ? `+${selectedItem.delta_area_sqkm}` : selectedItem.delta_area_sqkm} km²
                </strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coordinate & Sensor Reference Footer Bar */}
      <div
        style={{
          padding: "6px 16px",
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-card)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.72rem",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span>
            CRS: <strong style={{ color: "var(--text-main)" }}>{primaryMeta?.crs || "EPSG:32643"}</strong>
          </span>
          <span>
            GSD: <strong style={{ color: "var(--primary)" }}>{primaryMeta?.gsd_meters || 10}m/px</strong>
          </span>
        </div>

        {/* Live Cursor Coordinates */}
        <div>
          {cursorGeo ? (
            <span style={{ color: "var(--text-main)", display: "flex", alignItems: "center", gap: "5px" }}>
              <Crosshair size={12} color="var(--primary)" />
              <span>
                {cursorGeo.lon.toFixed(4)}°E, {cursorGeo.lat.toFixed(4)}°N
              </span>
            </span>
          ) : (
            <span style={{ color: "var(--text-muted)" }}>Hover over image to view coordinates</span>
          )}
        </div>
      </div>
    </div>
  );
};
