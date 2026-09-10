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
import { ChevronDown, ChevronRight, SlidersHorizontal, MessageSquare } from "lucide-react";

export function App() {
  const { addToast } = useToast();
  const [scenarios, setScenarios] = useState<SampleScenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<SampleScenario | null>(null);

  // Theme state: default to dark or saved preference
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("satquery_theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("satquery_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

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
      addToast("Please select a scenario or upload a satellite image.", "info");
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
    addToast(`Loaded ${meta.filename}`, "success");
  };

  const handleSecondaryUploaded = (meta: RasterMetadata, path: string) => {
    setSecondaryMeta(meta);
    setSecondaryPath(path);
    setSecondaryPreview(meta.preview_b64 || null);
    addToast(`Loaded secondary ${meta.filename}`, "success");
  };

  const handleClearSecondary = () => {
    setSecondaryMeta(null);
    setSecondaryPath(null);
    setSecondaryPreview(null);
  };

  return (
    <div style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--bg-main)" }}>
      {/* Clean Header with Scenario Switcher and Theme Toggle */}
      <Navbar
        scenarios={scenarios}
        currentScenario={currentScenario}
        onSelectScenario={selectScenario}
        onExportReport={() => setIsReportModalOpen(true)}
        hasResult={Boolean(result)}
        backendOnline={backendOnline}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main 2-Pane Workstation */}
      <main
        style={{
          flex: 1,
          padding: "12px 20px 16px",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: "16px",
          overflow: "hidden",
        }}
      >
        {/* Left Pane: Image Viewer & Ingestion */}
        <section style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%", overflow: "hidden" }}>
          {/* Main Viewport */}
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
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

          {/* Compact Ingestion Card */}
          <div style={{ flexShrink: 0 }}>
            <ImageUploader
              primaryMeta={primaryMeta}
              secondaryMeta={secondaryMeta}
              onPrimaryUploaded={handlePrimaryUploaded}
              onSecondaryUploaded={handleSecondaryUploaded}
              onClearSecondary={handleClearSecondary}
            />
          </div>
        </section>

        {/* Right Pane: Query Input & Results */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            height: "100%",
            overflowY: "auto",
            paddingRight: "2px",
          }}
          className="custom-scroll"
        >
          {/* Query Bar */}
          <div style={{ flexShrink: 0 }}>
            <QueryBar
              onRunQuery={(q) => handleRunQuery(q)}
              isLoading={isLoading}
              suggestedQueries={currentScenario?.suggested_queries || []}
            />
          </div>

          {/* Results Area */}
          {result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Executive Assessment */}
              <ResultCard result={result} />

              {/* Collapsible Technical Details (Confidence & DAG Trace) */}
              <div
                style={{
                  background: "var(--bg-card)",
                  borderRadius: "12px",
                  border: "1px solid var(--border-subtle)",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <SlidersHorizontal size={14} color="var(--primary)" />
                    <span>Technical Verification & Execution Trace</span>
                  </div>
                  {showTechnicalDetails ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>

                {showTechnicalDetails && (
                  <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <ConfidenceBadge confidence={result?.confidence || null} />
                    <ExecutionTraceView
                      trace={result?.execution_trace || []}
                      totalLatencyMs={result?.total_latency_ms || 0}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "220px",
                borderRadius: "12px",
                border: "1px dashed var(--border-subtle)",
                background: "var(--bg-card)",
                padding: "24px",
                textAlign: "center",
                gap: "8px",
              }}
            >
              <MessageSquare size={26} color="var(--text-muted)" style={{ opacity: 0.6 }} />
              <p style={{ margin: 0, fontSize: "0.86rem", fontWeight: 600, color: "var(--text-main)" }}>
                Ready to Analyze
              </p>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Type a question above or choose a suggestion to get started.
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
