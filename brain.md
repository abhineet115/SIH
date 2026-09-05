# SatQuery AI — System Brain & Architecture Blueprint (brain.md)
**Problem Statement 26167 — Smart India Hackathon (SIH)**  
**Organization:** Indian Space Research Organisation (ISRO)  
**Title:** SatQuery AI — Multimodal Remote Sensing Interactive Vision-Language Assistant

---

## 1. System Philosophy & Agentic Vision

SatQuery AI is an **autonomous, explainable, agentic remote sensing intelligence system**. Unlike naive Vision-Language chatbots that pass raw images to a generic LLM, SatQuery AI implements a **geospatial multi-agent architecture**:

1. **Zero Model Selection Burden:** The user provides natural language queries and satellite imagery (single, bi-temporal, or multi-modal Optical + SAR). The Agentic Controller automatically infers intent, validates spatial/spectral compatibility, selects specialist algorithms/models, and fuses the results.
2. **True Geospatial Awareness:** Native handling of GeoTIFFs, Coordinate Reference Systems (CRS), spatial resolution, multi-band multispectral data, and SAR polarizations (VV, VH, HH, HV).
3. **Dual Evidence Grounding:** Every textual answer is backed by tangible spatial/visual evidence (change masks, bounding boxes, polygon coordinates, radiometric statistics) and a composite confidence score.
4. **Observable Execution Trace:** Step-by-step transparency of agent reasoning, tool invocations, and parameter passing for mission-critical auditing.

---

## 2. Global System Architecture

```text
                                 ┌─────────────────────────┐
                                 │   User Query + Image    │
                                 │    (Optical / SAR)      │
                                 └────────────┬────────────┘
                                              │
                                              ▼
                                 ┌─────────────────────────┐
                                 │   FASTAPI API GATEWAY   │
                                 └────────────┬────────────┘
                                              │
                                              ▼
                                 ┌─────────────────────────┐
                                 │   INPUT VALIDATION &    │
                                 │   METADATA PARSER       │
                                 │  (GeoTIFF, CRS, Modality)│
                                 └────────────┬────────────┘
                                              │
                                              ▼
                                 ┌─────────────────────────┐
                                 │   AGENTIC CONTROLLER    │
                                 │ ┌─────────────────────┐ │
                                 │ │ Intent Classifier   │ │
                                 │ ├─────────────────────┤ │
                                 │ │ Planner & Router    │ │
                                 │ └─────────────────────┘ │
                                 └────────────┬────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
        ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
        │   SINGLE-IMAGE AGENT  │ │   BI-TEMPORAL AGENT   │ │   OPTICAL-SAR AGENT   │
        │ ┌───────────────────┐ │ │ ┌───────────────────┐ │ │ ┌───────────────────┐ │
        │ │ VQA Model         │ │ │ │ Change Detection  │ │ │ │ Spectral Feature  │ │
        │ │ Captioning Model  │ │ │ │ Change VQA        │ │ │ │ Backscatter Feat. │ │
        │ │ Grounding (Boxes) │ │ │ │ Delta Metrics     │ │ │ │ Joint Fusion      │ │
        │ └───────────────────┘ │ │ └───────────────────┘ │ │ └───────────────────┘ │
        └───────────┬───────────┘ └───────────┬───────────┘ └───────────┬───────────┘
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              │
                                              ▼
                                 ┌─────────────────────────┐
                                 │  EVIDENCE FUSION LAYER  │
                                 │  - Composite Confidence │
                                 │  - Spatial Vector Overlays
                                 │  - Metric Aggregation   │
                                 └────────────┬────────────┘
                                              │
                                              ▼
                                 ┌─────────────────────────┐
                                 │  FINAL RESPONSE ENGINE  │
                                 │  - Synthesized Answer   │
                                 │  - Visual Evidence Overlays
                                 │  - Observable Trace Log │
                                 │  - Exportable Reports   │
                                 └─────────────────────────┘
```

---

## 3. Metadata Extraction & Modality Detection Engine

Satellite imagery comes in diverse formats and sensor types. The `ImageProcessor` classifies and parses images before downstream tasks:

### 3.1 Metadata Extraction Pipeline
- **Driver / Format Detection:** GeoTIFF, TIFF, NITF, PNG, JPEG.
- **Georeferencing:** CRS (EPSG projection code), Geotransform matrix, Bounding box coordinates in geographic (`WGS84`) and projected units.
- **Raster Dimensions:** Width, Height, Band Count, Data Type (`uint8`, `uint16`, `float32`), NoData value.
- **Spatial Resolution:** Ground Sample Distance (GSD) in meters/pixel derived from pixel size in geotransform.

### 3.2 Modality Classification Logic
Modality is resolved into `OPTICAL`, `SAR`, or `UNKNOWN` using a multi-criteria scoring function:

$$\text{Score}(\text{Modality}) = w_1 S_{\text{bands}} + w_2 S_{\text{meta}} + w_3 S_{\text{stats}} + w_4 S_{\text{fname}}$$

- **Optical Signatures:**
  - Band count $\ge 3$ (RGB or RGB + NIR/RedEdge/SWIR).
  - Band descriptions matching `Red`, `Green`, `Blue`, `NIR`, `B02`, `B03`, `B04`, `B08`.
  - Radiometric histograms showing continuous, multi-modal reflectance in 3+ channels.
- **SAR Signatures:**
  - Band count $\in \{1, 2, 4\}$ with polarization tags: `VV`, `VH`, `HH`, `HV`.
  - Extreme dynamic range with speckle noise characteristics (Rayleigh / Gamma distribution).
  - Sensor tags: `Sentinel-1`, `RISAT-1`, `TerraSAR-X`, `ALOS-PALSAR`.

### 3.3 Spatial Registration Validation
When paired inputs (T1 vs T2 or Optical + SAR) are provided:
1. **CRS Concordance:** If CRSs differ, project candidate image to target CRS using `rasterio.warp.reproject`.
2. **Intersection / Overlap:** Calculate Intersection over Union (IoU) of spatial bounds. Minimum required overlap: $\ge 80\%$.
3. **Resampling:** Nearest neighbor or Bilinear grid resampling to unify spatial resolution for pixel-level differencing.

---

## 4. The Agentic Controller & Tool Registry

The Agentic Controller manages decision-making without brittle hardcoded heuristics.

### 4.1 Intent Taxonomy
Queries are categorized into one of 6 primary operational modes:
1. `SINGLE_VQA`: Descriptive/factual question regarding features in a single satellite image.
2. `CAPTIONING`: Request for comprehensive scene description or land-cover summarization.
3. `GROUNDING`: Spatial localization request (e.g., "detect runways", "highlight water bodies", "draw bounding boxes around storage tanks").
4. `BI_TEMPORAL_CHANGE`: Detection of visual/structural changes between T1 and T2 dates.
5. `CHANGE_VQA`: Quantitative or qualitative question based on change dynamics (e.g., "did urban sprawl expand to the north?").
6. `CROSS_MODAL_FUSION`: Synergy analysis combining Optical (spectral reflectance) and SAR (dielectric/structural backscatter).

### 4.2 Query Router & Intent Classifier
- Supports both **zero-shot LLM-based structured prompting** (via structured JSON output) and a **fast local embedding / semantic regex fallback** for offline evaluation.
- Outputs structured intent:
  ```json
  {
    "task": "CHANGE_VQA",
    "required_inputs": ["optical_t1", "optical_t2"],
    "target_features": ["built-up", "urban"],
    "expected_output_type": ["boolean", "percentage", "change_map"]
  }
  ```

### 4.3 Tool Registry Schema
Each tool is registered with strict signature constraints:
```python
TOOL_REGISTRY = {
    "vqa_tool": {
        "inputs": ["image:Raster", "question:str"],
        "outputs": ["answer:str", "confidence:float", "focus_regions:list"]
    },
    "caption_tool": {
        "inputs": ["image:Raster"],
        "outputs": ["summary:str", "land_cover_breakdown:dict"]
    },
    "grounding_tool": {
        "inputs": ["image:Raster", "target_class:str"],
        "outputs": ["boxes:list[float]", "masks:ndarray", "labels:list[str]"]
    },
    "change_detection_tool": {
        "inputs": ["image_t1:Raster", "image_t2:Raster"],
        "outputs": ["change_mask:ndarray", "delta_percent:float", "transitions:dict"]
    },
    "optical_sar_fusion_tool": {
        "inputs": ["optical:Raster", "sar:Raster"],
        "outputs": ["fused_land_cover:ndarray", "structural_enhancements:dict"]
    }
}
```

---

## 5. Specialist Vision & Remote Sensing Engines

### 5.1 Single-Image VQA & Captioning
- **Preprocessing:** Tiling 512×512 patches with 10% stride overlap for high-resolution imagery; percentile radiometric stretch (2% to 98%).
- **Vision-Language Model:** Domain-adapted VLM (fine-tuned on BigEarthNet / RSVQA / VRSBench) generating targeted geospatial answers and descriptive scene summaries.

### 5.2 Visual Grounding
- Open-vocabulary bounding-box and mask generator.
- Extracts spatial geometries for target entities (water bodies, industrial structures, aircraft, forest tracts).
- Returns GeoJSON coordinates and pixel-relative bounding boxes `[ymin, xmin, ymax, xmax]`.

### 5.3 Bi-Temporal Change Detection Engine
- **Differencing:** Spectral change vector analysis (CVA) + deep feature difference across registered T1/T2 pairs.
- **Thresholding & Morphological Cleaning:** Otsu dynamic thresholding + opening/closing filters to suppress shadow/cloud registration noise.
- **Transition Categorization:**
  - Natural $\to$ Built-up (Urban Expansion / Construction)
  - Vegetation $\to$ Soil / Clearing (Deforestation)
  - Water $\to$ Dry Land (Reservoir Depletion)
  - Land $\to$ Water (Flooding)
- Quantitative statistics calculation: area in hectares, change percentage, change centroid.

### 5.4 Multimodal Optical + SAR Fusion Engine
- **Optical Branch:** Computes spectral vegetation indices (NDVI), water indices (NDWI), and false-color composites.
- **SAR Branch:** Computes backscatter intensity $\sigma^0$ (dB), cross-ratio ($VH / VV$), and speckle filtering (Lee filter).
- **Decision Fusion:**
  - Water detection: Low SAR backscatter (specular reflection) + High NDWI in Optical $\to$ 99% Water Certainty.
  - Built-up detection: High SAR double-bounce backscatter + High Urban Index (NDBI) in Optical $\to$ Cloud-proof Urban Delineation.

---

## 6. Composite Confidence & Evidence Grounding Mathematics

SatQuery AI does not output hallucinated confidence scores. Final confidence is computed as a weighted harmonic mean of four measurable signals:

$$C_{\text{final}} = \frac{4}{\frac{1}{C_{\text{model}}} + \frac{1}{C_{\text{quality}}} + \frac{1}{C_{\text{agreement}}} + \frac{1}{C_{\text{evidence}}}}$$

1. **$C_{\text{model}}$ (Model Confidence):** Softmax / logit confidence of the specialist model inference.
2. **$C_{\text{quality}}$ (Raster Data Quality):** Penalized by cloud coverage, NoData pixel ratio, or low radiometric dynamic range:
   $$C_{\text{quality}} = 1.0 - (\text{CloudRatio} \times 0.5 + \text{NoDataRatio} \times 0.5)$$
3. **$C_{\text{agreement}}$ (Cross-Method Concordance):** Agreement between rule-based spectral indices (e.g. NDVI/NDWI) and deep model outputs.
4. **$C_{\text{evidence}}$ (Evidence Coverage Ratio):** Ratio of spatial support pixels validating the textual conclusion.

Categorization:
- **$\ge 90\%$**: High Confidence (Green)
- **$70\% - 89\%$**: Moderate Confidence (Amber)
- **$< 70\%$**: Low Confidence / Spatial Ambiguity (Red)

---

## 7. Observable Execution Trace Specification

Every query produces an auditable trace JSON returned to the client and rendered in the Execution Trace UI:
```json
{
  "trace_id": "tr_781203",
  "timestamp": "2026-09-04T00:10:00Z",
  "steps": [
    {
      "step_index": 1,
      "name": "Input Ingestion & Validation",
      "status": "SUCCESS",
      "details": "Validated 2 GeoTIFFs. CRS: EPSG:32643 (UTM 43N). Overlap: 99.4%."
    },
    {
      "step_index": 2,
      "name": "Query Classification",
      "status": "SUCCESS",
      "details": "Classified intent as CHANGE_VQA with target entity 'built-up'."
    },
    {
      "step_index": 3,
      "name": "Specialist Tool Execution",
      "status": "SUCCESS",
      "details": "Invoked ChangeDetectionEngine (CVA + Urban Extractor). Delta: +18.7%."
    },
    {
      "step_index": 4,
      "name": "Evidence Fusion",
      "status": "SUCCESS",
      "details": "Generated 4 changed polygon clusters. Composite confidence: 93%."
    }
  ]
}
```

---

## 8. Database Architecture

PostgreSQL with PostGIS extension for storing historical runs, geometries, and audit trails.

```sql
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    query TEXT NOT NULL,
    task_intent VARCHAR(50) NOT NULL,
    final_answer TEXT NOT NULL,
    confidence_score FLOAT NOT NULL,
    execution_time_ms INT NOT NULL
);

CREATE TABLE analysis_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    modality VARCHAR(20) NOT NULL,
    crs VARCHAR(50),
    resolution_meters FLOAT,
    width INT,
    height INT,
    bands INT
);

CREATE TABLE analysis_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL,
    geojson_geometry JSONB,
    metrics JSONB,
    visual_overlay_path TEXT
);

CREATE TABLE execution_traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    log_detail TEXT
);
```

---

## 9. API Specification

- `POST /api/upload`: Upload raster/images, extract GeoTIFF metadata, auto-detect modality.
- `POST /api/analyze`: Trigger end-to-end agentic query resolution with execution trace.
- `GET /api/analyses`: Retrieve analysis history.
- `GET /api/analyses/{id}`: Detailed record with trace and evidence.
- `GET /api/report/{id}/pdf`: Download formal inspection PDF report.
- `GET /api/report/{id}/json`: Download machine-readable GeoJSON report.
