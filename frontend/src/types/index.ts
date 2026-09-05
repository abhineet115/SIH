export interface RasterBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface ModalityInfo {
  modality: "OPTICAL" | "SAR" | "MULTISPECTRAL" | "UNKNOWN";
  confidence: number;
  description: string;
  sar_score: number;
  optical_score: number;
  bands_detected: number;
}

export interface RasterMetadata {
  filename: string;
  format: string;
  width: number;
  height: number;
  bands: number;
  mode: string;
  dtype: string;
  bit_depth: number;
  file_size_mb: number;
  is_geotiff: boolean;
  crs: string;
  gsd_meters: number;
  bounds: RasterBounds;
  modality_info?: ModalityInfo;
  preview_b64?: string;
}

export interface BoundingBox {
  id: string;
  label: string;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in %
  confidence: number;
  color: string;
  details?: string;
}

export interface ChangePolygon {
  id: string;
  label: string;
  category: string;
  color: string;
  box: [number, number, number, number];
  delta_area_sqkm: number;
  confidence: number;
  description: string;
}

export interface FusionLayer {
  id: string;
  label: string;
  modality_evidence: string;
  box: [number, number, number, number];
  color: string;
  confidence: number;
  notes: string;
}

export interface ConfidenceBreakdown {
  model_inference: number;
  sensor_radiometry: number;
  spatial_alignment: number;
  resolution_suitability: number;
}

export interface ConfidenceScore {
  composite_score: number;
  rating: "HIGH" | "MODERATE" | "LOW";
  badge_color: string;
  breakdown: ConfidenceBreakdown;
}

export interface ExecutionTraceStep {
  step: number;
  action: string;
  tool: string;
  status: string;
  latency_ms: number;
  details: string;
}

export interface SpatialRegistration {
  is_aligned: boolean;
  crs_match: boolean;
  crs_primary: string;
  crs_secondary: string;
  iou: number;
  iou_percentage: number;
  resolution_ratio: number;
  resolution_compatible: boolean;
  status_message: string;
}

export interface AnalysisResult {
  query: string;
  intent: "VQA" | "GROUNDING" | "CHANGE_DETECTION" | "OPTICAL_SAR_FUSION" | "CAPTION";
  specialist: string;
  answer: string;
  key_findings: string[];
  bounding_boxes: BoundingBox[];
  change_polygons: ChangePolygon[];
  fusion_layers: FusionLayer[];
  land_cover_distribution: Record<string, number>;
  built_up_change_pct?: number;
  vegetation_change_pct?: number;
  confidence: ConfidenceScore;
  primary_metadata: RasterMetadata;
  secondary_metadata?: RasterMetadata;
  registration?: SpatialRegistration;
  execution_trace: ExecutionTraceStep[];
  total_latency_ms: number;
}

export interface SampleScenario {
  id: string;
  title: string;
  description: string;
  primary_file: string;
  secondary_file: string | null;
  default_query: string;
  suggested_queries: string[];
  primary_path: string;
  primary_metadata: RasterMetadata;
  secondary_path: string | null;
  secondary_metadata: RasterMetadata | null;
}
