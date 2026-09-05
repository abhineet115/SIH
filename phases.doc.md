# phases.doc.md - Project Development Phases
**Project:** SatQuery AI (SIH26167)
*Breakdown of the project into manageable hackathon execution phases.*

---

## 🔒 PHASE 1: LOGIN & AUTHENTICATION
*Establishing secure access for different user roles (e.g., Scientist vs. General User).*
- System User registration and setup.
- Login / Logout functionality (JWT based).
- Role-based authorization (ISRO admins can access internal debugging traces, normal users only see map outputs).

## 🎛️ PHASE 2: DASHBOARD & UI SKELETON
*Building the visual foundation of the web application in React (Vite).*
- Create the core Dashboard layout (Glassmorphism theme).
- Split-Screen Setup: Left pane for Leaflet.js Interactive Map, Right pane for AI Chat Window.
- Navigation sidebar (New Chat, Chat History, Settings).
- Initial map data visualization placeholders (Rendering dummy TIFFs).

## 📝 PHASE 3: CORE OPERATIONS (Data & Prompting)
*Mapping CRUD operations to our specific Agentic AI and GIS data needs.*
- **Create:** Implement Drag-and-Drop Uploader for Single Images, Bi-temporal pairs, and Optical-SAR pairs.
- **Process:** Sending multipart data + Text Queries to FastAPI & LangChain router.
- **Read:** Displaying the AI's textual answer and drawing spatial masks/bounding boxes on the Leaflet map.
- **Update/Delete:** Clearing chat sessions, removing uploaded heavy TIFF files to free up memory.

## ⚙️ PHASE 4: ADDITIONAL FEATURES
*The 'Wow Factor' capabilities and business logic.*
- **Auditable Execution Trace:** A dropdown/alert showing the exact LangChain tools used (e.g., "Tool: VQA, Confidence: 89%").
- **File Download/Reports:** Exporting the current chat session and highlighted map as a PDF Report.
- **Settings/Preferences:** Allowing users to adjust mask opacity/colors on the map.

## 🛡️ PHASE 5: TESTING & QUALITY ASSURANCE 
*Ensuring the AI models meet ISRO's evaluation criteria before live demo.*
- **Unit Testing:** Validating that LangChain correctly routes "Highlight" prompts to the Grounding model and "Change" prompts to the Temporal model.
- **Integration Testing:** Ensuring React successfully receives and parses the coordinates from FastAPI.
- **Accuracy Testing:** Running the application against the `VRSBench` and `CDVQA` benchmarking datasets as mandated by ISRO.

## 🚀 PHASE 6: DEPLOYMENT & OPERATION
*Taking the system live for the final Judges' review.*
- **Frontend Deployment:** Deploying the React (Vite) application on Vercel/Netlify for fast edge-hosting.
- **Backend Deployment:** Deploying the FastAPI + Model weights on a GPU cloud instance (AWS EC2 / RunPod / GCP).
- **Final Checks:** Latency monitoring and bug fixes for the live web presentation.
