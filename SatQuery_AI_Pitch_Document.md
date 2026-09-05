# SatQuery AI (SIH 26167) - Project Proposal & Requirement Document
*(Use this document to prepare your Hackathon Idea PPT/Submission)*

## 1. The Product Concept (Aakhir Banana Kya Hai?)
Humein ek **Agentic Vision-Language Web Application** banani hai. Aasaan bhasha me: **"ChatGPT for ISRO Satellite Maps"**. 
Ek aisi website jahan ek user (kisan, army officer, ya city planner) aakar apne ilaqe (area) ki satellite photo upload karega, aur text me chat karega. AI photo ko scan karke usko answer dega. 

**Khas Baat (Agentic AI):** Ye ek single AI nahi hai. Ye ek "Manager AI" hai jiske under multiple chote "Specialist AI" kaam karte hain. User ke sawal ke hisab se Manager decide karega ki kaunse specialist se kaam karwana hai.

## 2. Core Features (Kya-Kya Add Karna Hai?)
Tumhari Web App me ye 5 mandatory features hone hi chahiye (kyuki ISRO ne manga hai):

1. **Multi-Format Image Uploader:** 
   * Normal PNG/JPEG aur GeoTIFF upload karne ka option.
2. **Single Image QA (Question Answering):**
   * *User:* "Is photo me kya dikh raha hai?"
   * *AI:* "Yahan 40% jangal hai aur ek badi nadi (river) hai."
3. **Text-Guided Grounding (Highlighting):**
   * *User:* "Nadi (River) kahan hai, highlight karo."
   * *AI:* Map ke upar nadi wale area me ek transparent Red color ka mask draw kar dega.
4. **Bi-Temporal Change Detection (Do alag dates ki photo):**
   * User do (2) photo dalega (Eg: 2020 aur 2024 ki ek hi jagah ki photo).
   * *User:* "Kya change aaya in 4 saalo me?"
   * *AI:* "Nadi sookh gayi hai aur 10 nayi buildings ban gayi hain."
5. **Optical + SAR Fusion Analysis:**
   * User ek normal photo aur ek radar (SAR) photo dalega. AI dono ko milakar batayega ki zameen ke andar kitni nami (moisture) hai ya baadal (clouds) ke peeche kya hai.

## 3. The Tech Stack & Requirements (Zarurat Kya Hai?)

### A. Frontend (User Interface)
*   **Framework:** React (Vite) for fast Single Page Application mapping.
*   **Styling:** Tailwind CSS + Glassmorphism UI (Premium, AAA-level feel ke liye).
*   **Map Viewer:** Leaflet.js ya OpenLayers (Taki uploaded GeoTIFF map par zoom-in/pan kiya ja sake aur us par bounding boxes/masks draw ho sakein).

### B. Backend (Agentic AI Controller)
*   **Framework:** Python + FastAPI 
*   **Routing Logic:** LangChain (Ye decision lega ki user input par konsa model apply karna hai).

### C. Artificial Intelligence (The Brains)
*   *Note: Hum OpenAI/Claude use nahi kar sakte kyuki ISRO ne "Remote-sensing adapted" manga hai.*
*   **Base VLM (Vision Model):** LLaVA, Qwen-VL, ya PaliGemma.
*   **Datasets for Fine-Tuning (Mandatory):** 
    * `BigEarthNet.txt` (Main training ke liye).
    * `VRSBench` & `RSVQA` (Single-image training ke liye).
    * `CDVQA` (Do photos compare karne ki training ke liye).

## 4. The Workflow (App Kaam Kaise Karegi?)
1. **User Input:** User ek khet (Farm) ki satellite photo upload karta hai aur likhta hai -> *"Highlight the water streams."*
2. **Agentic Controller (LangChain):** Backend samajh jata hai ki user ko "Highlight" chahiye (Yani Grounding task). 
3. **Tool Selection:** API baaki models ko ignore karke sirf "Text-Guided Grounding Model" ko photo aur text bhejti hai.
4. **Processing & Output:** Model answer return karta hai coordinates ke form me.
5. **Execution Trace:** Frontend par ek message pop hoga: `[Action: Grounding Selected] -> [Confidence: 94%]`
6. **Final UI Display:** Next.js us bounding box/mask ko map par draw kar dega aur user ko clearly streams highlighted dikhengi.

## 5. The "Pitch" (Judges Ko Kaise Impress Karein?)
Apne PPT aur presentation me in points par zor dena:
> *"Sir, hamara AI ek 'Monolith' (single heavy model) nahi hai. Hamne Agentic Architecture use kiya hai. Iska faida ye hai ki humara AI sasta hai, fast hai, aur scale ho sakta hai. Agar kal ko ISRO ek naya model add karna chahe, to hamein pura system change nahi karna, humein bas apne LangChain registry me ek naya 'Tool' add karna hai!"*
