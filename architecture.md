# Software Architecture Document (SAD)
**Project:** SatQuery AI (SIH26167)
**Pattern:** Decoupled Microservices (Agentic Backend + Web Client)

---

## 🏛️ 1. ARCHITECTURE
*Overview of the system design, components, and their interactions.*

Our system follows a **Client-Server Architecture with an Agentic Orchestration Layer**. It is designed to be highly modular, allowing the AI logic to scale independently without bottlenecking the frontend GUI.

### 1.1 Core Components
1. **Frontend Client (React.js):** 
   - Handles the Interactive GUI, Image Uploads, and Map Visualizations (Leaflet/OpenLayers).
   - Manages state for the Chat Interface (using Context API/Redux).
2. **API Gateway & Controller (FastAPI):**
   - Receives multipart form data (Images + Text Queries).
   - Houses the **Agentic Router** (built with LangChain). Instead of forcing all data through one model, the Router acts as a "traffic cop", interpreting the query and executing the appropriate specialist Python script.
3. **Specialist AI Modules (The "Agents"):**
   - `Single Image VQA Agent`: Processes single images against the adapted VLM.
   - `Optical-SAR Fusion Agent`: Ingests paired GeoTIFFs to extract complementary features.
   - `Change Detection Agent`: Compares bi-temporal pairs to generate spatial change masks.
4. **Data Layer (Storage & Cache):**
   - Local temporary volume for holding uploaded large GeoTIFF files during inference.
   - Secure deletion after model execution to optimize memory.

### 1.2 System Flow
`User Uploads Image & Query` ➔ `React Client sends POST Request` ➔ `FastAPI receives payload` ➔ `LangChain Agent classifies query (e.g., "Grounding")` ➔ `Agent triggers Grounding VLM` ➔ `Model generates Bounding Box Coordinates` ➔ `FastAPI returns JSON response + Execution Trace` ➔ `React overlays Bounding Box on Map`.

---

## 📁 2. FOLDER & FILE STRUCTURE
*Organized structure of the Monorepo separating frontend, backend, and AI models.*

```text
satquery-ai-workspace/
│
├── frontend/                     # React.js Web Application (Vite)
│   ├── src/
│   │   ├── assets/               # Images, Icons
│   │   ├── components/           # Reusable UI components
│   │   │   ├── map/              # Leaflet drawing components
│   │   │   ├── chat/             # AI Chat bubbles, input box
│   │   │   └── upload/           # Drag-and-drop file uploaders
│   │   ├── pages/                # Main views (Dashboard, etc.)
│   │   ├── services/             # Axios/Fetch API calls to Python backend
│   │   ├── context/              # React Context for global state
│   │   ├── App.jsx               # Main React Component
│   │   └── index.css             # Global CSS (Tailwind)
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Python FastAPI Application
│   ├── app/
│   │   ├── main.py               # FastAPI entry point & routes
│   │   ├── agents/               # LangChain Agentic Orchestrators
│   │   │   ├── router.py         # Decides which specialist model to run
│   │   │   └── executor.py       # Handles the execution trace logging
│   │   ├── models/               # AI Model inference scripts
│   │   │   ├── vqa_model.py      # Single-image QA logic
│   │   │   ├── grounding.py      # Bounding box generation
│   │   │   └── temporal.py       # Bi-temporal change detection logic
│   │   ├── services/             # Image processing utilities
│   │   │   └── gis_parser.py     # Parses GeoTIFF/TIFF files (rasterio)
│   │   └── core/                 # Configs, Environment Variables
│   ├── requirements.txt
│   └── run.sh
│
└── notebooks/                    # Model Fine-Tuning & Data Prep
    ├── bigearthnet_prep.ipynb    # Prepping BigEarthNet dataset for training
    └── lora_finetune.ipynb       # LoRA adaptation scripts for the baseline VLM
```

---

## 🥞 3. TECH STACK
*Technologies and tools engineered into the project.*

### Frontend (Client-Side)
*   **Framework:** React 18 (with Vite for fast compilation)
*   **Language:** JavaScript/JSX
*   **Styling:** Tailwind CSS + Framer Motion (for smooth chat animations)
*   **GIS/Mapping:** Leaflet.js (via `react-leaflet`) for rendering bounding boxes and change masks over uploaded imagery.

### Backend (Server-Side)
*   **API Framework:** FastAPI (Python 3.10+) - Chosen for its speed and native async support, crucial for heavy AI operations.
*   **Agentic Framework:** LangChain (For building the Tool Registry and Task Planning router).
*   **Server Gateway:** Uvicorn (ASGI web server).

### Artificial Intelligence & Data Processing
*   **Base VLM:** LLaVA (Large Language-and-Vision Assistant) or Qwen-VL (Open-weights models capable of multimodal reasoning).
*   **Fine-Tuning:** Hugging Face `transformers` + `PEFT` (Parameter-Efficient Fine-Tuning / QLoRA) for adapting to remote-sensing data.
*   **GIS Processing:** `rasterio` and `GDAL` (to read TIFF metadata, coordinate reference systems, and pixel data).
*   **Image Processing:** `Pillow` and `OpenCV` (cv2) for resizing and tensor preparation.
