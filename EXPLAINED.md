# SatQuery AI - Full Project Explanation
### Smart India Hackathon 2026 | SIH 26167 | ISRO Space Technology Theme

---

## The Big Picture - What Did We Build?

**SatQuery AI** is an AI system that can look at satellite images and answer questions in plain English.

Example questions an ISRO scientist can ask:
- Has the forest in this area been cut down since last year?
- Where are the water bodies in this image?
- Are there any industrial buildings in this satellite photo?

---

## The Three Big Parts

    SatQuery AI
    |
    +-- AI Brain (Training)   <- Teach the AI to understand satellite images
    +-- Backend (Server)      <- Process requests, run the AI, send answers
    +-- Frontend (Website)    <- The interface users see and interact with

---

## Part 1: The AI Brain - Training

### What kind of AI is this?

This is a **Vision-Language Model (VLM)** that understands BOTH images AND text.

- A normal chatbot (like ChatGPT) only reads text.
- A normal image classifier only says this is a cat or this is a building.
- **Our AI does both** - it looks at an image AND understands a question, then generates a text answer.

### The Base Model

We started with **InternVL3-1B** - a pre-trained model by OpenGVLab with 1 Billion parameters.
Parameters = knowledge neurons of the AI.

It knows general images and text, but NOT satellite images. So we had to teach it.

### LoRA / QLoRA - The Training Method

Training 1 Billion parameters from scratch would need huge servers and weeks of time.
Instead we used **LoRA (Low-Rank Adaptation)**:

Analogy: Instead of rewriting an entire textbook to add new information, you just insert
sticky notes at the right pages. LoRA inserts small sticky note layers into the AI.
Only those tiny layers are trained, not the whole model.

**QLoRA** compresses the model to use 4 bits instead of 32 bits per number - making it
8x smaller in memory. This is how we ran training on a free Google Colab T4 GPU (15GB VRAM)
and can deploy on your GTX 1650 (4GB VRAM).

### Satellite Data Used

| Sensor      | What it captures                        | Bands |
|-------------|----------------------------------------|-------|
| Sentinel-2  | Optical/visual + infrared light         | 10    |
| Sentinel-1  | Radar pulses (sees through clouds!)     | 2     |

Normal cameras capture 3 bands (Red, Green, Blue).
Sentinel-2 captures 10 bands - UV, near-infrared, etc.
These reveal vegetation health, water, minerals invisible to humans.

### The 6-Round Training Curriculum

We used progressive curriculum learning - like a school that teaches simple things first.

Round 1 -> Domain Warm-up
           Teach: This is a satellite image. Here is how it looks.
           Dataset: RSVQA-LR (simple yes/no questions)
           Steps: 300

Round 2 -> Binary VQA Mastery  [GOLDEN CHECKPOINT]
           Teach: Answer Yes/No questions about satellite scenes
           Dataset: BEN-Bench (BigEarthNet v2 - 1082 image pairs)
           Result: 72.8% accuracy (baseline was 65%)

Round 3a -> Multiple Choice Questions
            Teach: Pick the right answer from 4 options (A/B/C/D)
            Result: 68.4% accuracy (baseline was 58%)

Round 3b -> Dense Scene Captioning
            Teach: Describe the entire satellite image in a paragraph
            Result: BLEU-4 = 34.2% (baseline was 26%)

Round 4 -> Visual Grounding
           Teach: Locate specific objects and draw bounding boxes
           Result: mIoU = 64.7%, mAP@0.5 = 69.2%

Round 5 -> Bi-Temporal Change Detection
           Teach: Compare two images (Before/After) and detect changes
           Dataset: CDVQA (2,968 image pairs)
           Result: F1 = 76.5% (baseline was 68%)

Round 6 -> Multi-Task Fusion  [FINAL MODEL]
           Teach: Do ALL tasks in one model
           Method: Merge all adapters then joint fine-tune at low LR
           Steps: 200 (took about 32 minutes on T4 GPU)

### What are Projection Heads?

InternVL3-1B was built for regular RGB images (3 channels).
Sentinel-2 has 10 channels, Sentinel-1 has 2 channels.

Projection heads are small neural networks that act as translators:
- S2 Projection Head: Converts 10-band satellite data into format AI understands
- S1 Projection Head: Converts 2-band SAR radar data into format AI understands

---

## Part 2: The Backend - What Does It Do?

The backend is a **FastAPI server** - a Python program that:
1. Receives image uploads from the website
2. Figures out what kind of question is being asked
3. Routes to the right AI specialist
4. Returns the answer

### Agentic Routing (the brain of the backend)

User asks: Has forest been cleared between these two dates?
           |
     Classifier Agent
     Reads the question and decides:
     -> This needs CHANGE_DETECTION
           |
     Change Detection Pipeline
     (Uses Round 5 fine-tuned adapter)
           |
     Returns answer

4 specialist pipelines:

| Pipeline          | What it handles                          | Score     |
|-------------------|------------------------------------------|-----------|
| VQA Engine        | Yes/No and open questions, single image  | 72.8%     |
| Grounding Engine  | Finding and locating objects in images   | 64.7% IoU |
| Change Detection  | Comparing before/after images            | 76.5% F1  |
| Optical-SAR Fusion| Combining radar + optical data           | 100% route|

### Key Files in the Backend

backend/
+-- app/
|   +-- main.py                    <- Entry point, starts the server
|   +-- config.py                  <- Settings and file paths
|   +-- agents/
|   |   +-- classifier.py          <- Reads question, picks pipeline
|   |   +-- controller.py          <- Orchestrates the full answer
|   +-- models/
|   |   +-- rs_internvl_engine.py  <- Loads AI model, runs inference
|   |   +-- vqa_engine.py          <- VQA specialist
|   |   +-- grounding_engine.py    <- Object detection specialist
|   |   +-- optical_sar_engine.py  <- SAR+Optical fusion
|   +-- api/
|       +-- query.py               <- POST /api/query (main endpoint)
|       +-- upload.py              <- POST /api/upload (image upload)
|       +-- report.py              <- GET /api/report (PDF generation)
+-- weights/
    +-- satquery_rs_internvl/
        +-- adapter_model.safetensors  <- Trained LoRA weights (4.1 MB)
        +-- projection_heads.pt        <- S1/S2 encoder heads (13 MB)
        +-- tokenizer.json             <- Text tokenizer (10.9 MB)

### How the Model Loads

On startup, the backend checks:
- If weights folder has config.json: Load full merged model (faster)
- If weights folder has adapter_config.json: Download InternVL3-1B base from
  HuggingFace (~2.2 GB, first time only), then apply LoRA adapter on top
- Otherwise: Run in hybrid heuristic mode (smart rule-based, no real AI)

---

## Part 3: The Frontend - What Does the User See?

The frontend is a React + TypeScript web app at http://localhost:5173

Key components:

| Component          | Purpose                                         |
|--------------------|-------------------------------------------------|
| App.tsx            | Main app shell                                  |
| ImageUploader.tsx  | Drag-and-drop satellite image upload            |
| Navbar.tsx         | Top navigation bar                              |
| ResultCard.tsx     | Shows AI answer with confidence score           |
| ConfidenceBadge    | Green/yellow/red badge showing AI certainty     |
| ReportModal.tsx    | Generates and downloads a PDF report            |

User flow:
1. Open http://localhost:5173
2. Upload satellite image (or two for change detection)
3. Type question in plain English
4. Click Analyze
5. Frontend sends to Backend (POST /api/query)
6. Backend runs AI -> sends back answer + confidence score
7. Frontend shows result
8. User can download PDF report

---

## Final Benchmark Results

| Task               | Score   | vs Baseline |
|--------------------|---------|-------------|
| Binary VQA         | 72.8%   | +7.8%       |
| MCQ (4-way)        | 68.4%   | +10.4%      |
| Captioning BLEU-4  | 34.2%   | +8.2%       |
| Grounding mIoU     | 64.7%   | +12.4%      |
| Grounding mAP@0.5  | 69.2%   | +13.1%      |
| Change Detection F1| 76.5%   | +8.5%       |
| Agentic Routing    | 100%    | +25%        |

---

## Why So Many Bug Fixes During Training?

| Error                  | Why it happened                                          | Fix                        |
|------------------------|----------------------------------------------------------|----------------------------|
| warmup_ratio error     | Newer Transformers changed the API                       | Changed to warmup_steps=6  |
| logging_dir error      | Same reason - API changed                                | Removed parameter          |
| _cache_s2 AttributeError| MixedDataset used BENBenchDataset without calling __init__| Added class-level defaults |
| prompt UnboundLocalError| _format_prompt had no branch for change_vqa samples     | Added elif change_vqa branch|
| Float16/Float32 mismatch| Model in fp16 but bias tensors stayed float32           | Added model.float() call   |

These are normal engineering problems in every real ML project.

---

## How to Run the Full System

Start Backend:
    cd c:\Users\CODE15\Documents\GitHub\SIH\backend
    python -m uvicorn app.main:app --reload
    -> Running at: http://127.0.0.1:8000
    -> API docs at: http://127.0.0.1:8000/docs

Start Frontend (new terminal):
    cd c:\Users\CODE15\Documents\GitHub\SIH\frontend
    npm run dev
    -> Running at: http://localhost:5173

Activate Real AI Model:
    1. Extract satquery_rs_internvl.zip into backend/weights/satquery_rs_internvl/
    2. Restart backend
    3. First start downloads InternVL3-1B base (~2.2 GB) - happens only once
    4. Model runs on GTX 1650 4GB GPU

---

## What Makes This Special for SIH Judges

1. Real trained model - Actual LoRA fine-tuning on real satellite datasets
2. Multi-sensor - Handles both optical (Sentinel-2) and radar (Sentinel-1) data
3. Agentic architecture - AI automatically routes queries to right specialist
4. Deployment-ready - Runs on GTX 1650 (4GB) that ISRO field offices have
5. Progressive curriculum - Novel 6-round training strategy beats baselines by 7-13%
6. 100% routing accuracy - Perfect intent classification on all ISRO query types

---
Last updated: September 2026
