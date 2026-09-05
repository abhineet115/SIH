# design.md - UI/UX & Visual Design System
**Project:** SatQuery AI (SIH26167)
*UI/UX guidelines and visual design system for the application.*

---

## 🖥️ 1. UI/UX (Layout & Experience)
- **Clean and Intuitive Interface:** A split-screen layout desktop application. The Left pane focuses on a full-bleed interactive map; the Right pane acts as a sidebar for the AI Chat interface.
- **Consistent User Experience:** Floating action buttons and consistent padding across all panels.
- **Mobile-Responsive Approach:** The map and chat will stack vertically on mobile screens. We prioritize desktop since GIS data analysis is predominantly done on large screens.
- **Easy Navigation & Accessibility:** High contrast between text and background map elements for readability.
- **Component Reuse:** Using highly reusable styled components (e.g., standardizing the message bubbles and upload drag-and-drop zones).

## 🎨 2. COLOR & THEME 
**Design Language:** *Premium "Space / Cyber" Dark Mode (Glassmorphism)*

- **Primary Colors:** 
  - `ISRO Deep Blue:` #0A1128
  - `Neon Cyan (Accent):` #00F0FF (Used for AI buttons, glowing active UI elements).
- **Background & Surface Colors:**
  - `Main Dashboard Background:` #050814 (Very dark navy/black).
  - `Glass Panels/Cards:` rgba(255, 255, 255, 0.05) with 10px Backdrop Blur.
- **Text Colors:**
  - `Primary Text:` #E0E4F0 (Off-white for minimal eye strain).
  - `Secondary Text:` #8B949E (Muted grey).
- **Status Colors:**
  - `Success (Model Executed):` #4ADE80 (Neon Green)
  - `Warning (Confidence < 70%):` #FBBF24 (Amber)
  - `Error (Processing Fail):` #F87171 (Red)
- **Light & Dark Theme:** Strictly Dark Mode optimized due to the nature of analyzing bright remote-sensing imagery and reducing screen glare.

## 🔤 3. FONTS & TYPOGRAPHY
- **Primary Font Family:** `Inter, sans-serif` (Clean, highly legible for chat and technical data).
- **Heading Styles (H1, H2, H3):**
  - **H1:** Space Grotesk (For main branding 'SatQuery AI').
- **Body Text Styles:** Inter, spacing optimized for reading lengthy AI responses.
- **Font Sizes & Line Heights:**
  - **Base size:** 16px.
  - **Line height:** 1.6 (to make multi-line chat bubbles highly readable).
- **Font Weights:**
  - Regular (400) for general chat.
  - Medium (500) for system messages.
  - Bold (700)/SemiBold (600) for Panel Titles & Tools executed.

## 🧠 4. MEMORY (UI PREFERENCES)
- **Remember User Preferences:** Store last viewed map coordinates (Lat/Long) in `localStorage` so the user doesn't lose their place on refresh.
- **Theme Mode:** Default locked to Dark Mode.
- **Language Preference:** Default English. Future support for Hindi (vernacular).
- **Sidebar Layout State:** Remembering if the AI Chat sidebar is expanded or collapsed.
