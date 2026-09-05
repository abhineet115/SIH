# SatQuery AI — Full Detailed Implementation Plan

## SIH Problem Statement 26167

**Title:** SatQuery AI - An Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis through Text Queries

**Organization:** Indian Space Research Organisation (ISRO)

**Department:** Department of Space / Indian Space Research Organisation

**Category:** Software

**Theme:** Space Technology

---

# 1. Final System Vision

SatQuery AI should be a real agentic remote-sensing system rather than a simple VQA chatbot.

The user should be able to upload one or more supported satellite images, enter a natural-language query, and allow the system to automatically determine the required remote-sensing workflow.

```text
                 ┌──────────────────────────┐
                 │       SatQuery AI         │
                 │   Natural Language Query  │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │    AGENTIC CONTROLLER    │
                 │ Query + Image Analysis   │
                 └────────────┬─────────────┘
                              │
                ┌─────────────┼──────────────┐
                │             │              │
                ▼             ▼              ▼
          Single Image   Bi-temporal     Optical + SAR
             Agent          Agent            Agent
                │             │              │
        ┌───────┼──────┐      │        ┌─────┴─────┐
        ▼       ▼      ▼      ▼        ▼           ▼
       VQA   Caption  Ground  Change   Optical     SAR
                              VQA      Analysis   Analysis
                │             │              │
                └─────────────┼──────────────┘
                              ▼
                  ┌────────────────────────┐
                  │ Evidence Fusion Layer  │
                  │ Answer + Confidence    │
                  │ Bounding boxes / maps  │
                  └────────────┬───────────┘
                               ▼
                  ┌────────────────────────┐
                  │   Interactive Result   │
                  │ Answer + Visual Proof  │
                  │ Execution Trace        │
                  └────────────────────────┘
```

The key differentiator is:

> **The user does not have to choose the model. SatQuery AI automatically chooses the appropriate remote-sensing specialist workflow.**

---

# 2. Mandatory Capabilities

| Capability | Priority | Required |
|---|---:|---:|
| Single-image VQA | Critical | Yes |
| Captioning / Grounding | Critical | Yes |
| Bi-temporal change analysis | Critical | Yes |
| Optical + SAR analysis | Critical | Yes |
| Agentic orchestration | Critical | Yes |
| Remote-sensing adaptation | Critical | Yes |
| Downloadable report | Important | Yes |
| Confidence / evidence | Important | Yes |
| Professional UI | Important | Yes |

The system must demonstrate:

1. Single-image VQA.
2. At least one additional single-image capability: captioning/scene description or grounding.
3. Multitemporal change understanding.
4. Optical–SAR paired-image analysis.
5. Agentic model/tool selection and execution.
6. Remote-sensing adaptation/fine-tuning.
7. Evidence-grounded responses.
8. Confidence information.
9. Auditable execution summaries.

---

# 3. Recommended Technology Stack

## Frontend

```text
React
TypeScript
Tailwind CSS
Leaflet / OpenLayers
Plotly
```

## Backend

```text
Python
FastAPI
PyTorch
Transformers
OpenCV
Rasterio
GDAL
GeoPandas
NumPy
Pillow
scikit-learn
```

## Infrastructure

```text
PostgreSQL
Redis
Docker
Git/GitHub
```

For the first prototype, keep the architecture simple:

```text
React
   ↓
FastAPI
   ↓
Agent Controller
   ↓
Specialist Models
```

---

# 4. Frontend UI

The interface should look like a professional GIS/AI dashboard instead of a normal chatbot.

```text
┌─────────────────────────────────────────────────────────────┐
│ 🛰 SATQUERY AI                           ISRO • SPACE AI    │
├──────────────┬──────────────────────────┬───────────────────┤
│              │                          │                   │
│ IMAGE INPUT  │       IMAGE VIEWER      │    AI ANSWER      │
│              │                          │                   │
│ Optical      │     Satellite Image     │ "Built-up area    │
│ SAR          │                          │ increased..."     │
│ Before       │     Bounding Boxes      │                   │
│ After        │     Change Map          │ Confidence: 94%   │
│              │                          │                   │
├──────────────┴──────────────────────────┴───────────────────┤
│ EXECUTION TRACE                                             │
│ ✓ Query classified: Change Analysis                        │
│ ✓ Metadata validated                                        │
│ ✓ Change model executed                                     │
│ ✓ Evidence generated                                        │
└─────────────────────────────────────────────────────────────┘
```

Main UI components:

- Image uploader.
- Image metadata panel.
- Satellite image viewer.
- Query box.
- Task/status indicator.
- AI answer panel.
- Confidence card.
- Before/after comparison.
- Change map.
- Bounding-box/grounding overlay.
- Execution trace.
- Download report button.
- Analysis history.

---

# 5. Backend Architecture

```text
FastAPI
   │
   ├── Query Router
   ├── Agent Controller
   ├── Image Processor
   ├── Model Registry
   ├── VQA Service
   ├── Captioning Service
   ├── Grounding Service
   ├── Change Detection Service
   ├── Optical-SAR Fusion Service
   ├── Evidence Service
   └── Report Generator
```

The backend should expose a clean API while keeping model implementations behind service interfaces.

---

# 6. Recommended Project Structure

```text
satquery-ai/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── ImageViewer.tsx
│   │   │   ├── QueryBox.tsx
│   │   │   ├── ResultPanel.tsx
│   │   │   ├── ConfidenceCard.tsx
│   │   │   ├── ExecutionTrace.tsx
│   │   │   └── ChangeMap.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   └── History.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── App.tsx
│   └── package.json
│
├── backend/
│   ├── main.py
│   ├── api/
│   │   ├── upload.py
│   │   ├── query.py
│   │   └── report.py
│   ├── agents/
│   │   ├── controller.py
│   │   ├── query_classifier.py
│   │   ├── planner.py
│   │   └── executor.py
│   ├── models/
│   │   ├── registry.py
│   │   ├── vqa.py
│   │   ├── caption.py
│   │   ├── grounding.py
│   │   ├── change.py
│   │   └── optical_sar.py
│   ├── preprocessing/
│   │   ├── geotiff.py
│   │   ├── normalization.py
│   │   ├── registration.py
│   │   └── tiling.py
│   ├── fusion/
│   │   ├── evidence.py
│   │   └── confidence.py
│   ├── reports/
│   │   └── generator.py
│   └── utils/
│
├── training/
│   ├── prepare_bigearthnet.py
│   ├── train_vlm.py
│   ├── train_change.py
│   └── evaluate.py
│
├── datasets/
│   ├── BigEarthNet/
│   ├── VRSBench/
│   ├── RSVQA/
│   └── CDVQA/
│
├── models/
│
├── docker/
│
├── tests/
│
└── README.md
```

---

# 7. Image Upload and Validation

Support:

```text
GeoTIFF
TIFF
PNG
JPEG
```

GeoTIFF/TIFF should be the primary geospatial format.

When an image is uploaded:

```text
Upload
 ↓
File validation
 ↓
Format detection
 ↓
Raster metadata extraction
 ↓
Band detection
 ↓
CRS detection
 ↓
Resolution detection
 ↓
Modality detection
 ↓
Compatibility check
```

Example metadata:

```json
{
  "filename": "area_001.tif",
  "format": "GeoTIFF",
  "width": 2048,
  "height": 2048,
  "bands": 4,
  "crs": "EPSG:4326",
  "resolution": "10m",
  "modality": "optical"
}
```

---

# 8. Automatic Modality Detection

The system should determine:

```text
OPTICAL
SAR
UNKNOWN
```

## Optical indicators

```text
RGB
Multispectral
NIR
Red
Green
Blue
```

## SAR indicators

```text
VV
VH
HH
HV
```

Use multiple signals rather than relying only on filenames:

```text
band count
band descriptions
wavelength
polarization
metadata
value distribution
filename
```

---

# 9. Image Preprocessing Pipeline

Satellite imagery may require preprocessing before model inference.

```text
GeoTIFF
   ↓
Read raster
   ↓
Check CRS
   ↓
Check dimensions
   ↓
Normalize bands
   ↓
Handle invalid pixels
   ↓
Resize / tile
   ↓
Generate visualization
   ↓
Model input
```

For very large images:

```text
4096 × 4096
      ↓
256 × 256 tiles
      ↓
512 × 512 tiles
      ↓
model inference
      ↓
aggregate results
```

---

# 10. Agentic Controller

The agentic controller is the core of SatQuery AI.

Instead of hardcoding only simple keyword rules, use a structured pipeline:

```text
User Query
    ↓
Intent Classification
    ↓
Input Validation
    ↓
Task Planning
    ↓
Tool Selection
    ↓
Tool Execution
    ↓
Evidence Fusion
    ↓
Answer Generation
    ↓
Execution Trace
```

Example query:

> What changed between these two images?

Planner output:

```json
{
  "task": "CHANGE_ANALYSIS",
  "required_inputs": [
    "image_t1",
    "image_t2"
  ],
  "tools": [
    "change_detection",
    "change_vqa"
  ]
}
```

Another query:

> Use the optical and SAR images together to identify built-up regions.

Planner output:

```json
{
  "task": "CROSS_MODAL_ANALYSIS",
  "required_inputs": [
    "optical",
    "sar"
  ],
  "tools": [
    "optical_analysis",
    "sar_analysis",
    "fusion"
  ]
}
```

---

# 11. Query Classification

Create the following task classes:

```text
SINGLE_VQA
CAPTIONING
GROUNDING
CHANGE_DETECTION
CHANGE_VQA
OPTICAL_SAR_ANALYSIS
```

The LLM, if used, should primarily act as:

```text
Planner
Router
Interpreter
Answer Synthesizer
```

It should not replace the specialist remote-sensing models.

---

# 12. Model Registry

Create a central registry:

```python
MODEL_REGISTRY = {
    "vqa": {
        "model": "remote_sensing_vqa",
        "input": ["single_image"],
        "output": ["answer", "confidence"]
    },

    "caption": {
        "model": "remote_sensing_captioner",
        "input": ["single_image"],
        "output": ["caption"]
    },

    "grounding": {
        "model": "grounding_model",
        "input": ["image", "text"],
        "output": ["bounding_boxes", "masks"]
    },

    "change": {
        "model": "change_model",
        "input": ["image_t1", "image_t2"],
        "output": ["change_map"]
    },

    "change_vqa": {
        "model": "change_vqa_model",
        "input": ["image_t1", "image_t2", "question"],
        "output": ["answer"]
    },

    "optical_sar": {
        "model": "fusion_model",
        "input": ["optical", "sar"],
        "output": ["semantic_regions"]
    }
}
```

This makes the system modular and auditable.

---

# 13. Single-Image VQA

This is the mandatory baseline.

Example:

> What type of land cover is visible?

Pipeline:

```text
Image + Question
       ↓
Preprocessing
       ↓
Remote-Sensing VQA Model
       ↓
Answer
       ↓
Confidence
       ↓
Evidence
```

Example result:

```text
Answer:
The area is predominantly agricultural land.

Confidence:
91%

Evidence:
Agricultural parcels detected across the central
and eastern portions of the image.
```

---

# 14. Captioning

Implement captioning as the second single-image capability.

Example query:

> Describe this image.

Possible output:

```text
The image shows a predominantly agricultural landscape
with multiple rectangular field parcels, scattered
vegetation and a small built-up region.
```

Display a structured scene summary:

```text
SCENE SUMMARY

Land cover
• Agriculture
• Vegetation
• Built-up

Major objects
• Roads
• Buildings
• Fields
```

---

# 15. Grounding

Grounding can be implemented instead of or in addition to captioning.

Example:

> Highlight the water body.

Pipeline:

```text
Image + Text
     ↓
Grounding Model
     ↓
Bounding Box / Segmentation
     ↓
Visual Overlay
```

Result:

```text
Satellite Image
┌─────────────────────────┐
│                         │
│       ┌───────────┐     │
│       │   WATER   │     │
│       │   BODY    │     │
│       └───────────┘     │
│                         │
└─────────────────────────┘
```

Implementing both captioning and grounding is preferable if time permits.

---

# 16. Bi-Temporal Change Analysis

This should be one of the strongest modules.

Input:

```text
Image T1
Image T2
```

Pipeline:

```text
T1
 ↓
Preprocess

T2
 ↓
Preprocess

T1 + T2
 ↓
Change Detection Model
 ↓
Change Map
 ↓
Change Classification
 ↓
Change Description
```

Example:

```text
2023                    2025

┌───────────┐           ┌───────────┐
│           │           │           │
│  FIELD    │           │ BUILDING  │
│           │           │ BUILDING  │
└───────────┘           └───────────┘
```

---

# 17. Change Map

Start with:

```text
NO CHANGE
CHANGE
```

Then extend to semantic classes:

```text
Agriculture → Built-up
Vegetation → Built-up
Water → Land
Land → Water
Construction
Demolition
```

Overlay the result on the original imagery.

---

# 18. Change VQA

Use change VQA for questions such as:

> Has the built-up area increased?

Pipeline:

```text
T1
 ↓
Built-up extraction

T2
 ↓
Built-up extraction

Compare
 ↓
Area calculation
 ↓
Answer
```

Example:

```text
YES

Built-up area increased between T1 and T2.

Estimated increase:
+18.7%

Main change:
Agricultural/undeveloped land → built-up

Confidence:
93%
```

Only show numerical estimates when the underlying calculation supports them.

---

# 19. Optical + SAR Analysis

This should be a major differentiator.

Input:

```text
OPTICAL IMAGE
       +
SAR IMAGE
```

Use separate analysis branches:

```text
             INPUT
               │
       ┌───────┴───────┐
       ▼               ▼
    OPTICAL            SAR
       │               │
       ▼               ▼
Spectral features  Structural features
       │               │
       └───────┬───────┘
               ▼
        FUSION MODULE
               │
               ▼
       Joint Interpretation
```

Do not simply concatenate the images and call it fusion.

---

# 20. Optical vs SAR Information

## Optical

Useful for:

```text
Color
Spectral information
Vegetation
Water
Land cover
```

## SAR

Useful for:

```text
Surface structure
Texture
Built-up response
Moisture-related information
Cloud-independent observation
```

The system should explain how each modality contributes.

Example:

> Optical imagery indicates a water-covered region, while SAR provides complementary structural/backscatter evidence. Joint analysis increases confidence in the interpretation.

---

# 21. Evidence Fusion

Create a standard evidence object:

```json
{
  "answer": "Built-up area increased",
  "confidence": 0.93,
  "evidence": [
    {
      "type": "change_map",
      "location": []
    },
    {
      "type": "built_up_detection",
      "area_change": 18.7
    }
  ]
}
```

The final answer generator should rely on specialist outputs and evidence rather than unsupported claims.

---

# 22. Confidence System

Avoid arbitrary confidence values.

Build confidence from several signals:

```text
Model confidence
+
Input quality
+
Cross-model agreement
+
Evidence strength
```

Example:

```text
Model confidence       0.91
Image quality          0.96
Cross-model agreement  0.94
Evidence coverage      0.92
────────────────────────────
Final confidence       0.93
```

Display:

```text
93% HIGH CONFIDENCE
```

Use clear confidence categories:

```text
90–100%  HIGH
70–89%   MEDIUM
<70%     LOW
```

These thresholds are product/UI conventions and should not be presented as scientifically validated probabilities.

---

# 23. Execution Trace

The execution trace is critical.

Display:

```text
EXECUTION TRACE

✓ Input validation
  Optical GeoTIFF detected

✓ Query classification
  Task: Cross-modal analysis

✓ Model selection
  Optical semantic model
  SAR analysis model
  Optical-SAR fusion model

✓ Execution
  3 specialist tools executed

✓ Evidence fusion
  5 regions identified

✓ Confidence
  92%

✓ Final response generated
```

The observable trace should include:

- Selected task.
- Selected model/tool names.
- Permitted parameters.
- Key outputs.
- Execution status.
- Confidence/evidence information.

Do not expose private chain-of-thought or internal reasoning.

---

# 24. Remote-Sensing Adaptation

At least one visual or vision-language component must be adapted using BigEarthNet.txt or other open-source training data.

Recommended approach:

```text
Base VLM
   ↓
Remote-sensing adaptation
   ↓
LoRA / PEFT
   ↓
Adapted VLM
```

Use:

```text
LoRA
PEFT
Mixed precision
Gradient accumulation
```

Do not attempt to fine-tune every model.

---

# 25. Training Pipeline

```text
BigEarthNet
      ↓
Dataset cleaning
      ↓
Image-text pairs
      ↓
Train/validation split
      ↓
Image preprocessing
      ↓
Tokenization
      ↓
LoRA adaptation
      ↓
Validation
      ↓
Checkpoint
      ↓
SatQuery model registry
```

Example output:

```text
models/
└── satquery-vlm-lora/
    ├── adapter_config.json
    ├── adapter_model.safetensors
    └── tokenizer/
```

---

# 26. Benchmark Evaluation

The project should include a dedicated evaluation pipeline for the prescribed public benchmarks.

Datasets named in the problem statement include:

```text
BigEarthNet
VRSBench
RSVQA
CDVQA
```

Use them for the relevant adaptation/evaluation tasks.

Pipeline:

```text
Dataset
 ↓
Model
 ↓
Prediction
 ↓
Ground Truth
 ↓
Metrics
 ↓
Evaluation Report
```

---

# 27. Evaluation Metrics

## VQA

```text
Accuracy
F1
Exact Match
```

## Captioning

```text
BLEU
ROUGE
CIDEr
METEOR
```

## Grounding

```text
IoU
mAP
```

## Change Detection

```text
IoU
Precision
Recall
F1
```

## Agentic System

```text
Correct task routing
Tool selection accuracy
Execution success rate
Evidence consistency
```

---

# 28. Agent Evaluation Table

Prepare a table such as:

| Query | Expected Task | Selected Tool | Correct? |
|---|---|---|---|
| Describe image | Captioning | Caption Model | Yes |
| What is present? | VQA | VQA Model | Yes |
| Highlight water | Grounding | Grounding Model | Yes |
| What changed? | Change | Change Model | Yes |
| Did buildings increase? | Change VQA | Change VQA | Yes |
| Optical + SAR analysis | Fusion | Fusion Model | Yes |

Track these metrics automatically during testing.

---

# 29. Database

Use PostgreSQL for persistent analysis history.

## users

```text
id
name
created_at
```

## analyses

```text
id
user_id
query
task
created_at
confidence
final_answer
```

## images

```text
id
analysis_id
filename
modality
crs
resolution
timestamp
```

## execution_trace

```text
id
analysis_id
tool_name
model_name
parameters
status
execution_time
```

## evidence

```text
id
analysis_id
type
location
confidence
```

---

# 30. API Design

## Upload

```http
POST /api/images/upload
```

## Analyze

```http
POST /api/analyze
```

Example request:

```json
{
  "query": "Has the built-up area increased?",
  "images": [
    "image_t1.tif",
    "image_t2.tif"
  ]
}
```

Example response:

```json
{
  "task": "CHANGE_VQA",
  "answer": "Yes, built-up area increased.",
  "confidence": 0.93,
  "evidence": [],
  "execution_trace": []
}
```

## Report

```http
GET /api/report/{analysis_id}
```

## History

```http
GET /api/analyses
```

---

# 31. Agent Execution Flow

Conceptual controller:

```python
def analyze(query, inputs):

    intent = classify_query(query)

    validate_inputs(
        intent=intent,
        inputs=inputs
    )

    plan = planner.create_plan(
        intent=intent,
        inputs=inputs
    )

    results = []

    for tool in plan.tools:

        result = executor.run(
            tool=tool,
            inputs=inputs,
            parameters=plan.parameters
        )

        results.append(result)

    evidence = fuse_evidence(results)

    answer = generate_answer(
        query=query,
        evidence=evidence
    )

    return build_response(
        answer=answer,
        evidence=evidence,
        trace=execution_trace
    )
```

---

# 32. Input Validation Layer

Before running any specialist model:

```text
Does required image exist?
        ↓
Correct number of images?
        ↓
Correct modality?
        ↓
Compatible dimensions?
        ↓
Spatially corresponding?
        ↓
Valid metadata?
```

Example:

```text
User uploads unrelated Optical + SAR images.

System response:

Unable to perform cross-modal analysis.

Reason:
The supplied images cannot be verified as spatially corresponding.
```

This prevents unsupported or misleading outputs.

---

# 33. Geospatial Registration

For paired images:

```text
Optical + SAR
```

or:

```text
T1 + T2
```

check:

```text
CRS
Bounds
Resolution
Dimensions
Geotransform
```

If necessary:

```text
Reproject
      ↓
Resample
      ↓
Align
      ↓
Crop common area
```

The evaluation imagery described in the problem statement is expected to be pre-georeferenced and co-registered, but the application should still validate compatibility.

---

# 34. Result Page

After analysis, show four major sections.

## A. Answer

```text
AI ANALYSIS

Built-up area increased between
the two observations.

Estimated increase: 18.7%

Confidence: 93%
```

## B. Visual Evidence

```text
Before | After | Change Map
```

## C. Spatial Evidence

```text
Changed Region 1
Changed Region 2
Changed Region 3
```

## D. Execution Trace

```text
Query
 ↓
Change Analysis
 ↓
Change Detection Model
 ↓
Change VQA Model
 ↓
Evidence Fusion
 ↓
Answer
```

---

# 35. Downloadable Report

Generate a report containing:

```text
SatQuery AI Analysis Report

Query:
Has the built-up area increased?

Input:
Image T1
Image T2

Task:
Change-based VQA

Result:
YES

Confidence:
93%

Detected Changes:
...

Visual Evidence:
...

Models:
...

Execution Trace:
...
```

Export formats:

```text
PDF
JSON
```

---

# 36. Dashboard

Landing screen:

```text
SATQUERY AI
────────────────────────────────────────

      🛰 Remote Sensing Intelligence

Ask questions about satellite imagery.

[ Upload Image ]

[ Upload Second Image ]

[ Ask your question.................... ]

                 ANALYZE
```

Example queries:

```text
"What land cover is present?"

"Highlight the water body."

"What changed between these dates?"

"Has the built-up area increased?"

"Combine optical and SAR information."
```

---

# 37. Four Main Demo Scenarios

## Demo 1 — Single Image VQA

Input:

```text
Optical image
```

Query:

> What type of land cover dominates this scene?

Expected result:

```text
Agricultural land dominates the scene.

Confidence: 94%
```

---

## Demo 2 — Grounding

Query:

> Highlight the water body.

Workflow:

```text
Grounding Agent
      ↓
Bounding box / mask
      ↓
Highlighted satellite image
```

---

## Demo 3 — Change Analysis

Input:

```text
T1
T2
```

Query:

> What changed between these two dates?

Show:

```text
BEFORE | AFTER | CHANGE MAP
```

Expected response:

```text
Major construction activity detected.

Several regions changed from
non-built-up to built-up.

Change confidence: 91%
```

---

## Demo 4 — Optical + SAR

Input:

```text
Optical
+
SAR
```

Query:

> Use both images to identify built-up and water-covered regions.

Workflow:

```text
Optical Agent
      ↓
SAR Agent
      ↓
Fusion Agent
      ↓
Joint interpretation
```

Output:

```text
Built-up regions:
...

Water regions:
...

Cross-modal confidence:
94%
```

---

# 38. Development Roadmap

## Phase 1 — Foundation

### Days 1–3

Build:

```text
Git repository
Backend
Frontend
Docker
Upload system
GeoTIFF reader
Metadata extraction
```

Deliverable:

> User can upload satellite imagery and see metadata.

---

## Phase 2 — Single Image

### Days 4–7

Implement:

```text
VQA
Captioning
Grounding
```

Deliverable:

```text
Image
+
Question
 ↓
Answer
+
Evidence
```

---

## Phase 3 — Change Detection

### Days 8–12

Implement:

```text
T1/T2 upload
Registration checking
Change detection
Change map
Change description
```

Deliverable:

```text
Before
After
Change Map
```

---

## Phase 4 — Optical + SAR

### Days 13–16

Implement:

```text
Optical preprocessing
SAR preprocessing
Feature extraction
Fusion
Joint interpretation
```

Deliverable:

```text
Optical
+
SAR
 ↓
Joint result
```

---

## Phase 5 — Agent

### Days 17–20

Implement:

```text
Query classifier
Planner
Model registry
Tool executor
Evidence fusion
Execution trace
```

This should be a major architectural milestone.

---

## Phase 6 — Remote-Sensing Adaptation

### Days 21–25

Implement:

```text
BigEarthNet preprocessing
LoRA
Fine-tuning
Validation
Model packaging
```

---

## Phase 7 — Evaluation

### Days 26–28

Run relevant evaluation tasks using:

```text
VRSBench
RSVQA
CDVQA
```

Measure:

```text
VQA accuracy
Caption metrics
Grounding IoU
Change F1
Change IoU
Agent routing accuracy
```

---

## Phase 8 — UI + SIH Demo

### Days 29–32

Polish:

```text
Dashboard
Image viewer
Maps
Confidence
Execution trace
Reports
Error handling
Loading states
```

Prepare:

```text
3–5 polished demo scenarios
```

---

## Phase 9 — Final Testing

### Days 33–35

Test:

```text
Single optical
Single SAR
Optical + SAR
T1 + T2
Invalid image
Wrong modality
Missing metadata
Huge image
Unsupported format
Ambiguous query
```

---

# 39. Team Division

For a four-person team:

## Member 1 — AI/VLM

```text
VQA
Captioning
Grounding
Fine-tuning
Evaluation
```

## Member 2 — Remote Sensing

```text
GeoTIFF
SAR
Optical preprocessing
Registration
Change detection
Fusion
```

## Member 3 — Agent / Backend

```text
FastAPI
Agent controller
Planner
Model registry
Evidence
Database
```

## Member 4 — Frontend

```text
React
GIS viewer
Dashboard
Visual evidence
Execution trace
Reports
```

All members should understand the complete architecture before the final presentation.

---

# 40. What NOT to Build

## Do not build a generic chatbot

Weak:

```text
Image → Generic LLM → Answer
```

## Do not use one generic VLM for everything

Use specialist models/tools for the different tasks.

## Do not create a fake agent

Avoid an architecture where the word "agent" is used but the system is just a few hidden keyword checks.

## Do not return answers without evidence

Weak:

> Built-up area increased.

Better:

```text
Built-up area increased.

Evidence:
- Change map
- Built-up segmentation
- Before/after comparison
- Estimated area change
```

## Do not skip remote-sensing adaptation

The system needs a genuine adaptation/fine-tuning component.

## Do not skip the execution trace

Make the selected task, model/tool and key parameters visible.

---

# 41. Killer Feature — Explainable Agentic Satellite Reasoning

Make this the centerpiece of the final demonstration.

```text
┌───────────────────────────────────────────┐
│           SATQUERY AI DECISION            │
├───────────────────────────────────────────┤
│                                           │
│ Query                                     │
│ "Has built-up area increased?"             │
│                                           │
│ Intent                                    │
│ CHANGE_VQA                                │
│                                           │
│ Inputs                                    │
│ T1 + T2                                   │
│                                           │
│ Tools executed                            │
│ ✓ Change Detection                        │
│ ✓ Built-up Segmentation                   │
│ ✓ Change VQA                              │
│                                           │
│ Evidence                                  │
│ +18.7% built-up area                      │
│                                           │
│ Confidence                                │
│ 93%                                       │
│                                           │
│ RESULT                                    │
│ Built-up area increased.                  │
└───────────────────────────────────────────┘
```

This makes the agentic nature visible to judges rather than merely claiming that the system is agentic.

---

# 42. Final Architecture

Use this architecture for the final technical presentation:

```text
                        USER
                          │
                          ▼
                 ┌────────────────┐
                 │   WEB / GUI    │
                 └───────┬────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ QUERY INTERPRETER│
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ AGENTIC PLANNER  │
                └────────┬─────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
       SINGLE          CHANGE       OPTICAL-SAR
       AGENT           AGENT           AGENT
          │              │              │
     ┌────┼────┐         │          ┌───┴───┐
     ▼    ▼    ▼         ▼          ▼       ▼
    VQA Caption Ground  Change    Optical   SAR
                     │              │       │
                     │              └───┬───┘
                     │                  ▼
                     │                Fusion
                     │                  │
                     └────────┬─────────┘
                              ▼
                     ┌────────────────┐
                     │ EVIDENCE FUSION│
                     └───────┬────────┘
                             ▼
                 ┌──────────────────────┐
                 │ ANSWER + MAP +       │
                 │ CONFIDENCE + TRACE   │
                 └──────────────────────┘
```

---

# 43. Recommended MVP

If development time becomes limited, prioritize the mandatory functionality over decorative features.

```text
                    SATQUERY AI
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
     SINGLE           TEMPORAL        OPTICAL-SAR
     IMAGE             CHANGE            FUSION
        │                │                │
     ┌──┴──┐          ┌──┴──┐          ┌──┴──┐
     VQA Caption       Change Change    Optical SAR
                       Map    VQA
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                 AGENT CONTROLLER
                         │
                         ▼
                 EVIDENCE FUSION
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
           ANSWER      VISUAL      TRACE
                     EVIDENCE
```

The preferred implementation order is:

```text
Upload
→ GeoTIFF processing
→ VQA
→ Caption/Grounding
→ Change
→ Optical/SAR
→ Agent
→ Evidence
→ Fine-tuning
→ Evaluation
→ UI polish
→ SIH demo
```

---

# 44. Final Success Criteria

The project is ready for SIH demonstration when all of the following work end-to-end:

- [ ] Optical image upload works.
- [ ] SAR image upload works.
- [ ] GeoTIFF metadata extraction works.
- [ ] Image compatibility validation works.
- [ ] Single-image VQA works.
- [ ] Captioning or grounding works.
- [ ] Bi-temporal change analysis works.
- [ ] Change map is displayed.
- [ ] Change VQA works.
- [ ] Optical–SAR paired analysis works.
- [ ] Agent automatically selects the workflow.
- [ ] Specialist tools are registered and executed.
- [ ] At least one model/component has genuine remote-sensing adaptation.
- [ ] Evidence is returned with the answer.
- [ ] Confidence is shown.
- [ ] Execution trace is visible.
- [ ] Results can be downloaded.
- [ ] Evaluation scripts are available.
- [ ] Public benchmark testing is documented.
- [ ] Demo scenarios are repeatable.
- [ ] Dockerized deployment works.
- [ ] The team can explain every component to judges.

---

# 45. Final Build Strategy

The most important principle is:

> **Build a small number of strong, demonstrable capabilities end-to-end rather than many unfinished AI features.**

The final SIH prototype should feel like:

```text
                    SATQUERY AI
                         │
                         ▼
                  Natural Language
                         │
                         ▼
                  Agentic Planner
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Single          Change       Cross-Modal
       Image           Analysis        Analysis
          │              │              │
          ▼              ▼              ▼
       VQA /          Change          Optical +
       Caption /      Detection +     SAR Fusion
       Grounding      Change VQA
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                  Evidence Fusion
                         │
                         ▼
              ┌─────────────────────┐
              │ Answer              │
              │ Confidence          │
              │ Visual Evidence     │
              │ Change Map          │
              │ Execution Trace     │
              └─────────────────────┘
```

This gives you a complete path from **user query → agent planning → specialist remote-sensing models → multimodal reasoning → evidence → explainable answer**.
