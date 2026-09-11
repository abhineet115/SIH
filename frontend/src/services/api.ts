import type { AnalysisResult, SampleScenario, RasterMetadata } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export async function fetchSampleScenarios(): Promise<SampleScenario[]> {
  const resp = await fetch(`${API_BASE}/samples`);
  if (!resp.ok) {
    throw new Error(`Failed to fetch scenarios: ${resp.statusText}`);
  }
  const data = await resp.json();
  return data.scenarios;
}

export async function uploadRasterFile(file: File): Promise<{
  filename: string;
  file_path: string;
  metadata: RasterMetadata;
}> {
  const formData = new FormData();
  formData.append("file", file);

  const resp = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(err.detail || "Upload failed");
  }

  return await resp.json();
}

export async function runAgenticQuery(
  primaryPath: string,
  secondaryPath: string | null,
  query: string,
  explanationMode: string = "simple",
  geminiApiKey?: string,
  geminiModel?: string
): Promise<AnalysisResult> {
  const resp = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      primary_path: primaryPath,
      secondary_path: secondaryPath,
      query: query,
      explanation_mode: explanationMode,
      gemini_api_key: geminiApiKey,
      gemini_model: geminiModel,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(err.detail || "Query failed");
  }

  const data = await resp.json();
  return data.data;
}

export async function fetchGeminiStatus(): Promise<{
  configured: boolean;
  default_model: string;
  masked_key: string;
  features: string[];
}> {
  const resp = await fetch(`${API_BASE}/gemini/status`);
  if (!resp.ok) {
    throw new Error("Failed to fetch Gemini status");
  }
  return await resp.json();
}

export async function testGeminiConnection(
  apiKey?: string,
  modelName?: string
): Promise<{ valid: boolean; message: string; model?: string }> {
  const resp = await fetch(`${API_BASE}/gemini/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      model_name: modelName,
    }),
  });
  if (!resp.ok) {
    throw new Error("Failed to test Gemini connection");
  }
  return await resp.json();
}

export async function exportPDFReport(
  analysisData: AnalysisResult
): Promise<string> {
  const resp = await fetch(`${API_BASE}/report/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysis_data: analysisData }),
  });

  if (!resp.ok) {
    throw new Error("Failed to generate PDF report");
  }

  const data = await resp.json();
  const baseUrl = API_BASE.replace("/api", "");
  return `${baseUrl}${data.download_url}`;
}
