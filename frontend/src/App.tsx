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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
        gap: '16px',
        alignItems: 'start'
      }}>
        {/* Left Column: Visual GIS Viewport & Prompt Controls */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Dual Slot Uploader & Metadata Chips */}
          <ImageUploader
            primaryMeta={primaryMeta}
            secondaryMeta={secondaryMeta}
            onPrimaryUploaded={handlePrimaryUploaded}
            onSecondaryUploaded={handleSecondaryUploaded}
            onClearSecondary={handleClearSecondary}
          />

          {/* Interactive GIS Viewer with Split Wipe & Vector Overlays */}
          <ImageViewer
            primaryPreview={primaryPreview}
            secondaryPreview={secondaryPreview}
            primaryMeta={primaryMeta}
            secondaryMeta={secondaryMeta}
            boundingBoxes={result?.bounding_boxes || []}
            changePolygons={result?.change_polygons || []}
            fusionLayers={result?.fusion_layers || []}
          />

          {/* Agentic Prompt Input with Scenario Preset Chips */}
          <QueryBar
            onRunQuery={(q) => handleRunQuery(q)}
            isLoading={isLoading}
            suggestedQueries={currentScenario?.suggested_queries || []}
          />
        </section>

        {/* Right Column: Agentic Intelligence, Confidence & Pipeline Audit */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Executive Assessment & Key Metrics */}
          <ResultCard result={result} />

          {/* 4-Signal Harmonic Confidence Matrix */}
          <ConfidenceBadge confidence={result?.confidence || null} />

          {/* Observable Execution Trace Timeline */}
          <ExecutionTraceView
            trace={result?.execution_trace || []}
            totalLatencyMs={result?.total_latency_ms || 0}
          />
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
