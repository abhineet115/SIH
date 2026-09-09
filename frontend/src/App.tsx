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

    // Auto-run scenario default query for instantaneous WOW experience
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
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="bg-grid-moving" />
      {/* Header */}
      <Navbar
        scenarios={scenarios}
        currentScenario={currentScenario}
        onSelectScenario={selectScenario}
        onExportReport={() => setIsReportModalOpen(true)}
        hasResult={Boolean(result)}
        backendOnline={backendOnline}
      />

      {/* Main Workstation Layout */}
      <main style={{
        flex: 1,
        padding: '12px 16px',
        display: 'grid',
        gridTemplateColumns: '350px 1fr 400px',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Left Column: Data/Input Viewer */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflow: 'hidden' }}>
          <div className="sci-fi-frame" style={{ flexShrink: 0 }}>
            <ImageUploader
              primaryMeta={primaryMeta}
              secondaryMeta={secondaryMeta}
              onPrimaryUploaded={handlePrimaryUploaded}
              onSecondaryUploaded={handleSecondaryUploaded}
              onClearSecondary={handleClearSecondary}
            />
          </div>
        </section>

        {/* Center Column: Interactive Geospatial Viewport */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflow: 'hidden' }}>
          <div className="sci-fi-frame" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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

        {/* Right Column: SatQuery Agent & Results */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflowY: 'auto', paddingRight: '4px' }} className="custom-scroll">
          <div className="glass-panel sci-fi-frame" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: 'var(--primary-glow)', letterSpacing: '2px', fontSize: '1.2rem', textTransform: 'uppercase', textShadow: '0 0 10px rgba(56,189,248,0.5)', margin: 0 }}>
              SatQuery Agent
            </h3>
            
            <QueryBar
              onRunQuery={(q) => handleRunQuery(q)}
              isLoading={isLoading}
              suggestedQueries={currentScenario?.suggested_queries || []}
            />
          </div>

          {result ? (
            <>
              {/* Executive Assessment & Key Metrics */}
              <div className="animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards', flexShrink: 0 }}>
                <ResultCard result={result} />
              </div>

              {/* 4-Signal Harmonic Confidence Matrix */}
              <div className="animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards', flexShrink: 0 }}>
                <ConfidenceBadge confidence={result?.confidence || null} />
              </div>

              {/* Observable Execution Trace Timeline */}
              <div className="animate-slide-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards', flexShrink: 0 }}>
                <ExecutionTraceView
                  trace={result?.execution_trace || []}
                  totalLatencyMs={result?.total_latency_ms || 0}
                />
              </div>
            </>
          ) : (
             <div className="glass-panel animate-float" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', border: '1px dashed rgba(56, 189, 248, 0.3)' }}>
               <h4 style={{ color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Ready for Analysis</h4>
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
