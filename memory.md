# memory.md - Project Memory & Progress
**Project:** SatQuery AI (SIH26167)
*Project memory to keep track of progress, decisions, and current work.*

---

## 🧠 1. MEMORY (Context & Decisions)
- **Key Decision 1:** Locked project `SIH26167` (Agentic Vision-Language Assistant for ISRO). Chosen over Drone 3D mapping due to extremely high hardware compile risks and better alignment with our UI/SaaS skills.
- **Key Decision 2:** Discarded Next.js in favor of **React (Vite)** for the frontend framework due to preference for a purely static, highly responsive client-side Split-Screen MAP SPA.
- **Key Decision 3:** Architecture relies strictly on LangChain as an Agentic router so we comply completely with ISRO's "non-generic LLM" rule.
- **Project Structure:** Monorepo separated into `/frontend` (Vite) and `/backend` (FastAPI).

## 📋 2. WHAT HAPPENED (Activity Log)
- **Log 01:** Analyzed SIH Excel sheet and filtered out all 230+ projects.
- **Log 02:** Debated between PS 175, 127, 167, 158. Concluded that 167 gives the highest win-probability for our specific React/UI strengths.
- **Log 03:** Built foundational hacking documents:
  - Created `SatQuery_AI_Pitch_Document.md`
  - Created `SatQuery_AI_PRD.md`
  - Created `architecture.md` (Updated to React 18)
  - Created `phases.doc.md`
  - Created `design.md`

## ⚙️ 3. CURRENTLY WORKING
- **Feature/Task in progress:** Finalizing the foundational text/markdown planning phase. 
- **Current module:** Project Blueprinting (`c:\SIH\` workspace).
- **What's Next:** 
  1. Bootstrapping the `satquery-ai-workspace`.
  2. Initializing `vite create react-app` for the frontend UI.
  3. Setting up `FastAPI` boilerplate for the backend.

## 🔄 4. UPDATES
*Note: This file must be updated regularly.*
- **Last Update Status:** Planning phase completed successfully. All PRD, Architecture, and Design artifacts are up to date and approved by the User. Information is 100% accurate regarding ISRO's official problem statement text.

## 🎯 5. PURPOSE
- **Context Maintenance:** Ensures the AI agent and the human developer can instantly resume work after any breaks.
- **Goal Checking:** Prevents "scope creep" by reminding the team that the goal is a 36-hour hackathon-winnable MVP.
- Ensure nothing important (like Fine-tuning on BigEarthNet) is forgotten during development sprints.
