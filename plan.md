# SatQuery AI — Project Execution & Implementation Plan (plan.md)
**Problem Statement 26167 — Smart India Hackathon (SIH)**  
**Department:** Indian Space Research Organisation (ISRO)  
**Deliverable:** End-to-End Multimodal Vision-Language Remote Sensing Assistant

---

## 1. Project Directory Structure

```text
satquery-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI entrypoint, CORS, exception handlers
│   │   ├── config.py                   # App configuration, directories, device setup
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── upload.py               # Raster upload, metadata extraction & validation
│   │   │   ├── query.py                # Agentic analysis trigger and polling
│   │   │   ├── report.py               # PDF and JSON export generation
│   │   │   └── history.py              # Past analysis sessions and traces
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── controller.py           # Core orchestrator running the decision cycle
│   │   │   ├── classifier.py           # Query intent parser (VQA, Change, Optical-SAR, Grounding)
│   │   │   ├── planner.py              # Dynamic tool selection and dependency graph
│   │   │   └── executor.py             # Asynchronous specialist tool runner
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── registry.py             # Specialist Model Registry
│   │   │   ├── vqa_engine.py           # Single image VQA specialist
│   │   │   ├── caption_engine.py       # Land cover & scene caption generator
│   │   │   ├── grounding_engine.py     # Open-vocabulary bounding box / mask detector
│   │   │   ├── change_engine.py        # Bi-temporal change detector & delta calculator
│   │   │   └── optical_sar_engine.py   # Spectral + SAR structural backscatter fusion
│   │   ├── preprocessing/
│   │   │   ├── __init__.py
│   │   │   ├── geotiff.py              # Rasterio/GDAL GeoTIFF reader & metadata extractor
│   │   │   ├── modality.py             # Optical vs SAR heuristic & band classifier
│   │   │   ├── registration.py         # CRS validation, reprojection & spatial IoU
│   │   │   └── tiling.py               # Large raster patcher & visual normalizer
│   │   ├── fusion/
│   │   │   ├── __init__.py
│   │   │   ├── confidence.py           # Multi-signal composite confidence calculator
│   │   │   └── evidence.py             # Evidence packager (masks, bboxes, metrics)
│   │   ├── reports/
│   │   │   ├── __init__.py
│   │   │   └── pdf_generator.py        # Clean PDF generator using ReportLab
│   │   └── db/
│   │       ├── __init__.py
│   │       ├── database.py             # SQLite / PostgreSQL engine
│   │       └── models.py               # SQLAlchemy models (Analyses, Traces, Evidence)
│   ├── data/
│   │   ├── sample_images/              # Preloaded optical, SAR, T1, and T2 images
│   │   │   ├── optical_delhi_2022.tif
│   │   │   ├── optical_delhi_2024.tif
│   │   │   ├── sar_delhi_2024.tif
│   │   │   └── sample_airport.tif
│   │   └── uploads/                    # User uploaded files
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── index.css                   # Tailwind and custom GIS dark-theme tokens
│   │   ├── main.tsx                    # React DOM root
│   │   ├── App.tsx                     # Main layout & router
│   │   ├── components/
│   │   │   ├── Navbar.tsx              # ISRO header, status badge, theme toggle
│   │   │   ├── ImageUploader.tsx       # Drag-and-drop dual slot (T1/T2 or Optical/SAR)
│   │   │   ├── RasterMetadataPanel.tsx # Bands, CRS, GSD, Modality inspector
│   │   │   ├── ImageViewer.tsx         # Interactive pan/zoom viewer with mask/box overlays
│   │   │   ├── QueryBar.tsx            # Query input with quick-prompt chips
│   │   │   ├── ResultCard.tsx          # Direct answer, key findings, and summary
│   │   │   ├── ConfidenceBadge.tsx     # Color-coded composite confidence dial
│   │   │   ├── ChangeComparison.tsx    # Split-screen swipe slider for T1 vs T2
│   │   │   ├── ExecutionTraceView.tsx  # Step-by-step observable agent pipeline audit
│   │   │   └── ReportDownloadModal.tsx # Export to PDF / JSON modal
│   │   ├── services/
│   │   │   └── api.ts                  # Axios API client
│   │   └── types/
│   │       └── index.ts                # TypeScript interfaces for API contracts
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── brain.md                            # Comprehensive architecture blueprint
├── plan.md                             # Step-by-step roadmap and checklist (this file)
└── README.md                           # Quickstart guide & SIH presentation pitch
```

---

## 2. Phased Development Roadmap

### Phase 1: Foundation & Geospatial Engine
- [ ] Initialize Python FastAPI backend with standard CORS and structured logging.
- [ ] Implement `geotiff.py` with `rasterio` / `PIL` fallback for parsing GeoTIFF headers, CRS, bounds, width/height, bands, and data type.
- [ ] Implement `modality.py` to classify inputs as `OPTICAL`, `SAR`, or `MULTISPECTRAL`.
- [ ] Create synthetic GeoTIFF generator in `backend/data/sample_images/` with real geospatial metadata (EPSG:32643) for reliable local demo testing without requiring multi-gigabyte downloads.
- [ ] Set up database schemas with SQLite (or PostgreSQL) for analyses, evidence, and traces.

### Phase 2: Specialist Model Engines
- [ ] **Single-Image VQA (`vqa_engine.py`):**
  - Land cover categorization, object detection, and feature counting.
  - Return textual answer + pixel focus regions + model confidence.
- [ ] **Scene Captioning (`caption_engine.py`):**
  - Detailed structural scene description (dominant cover, density, water, roads).
- [ ] **Visual Grounding (`grounding_engine.py`):**
  - Entity extraction $\to$ Bounding boxes `[ymin, xmin, ymax, xmax]` + binary masks.
- [ ] **Bi-Temporal Change Engine (`change_engine.py`):**
  - Compute normalized difference change vector between T1 and T2.
  - Segment change mask into semantic classes: Urban Sprawl, Deforestation, Water Shift.
  - Calculate exact area change percentage (+18.7%).
- [ ] **Optical + SAR Fusion (`optical_sar_engine.py`):**
  - Optical spectral analysis (NDVI/NDWI) + SAR surface roughness and backscatter.
  - Joint decision matrix for cloud-penetrating water/urban mapping.

### Phase 3: Agentic Controller & Observable Trace
- [ ] Implement `classifier.py` to route queries into 6 distinct intents based on text and input counts.
- [ ] Implement `planner.py` to generate step execution DAG.
- [ ] Implement `executor.py` to asynchronously trigger registered specialist tools.
- [ ] Build `confidence.py` computing 4-signal harmonic confidence ($C_{\text{final}}$).
- [ ] Implement `evidence.py` to structure masks, geometries, metrics, and captions.
- [ ] Emit detailed execution trace events for every step.

### Phase 4: Modern GIS Frontend (React + TypeScript)
- [ ] Scaffold Vite React TypeScript app with dark-mode GIS aesthetic (slate-900 palette, cyan/emerald accents).
- [ ] Build **Dual-Slot Image Uploader** with instant raster metadata inspection (Bands, CRS, Resolution).
- [ ] Build **Interactive Image Viewer** supporting:
  - Single image inspection with bounding box overlays.
  - Split-slider comparison between T1 and T2.
  - Color-coded change map overlay toggle.
- [ ] Build **Query Bar** with one-click demo presets matching the 4 ISRO hackathon scenarios.
- [ ] Build **Result Panel & Confidence Dial** with high/medium/low visual indicators.
- [ ] Build **Execution Trace Timeline** displaying live animated step completion checkmarks.
- [ ] Build **Export to PDF & JSON** report generator.

### Phase 5: Demo Scenarios & Testing
- [ ] Scenario 1: Single-Image VQA (Land cover identification).
- [ ] Scenario 2: Grounding (Highlight water body / airport runway).
- [ ] Scenario 3: Bi-Temporal Change (Urban development between 2022 and 2024).
- [ ] Scenario 4: Optical + SAR Fusion (Cross-sensor built-up and water analysis).
- [ ] End-to-end integration testing and automated verification.

---

## 3. SIH Demo Scenarios Specifications

| Scenario | Input Images | Example Query | Expected Agent Action | Expected Visual Evidence |
|---|---|---|---|---|
| **Demo 1: Single VQA** | 1 Optical GeoTIFF | *"What type of land cover dominates this scene?"* | Routes to `SINGLE_VQA` $\to$ `vqa_engine` | Dominant cover label + Confidence (94%) |
| **Demo 2: Grounding** | 1 Optical GeoTIFF | *"Highlight the water bodies and reservoirs in this region."* | Routes to `GROUNDING` $\to$ `grounding_engine` | Bounding boxes & cyan mask overlays on water |
| **Demo 3: Change Analysis** | T1 (2022) + T2 (2024) | *"What changed between these two dates? Has built-up area increased?"* | Routes to `CHANGE_VQA` $\to$ `change_engine` | Split-view slider, red change mask, +18.7% delta |
| **Demo 4: Optical + SAR** | 1 Optical + 1 SAR GeoTIFF | *"Combine optical and SAR imagery to identify built-up areas despite cloud cover."* | Routes to `CROSS_MODAL_FUSION` $\to$ `optical_sar_engine` | Fused segmentation map, structural backscatter layer |

---

## 4. Verification and Validation Checklist

- [ ] Backend runs without error on `http://localhost:8000`.
- [ ] Interactive docs accessible at `http://localhost:8000/docs`.
- [ ] Frontend launches on `http://localhost:5173`.
- [ ] All 4 demo scenarios trigger correctly with 100% agent task routing accuracy.
- [ ] Synthetic sample imagery renders accurately with authentic CRS tags.
- [ ] PDF report generation produces formatted document with execution trace and metrics.
