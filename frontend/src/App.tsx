import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { ImageUploader } from "./components/ImageUploader";
import { ImageViewer } from "./components/ImageViewer";
import { QueryBar } from "./components/QueryBar";
import { ResultCard } from "./components/ResultCard";
import { ConfidenceBadge } from "./components/ConfidenceBadge";
import { ExecutionTraceView } from "./components/ExecutionTraceView";
import { ReportModal } from "./components/ReportModal";
import { useToast } from "./components/Toast";
import type { SampleScenario, RasterMetadata, AnalysisResult } from "./types";
import { fetchSampleScenarios, runAgenticQuery } from "./services/api";
import { Compass, Sparkles } from "lucide-react";

export function App() {
  const { addToast } = useToast();
  const [scenarios, setScenarios] = useState<SampleScenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<SampleScenario | null>(null);

  // Raster state
  const [primaryMeta, setPrimaryMeta] = useState<RasterMetadata | null>(null);
  const [primaryPath, setPrimaryPath] = useState<string | null>(null);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);

  const [secondaryMeta, setSecondaryMeta] = useState<RasterMetadata | null>(null);
  const [secondaryPath, setSecondaryPath] = useState<string | null>(null);
  const [secondaryPreview, setSecondaryPreview] = useState<string | null>(null);

  // Analysis result state
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Load sample scenarios on initial mount
  useEffect(() => {
    async function loadScenarios() {
      try {
        const list = await fetchSampleScenarios();
        setScenarios(list);
        setBackendOnline(true);
        if (list.length > 0) {
          selectScenario(list[0]);
        }
      } catch (err) {
        console.warn("Backend offline or still starting...", err);
        setBackendOnline(false);
      }
    }
    loadScenarios();
  }, []);

  const selectScenario = (sc: SampleScenario) => {
    setCurrentScenario(sc);
    setPrimaryMeta(sc.primary_metadata);
    setPrimaryPath(sc.primary_path);
    setPrimaryPreview(sc.primary_metadata.preview_b64 || null);

    if (sc.secondary_metadata && sc.secondary_path) {
      setSecondaryMeta(sc.secondary_metadata);
      setSecondaryPath(sc.secondary_path);
      setSecondaryPreview(sc.secondary_metadata.preview_b64 || null);
    } else {
      setSecondaryMeta(null);
      setSecondaryPath(null);
      setSecondaryPreview(null);
    }

    // Auto-run scenario default query
    handleRunQuery(sc.default_query, sc.primary_path, sc.secondary_path);
  };

  const handleRunQuery = async (queryText: string, pPath?: string | null, sPath?: string | null) => {
    const activeP = pPath !== undefined ? pPath : primaryPath;
    const activeS = sPath !== undefined ? sPath : secondaryPath;

    if (!activeP) {
      addToast("Please upload or select a primary satellite image first.", "info");
      return;
    }

    try {
      setIsLoading(true);
      const res = await runAgenticQuery(activeP, activeS, queryText);
      setResult(res);
      setBackendOnline(true);
    } catch (err: any) {
      console.error("Query execution error:", err);
      addToast(`Query failed: ${err.message}`, "error", 6000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrimaryUploaded = (meta: RasterMetadata, path: string) => {
    setPrimaryMeta(meta);
    setPrimaryPath(path);
    setPrimaryPreview(meta.preview_b64 || null);
    addToast(`✓ ${meta.filename} loaded — ${meta.bands} bands, ${meta.width}×${meta.height} @ ${meta.gsd_meters}m GSD`, "success");
  };

  const handleSecondaryUploaded = (meta: RasterMetadata, path: string) => {
    setSecondaryMeta(meta);
    setSecondaryPath(path);
    setSecondaryPreview(meta.preview_b64 || null);
    addToast(`✓ Secondary raster loaded — ${meta.filename}`, "success");
  };

  const handleClearSecondary = () => {
    setSecondaryMeta(null);
    setSecondaryPath(null);
    setSecondaryPreview(null);
  };

  return (
    <div style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="bg-grid-moving" />
      
      {/* ISRO Command Header */}
      <Navbar
        scenarios={scenarios}
        currentScenario={currentScenario}
        onSelectScenario={selectScenario}
        onExportReport={() => setIsReportModalOpen(true)}
        hasResult={Boolean(result)}
        backendOnline={backendOnline}
      />

      {/* Main Tactical Workstation Layout */}
      <main
        style={{
          flex: 1,
          padding: "10px 16px 14px",
          display: "grid",
          gridTemplateColumns: "330px 1fr 420px",
          gap: "14px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Left Column: Satellite Telemetry & Ingestion Console */}
        <section style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%", overflowY: "auto" }} className="custom-scroll">
          <div className="sci-fi-frame" style={{ flexShrink: 0 }}>
            <ImageUploader
              primaryMeta={primaryMeta}
              secondaryMeta={secondaryMeta}
              onPrimaryUploaded={handlePrimaryUploaded}
              onSecondaryUploaded={handleSecondaryUploaded}
              onClearSecondary={handleClearSecondary}
            />
          </div>

          {/* Quick Scenario Benchmark Selector Cards */}
          {scenarios.length > 0 && (
            <div className="glass-panel" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <Sparkles size={14} color="#f59e0b" />
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#f8fafc", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  ISRO Mission Benchmarks
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {scenarios.map((sc) => {
                  const isSelected = currentScenario?.id === sc.id;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => selectScenario(sc)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        background: isSelected ? "rgba(0, 240, 255, 0.12)" : "rgba(15, 23, 42, 0.6)",
                        border: isSelected ? "1px solid #00f0ff" : "1px solid rgba(56, 189, 248, 0.12)",
                        cursor: "pointer",
                        transition: "all 0.18s ease",
                      }}
                    >
                      <div style={{ fontSize: "0.76rem", fontWeight: 700, color: isSelected ? "#00f0ff" : "#f1f5f9" }}>
                        {sc.title}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px", lineHeight: 1.3 }}>
                        {sc.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Center Column: Interactive Tactical Geospatial Viewport */}
        <section style={{ display: "flex", flexDirection: "column", gap: "10px", height: "100%", overflow: "hidden" }}>
          <div className="sci-fi-frame" style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <ImageViewer
              primaryPreview={primaryPreview}
              secondaryPreview={secondaryPreview}
              primaryMeta={primaryMeta}
              secondaryMeta={secondaryMeta}
              boundingBoxes={result?.bounding_boxes || []}
              changePolygons={result?.change_polygons || []}
              fusionLayers={result?.fusion_layers || []}
            />
          </div>
        </section>

        {/* Right Column: SatQuery Neural Agent & Intelligence Output */}
        <section style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%", overflowY: "auto", paddingRight: "2px" }} className="custom-scroll">
          {/* Query Bar */}
          <div className="sci-fi-frame" style={{ flexShrink: 0 }}>
            <QueryBar
              onRunQuery={(q) => handleRunQuery(q)}
              isLoading={isLoading}
              suggestedQueries={currentScenario?.suggested_queries || []}
            />
          </div>

          {result ? (
            <>
              {/* Executive Assessment & Metrics */}
              <div className="animate-slide-up" style={{ animationDelay: "0.05s", opacity: 0, animationFillMode: "forwards", flexShrink: 0 }}>
                <ResultCard result={result} />
              </div>

              {/* 4-Signal Harmonic Confidence Matrix */}
              <div className="animate-slide-up" style={{ animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards", flexShrink: 0 }}>
                <ConfidenceBadge confidence={result?.confidence || null} />
              </div>

              {/* Observable Pipeline Trace DAG */}
              <div className="animate-slide-up" style={{ animationDelay: "0.25s", opacity: 0, animationFillMode: "forwards", flexShrink: 0 }}>
                <ExecutionTraceView
                  trace={result?.execution_trace || []}
                  totalLatencyMs={result?.total_latency_ms || 0}
                />
              </div>
            </>
          ) : (
            <div
              className="glass-panel animate-float"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "200px",
                border: "1px dashed rgba(0, 240, 255, 0.3)",
                gap: "8px",
              }}
            >
              <Compass size={28} color="#00f0ff" style={{ opacity: 0.6 }} />
              <h4 style={{ color: "var(--text-dim)", letterSpacing: "1.5px", textTransform: "uppercase", margin: 0, fontSize: "0.85rem" }}>
                Ready for Analysis
              </h4>
              <p style={{ fontSize: "0.72rem", color: "#475569", margin: 0 }}>
                Dispatch a query to activate specialist models
              </p>
            </div>
          )}
        </section>
      </main>

      {/* PDF / JSON Intelligence Export Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        result={result}
      />
    </div>
  );
}

export default App;

