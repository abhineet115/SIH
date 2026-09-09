import React, { useState, useRef, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Compass,
  Move,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Info,
  Sliders,
  Check
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
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100%
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.85);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x, 1.25x, 1.5x, 2x
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Layer filter toggles
  const [layerFilters, setLayerFilters] = useState({
    boxes: true,
    polygons: true,
    fusion: true,
  });

  // Live cursor telemetry coordinates
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

  const activeBoxCount = layerFilters.boxes ? boundingBoxes.length : 0;
  const activePolyCount = layerFilters.polygons ? changePolygons.length : 0;
  const activeFusionCount = layerFilters.fusion ? fusionLayers.length : 0;
  const totalDetections = activeBoxCount + activePolyCount + activeFusionCount;

  return (
    <div
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "520px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top Tactical Command Toolbar */}
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid rgba(56, 189, 248, 0.18)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(8, 14, 28, 0.9)",
          zIndex: 40,
        }}
      >
        {/* Left: Viewport Mode & Active Target Count */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Compass size={17} color="#00f0ff" />
          <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "#f8fafc", letterSpacing: "0.02em" }}>
            {isDualMode ? "Co-Registered Tactical Comparator" : "Geospatial Viewport"}
          </span>

          {totalDetections > 0 && (
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "4px",
                background: "rgba(0, 240, 255, 0.15)",
                color: "#00f0ff",
                border: "1px solid rgba(0, 240, 255, 0.35)",
              }}
            >
              {totalDetections} Detected Spatial Targets
            </span>
          )}

          {isDualMode && (
            <span
              style={{
                fontSize: "0.68rem",
                padding: "2px 8px",
                borderRadius: "999px",
                background: "rgba(255, 122, 0, 0.15)",
                color: "#ff9a3c",
                border: "1px solid rgba(255, 122, 0, 0.35)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Wipe: {Math.round(sliderPos)}%
            </span>
          )}
        </div>

        {/* Right: Layer Filters, Opacity, & Zoom Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Layer Filter Toggles */}
          {boundingBoxes.length > 0 && (
            <button
              onClick={() => setLayerFilters((p) => ({ ...p, boxes: !p.boxes }))}
              className={`btn-hud ${layerFilters.boxes ? "active" : ""}`}
              title="Toggle Bounding Boxes"
            >
              <Check size={11} color={layerFilters.boxes ? "#00f0ff" : "#64748b"} />
              BBoxes ({boundingBoxes.length})
            </button>
          )}

          {changePolygons.length > 0 && (
            <button
              onClick={() => setLayerFilters((p) => ({ ...p, polygons: !p.polygons }))}
              className={`btn-hud ${layerFilters.polygons ? "active" : ""}`}
              title="Toggle Change Polygons"
            >
              <Check size={11} color={layerFilters.polygons ? "#00f0ff" : "#64748b"} />
              Polygons ({changePolygons.length})
            </button>
          )}

          {fusionLayers.length > 0 && (
            <button
              onClick={() => setLayerFilters((p) => ({ ...p, fusion: !p.fusion }))}
              className={`btn-hud ${layerFilters.fusion ? "active" : ""}`}
              title="Toggle Radar Fusion Masks"
            >
              <Check size={11} color={layerFilters.fusion ? "#00f0ff" : "#64748b"} />
              SAR Masks ({fusionLayers.length})
            </button>
          )}

          {/* Opacity Control Slider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 8px",
              background: "rgba(15, 23, 42, 0.6)",
              borderRadius: "6px",
              border: "1px solid rgba(56, 189, 248, 0.15)",
            }}
          >
            <Sliders size={12} color="#94a3b8" />
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
              style={{ width: "55px", accentColor: "#00f0ff", cursor: "pointer" }}
              title={`Overlay Opacity: ${Math.round(overlayOpacity * 100)}%`}
            />
          </div>

          {/* Master Overlay Toggle */}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className="btn-secondary"
            style={{ padding: "4px 10px", fontSize: "0.74rem" }}
          >
            {showOverlays ? <Eye size={13} color="#00f0ff" /> : <EyeOff size={13} color="#94a3b8" />}
            {showOverlays ? "Overlays On" : "Overlays Off"}
          </button>
        </div>
      </div>

      {/* Main Tactical Canvas */}
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
          background: "#020612",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isDualMode ? (isDragging ? "ew-resize" : "crosshair") : "crosshair",
        }}
        className={showGrid ? "gis-grid" : ""}
      >
        {primaryPreview ? (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Primary Satellite Layer */}
            <img
              src={primaryPreview}
              alt="Primary Raster"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
                pointerEvents: "none",
                userSelect: "none",
              }}
            />

            {/* Secondary Co-Registered Layer with Split-Wipe Polygon */}
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
                  alt="Secondary Raster"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            )}

            {/* Neon Split-Screen Wipe Handle */}
            {isDualMode && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${sliderPos}%`,
                  width: "2px",
                  background: "#00f0ff",
                  boxShadow: "0 0 16px #00f0ff, 0 0 30px rgba(0, 240, 255, 0.5)",
                  zIndex: 35,
                  cursor: "ew-resize",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(4, 9, 22, 0.95)",
                    border: "2px solid #00f0ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 20px rgba(0, 240, 255, 0.8)",
                    color: "#00f0ff",
                    cursor: "ew-resize",
                  }}
                >
                  <Move size={16} />
                </div>
              </div>
            )}

            {/* Spatial Evidence Layer (Bounding Boxes, Polygons, SAR Fusion) */}
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
                  zIndex: 25,
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
                          backgroundColor: `${b.color}25`,
                          borderRadius: "4px",
                          cursor: "pointer",
                          boxShadow: `0 0 14px ${b.color}77`,
                          transition: "all 0.15s ease",
                        }}
                        title={`${b.label} (${Math.round(b.confidence * 100)}%)`}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: "-22px",
                            left: "0",
                            backgroundColor: b.color,
                            color: "#040916",
                            fontSize: "0.66rem",
                            fontWeight: 800,
                            padding: "2px 7px",
                            borderRadius: "3px",
                            whiteSpace: "nowrap",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
                            letterSpacing: "0.02em",
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
                          backgroundColor: `${cp.color}28`,
                          borderRadius: "6px",
                          cursor: "pointer",
                          boxShadow: `0 0 16px ${cp.color}66`,
                        }}
                        title={`${cp.label} (${cp.delta_area_sqkm > 0 ? "+" : ""}${cp.delta_area_sqkm} km²)`}
                      >
                        <span
                          style={{
                            position: "absolute",
                            bottom: "-22px",
                            left: "0",
                            backgroundColor: cp.color,
                            color: "#ffffff",
                            fontSize: "0.66rem",
                            fontWeight: 800,
                            padding: "2px 7px",
                            borderRadius: "3px",
                            whiteSpace: "nowrap",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
                          }}
                        >
                          {cp.category}: {cp.delta_area_sqkm > 0 ? `+${cp.delta_area_sqkm} km²` : `${cp.delta_area_sqkm} km²`}
                        </span>
                      </div>
                    );
                  })}

                {/* 3. Optical + SAR Cross-Sensor Fusion Layers */}
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
                          backgroundColor: `${fl.color}35`,
                          borderRadius: "6px",
                          cursor: "pointer",
                          boxShadow: `0 0 16px ${fl.color}66`,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: "-22px",
                            left: "0",
                            backgroundColor: fl.color,
                            color: "#ffffff",
                            fontSize: "0.66rem",
                            fontWeight: 800,
                            padding: "2px 7px",
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
          <div style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>
            <div className="standby-radar" style={{ margin: "0 auto 16px" }} />
            <p style={{ fontSize: "0.95rem", color: "#e2e8f0", fontWeight: 600, marginBottom: "6px" }}>
              Tactical Sensor Viewport Inactive
            </p>
            <p style={{ fontSize: "0.78rem", color: "#64748b" }}>
              Select a benchmark scenario from the top bar or load raster bands in the Telemetry Console.
            </p>
          </div>
        )}

        {/* Floating Zoom & Grid Controls (Bottom Right of Viewport) */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(8, 14, 28, 0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            borderRadius: "8px",
            padding: "4px",
            zIndex: 30,
          }}
        >
          <button
            onClick={() => handleZoomChange(0.25)}
            className="btn-hud"
            style={{ padding: "4px 8px" }}
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "#38bdf8", padding: "0 4px" }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => handleZoomChange(-0.25)}
            className="btn-hud"
            style={{ padding: "4px 8px" }}
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`btn-hud ${showGrid ? "active" : ""}`}
            style={{ padding: "4px 8px" }}
            title="Toggle GIS Coordinate Grid"
          >
            <Crosshair size={13} />
          </button>
        </div>

        {/* Floating Target Inspector Drawer */}
        {selectedItem && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              maxWidth: "340px",
              background: "rgba(6, 12, 26, 0.95)",
              backdropFilter: "blur(18px)",
              border: `1px solid ${selectedItem.color || "#00f0ff"}`,
              borderRadius: "10px",
              padding: "12px 16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(0, 240, 255, 0.2)",
              zIndex: 40,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div style={{ fontSize: "0.86rem", fontWeight: 800, color: "#f8fafc", display: "flex", alignItems: "center", gap: "6px" }}>
                <Info size={14} color={selectedItem.color || "#00f0ff"} />
                {selectedItem.label}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "#cbd5e1",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "0.68rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#cbd5e1", lineHeight: 1.45, marginBottom: "8px" }}>
              {selectedItem.details || selectedItem.description || selectedItem.notes || "Spatial localized target bounding geometry."}
            </div>
            {selectedItem.confidence && (
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                <span>Inference Certainty:</span>
                <strong style={{ color: "#00f0ff" }}>{Math.round(selectedItem.confidence * 100)}%</strong>
              </div>
            )}
            {selectedItem.delta_area_sqkm && (
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                <span>Spatial Area Impact:</span>
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
          padding: "7px 16px",
          borderTop: "1px solid rgba(56, 189, 248, 0.15)",
          background: "rgba(6, 11, 24, 0.95)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.73rem",
          color: "#94a3b8",
          fontFamily: "var(--font-mono)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span>
            CRS: <strong style={{ color: "#e2e8f0" }}>{primaryMeta?.crs || "EPSG:32643"}</strong>
          </span>
          <span>
            Bounds:{" "}
            <strong style={{ color: "#e2e8f0" }}>
              {primaryMeta?.bounds?.west != null && primaryMeta?.bounds?.north != null
                ? `${primaryMeta.bounds.west.toFixed(2)}°E, ${primaryMeta.bounds.north.toFixed(2)}°N`
                : "77.10°E, 28.70°N"}
            </strong>
          </span>
          <span>
            GSD: <strong style={{ color: "#00f0ff" }}>{primaryMeta?.gsd_meters || 10}m/px</strong>
          </span>
        </div>

        {/* Live Cursor Telemetry Coordinates */}
        <div>
          {cursorGeo ? (
            <span style={{ color: "#00f0ff", display: "flex", alignItems: "center", gap: "6px" }}>
              <Crosshair size={12} color="#00f0ff" />
              <span>
                Cursor: {cursorGeo.lon.toFixed(4)}°E, {cursorGeo.lat.toFixed(4)}°N
              </span>
            </span>
          ) : (
            <span style={{ color: "#64748b" }}>Cursor over viewport to track Lat/Lon</span>
          )}
        </div>
      </div>
    </div>
  );
};

