# Product Requirements Document (PRD)
**Project Name:** SatQuery AI (SIH26167)
**Organization:** Indian Space Research Organisation (ISRO)
**Theme:** Space Technology (Software Track)
**Document Status:** Final / Approved for Hackathon Development

---

## 💡 1. WHAT TO BUILD
### 1.1 Product Vision
SatQuery AI is an **Agentic Vision-Language Web Assistant** designed to democratize satellite data analysis. It translates complex, multi-modal remote-sensing imagery (Optical, SAR) into understandable, actionable insights using natural language. 

### 1.2 Core Purpose
To bridge the gap between highly technical GIS (Geographic Information System) workflows and non-expert users. Instead of using isolated tools for specific tasks (like land-cover classification or change detection), the user can simply upload an image and ask a question in plain text.

### 1.3 Key Goals
- Successfully process GeoTIFF/TIFF, PNG, and JPEG imagery.
- Provide a robust Agentic Controller that automatically routes queries to the correct specialized Vision-Language Model (VLM).
- Surpass generic LLMs by using models specifically fine-tuned on remote-sensing data (BigEarthNet).

---

## 👥 2. TARGETED USER
Who is this for and what are their needs?

### 2.1 Persona 1: The Non-Expert Field Officer (e.g., Agriculture/Disaster Mgmt)
*   **Need:** Cannot read complex SAR or multispectral data. Needs simple text answers ("Where are the flooded areas in this image?").
*   **Problem Solved:** Replaces the need for specialized GIS software with a conversational ChatGPT-like interface.

### 2.2 Persona 2: The Urban Planner
*   **Need:** Needs to track city expansion over time. 
*   **Problem Solved:** Uploads two images from different years (Time 1 & Time 2) and simply asks, "Has the built-up area increased?" The AI autonomously runs the Bi-temporal Change Detection workflow and outputs the answer with a visual highlight map.

### 2.3 Persona 3: Defense / Intelligence Analyst
*   **Need:** Needs to see through clouds or analyze structural data during the night.
*   **Problem Solved:** Uploads Optical + SAR co-registered pairs. The AI fuses both to deliver insights impossible to see with the naked eye.

---

## 📋 3. FEATURES (Functional Requirements)
*The mandatory capabilities the MVP (Minimum Viable Product) must deliver.*

### 3.1 Input / Pre-Processing Module
*   **Drag-and-Drop Uploader:** Supports Single Image, Cross-modal pairs (Optical+SAR), and Bi-temporal pairs.
*   **Format Validation:** Strict parsing of GeoTIFF/TIFF. PNG/JPEG fallback for benchmarking datasets only.

### 3.2 The Agentic Orchestrator (The Core Engine)
*   **Query Routing:** Automatically interprets the user's natural language query and selects the correct tool from the AI registry (e.g., choosing "Grounding" instead of "VQA").
*   **Auditable Trace:** Displays an execution summary card in the UI showing exactly which model was chosen and the confidence score.

### 3.3 Core AI Tools (Specialist Workflows)
*   **F1: Single-Image VQA (Visual Question Answering) 🟢 [Mandatory]** 
    *   *User:* "Describe the land-cover." -> *AI:* Textual description.
*   **F2: Text-Guided Region Grounding 🟢 [Mandatory]**
    *   *User:* "Highlight the water body." -> *AI:* Returns bounding boxes/masks rendered on the frontend Viewer.
*   **F3: Bi-Temporal Change Detection 🟢 [Mandatory]**
    *   *User:* "What changed between these two dates?" -> *AI:* Text description + Spatial change map overlay.
*   **F4: Optical-SAR Fusion Analysis 🟢 [Mandatory]**
    *   *User:* "Use optical and SAR to identify built-up areas." -> *AI:* Cross-modal reasoning output.

### 3.4 Interactive GUI (Frontend)
*   **Split-Screen Console:** Left side for the Interactive Map/Image Viewer (to draw highlights), Right side for the AI Chat interface.
*   **Downloadable Reports:** Ability to export the entire chat, execution trace, and visual masks into a PDF report.

---

## ⚙️ 4. NON-FUNCTIONAL REQUIREMENTS & TECH STACK
### 4.1 Technology Stack
*   **Frontend UI:** React (Vite), Tailwind CSS, Leaflet.js (for Map Overlays).
*   **Backend Server:** Python, FastAPI (High-performance API).
*   **AI Agent Orchestration:** LangChain / LlamaIndex.
*   **Base VLM (Vision-Language Model):** Open-source weights (e.g., LLaVA, PaliGemma) running via HuggingFace or optimized inference endpoints.

### 4.2 Training & Datasets (ISRO Mandate)
*   **Fine-Tuning Requirement:** The baseline VLM *must* be adapted using **BigEarthNet.txt** (https://arxiv.org/abs/2603.29630). Generic models will be instantly disqualified by ISRO.
*   **Public Benchmarks for Evaluation:** `VRSBench`, `RSVQA` (for single image), and `CDVQA` (for multi-temporal change).

---

## 🛑 5. OUT OF SCOPE (For Hackathon MVP)
To ensure we don't break the system in 36 hours, we will **NOT** build:
- Live satellite feed integration (We will rely on static user uploads).
- Custom foundational pre-training (We will use LoRA fine-tuning on existing models, not train a multi-billion parameter model from scratch).
- 3D Generation or rendering (We are keeping it strictly 2D bounding boxes and chat).
