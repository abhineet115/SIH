import os
import json
from typing import Dict, Any, List, Optional
from app.config import GEMINI_API_KEY, GEMINI_MODEL

class AgentClassifier:
    """
    True Agentic Intent Classifier:
    Uses an LLM (Gemini) to evaluate natural-language query semantics,
    input image count, and sensor modalities to route requests to the optimal specialist workflow.
    Falls back to smart local heuristics if no API key is provided or offline.
    """

    @staticmethod
    def classify_intent(
        query: str,
        image_count: int = 1,
        modalities: List[str] | None = None,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None
    ) -> Dict[str, Any]:
        modalities = modalities or ["OPTICAL"]

        # Attempt to use true LLM Agentic routing first
        active_key = api_key or os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY
        if active_key and active_key.strip():
            try:
                llm_decision = AgentClassifier._llm_classify(
                    query, image_count, modalities, active_key.strip(), model_name
                )
                if llm_decision:
                    return llm_decision
            except Exception as e:
                print(f"[AgentClassifier] LLM routing failed, falling back to heuristic: {e}")
        
        q_lower = query.lower().strip()

        has_sar = "SAR" in modalities
        has_optical = "OPTICAL" in modalities or "MULTISPECTRAL" in modalities

        # 1. Dual Image: Optical + SAR Fusion
        if image_count >= 2 and (has_sar and has_optical or any(w in q_lower for w in ["sar", "radar", "backscatter", "microwave", "fuse", "fusion"])):
            return {
                "intent": "OPTICAL_SAR_FUSION",
                "confidence": 0.98,
                "reasoning": "Dual-sensor payload (Optical + SAR) detected. Routed to Cross-Sensor Fusion Specialist for radar-dielectric and spectral correlation."
            }

        # 2. Dual Image: Bi-temporal Change Detection
        if image_count >= 2 or any(w in q_lower for w in ["change", "changes", "difference", "delta", "expansion", "growth", "shrink", "before and after", "2022", "2024", "temporal", "urban sprawl", "deforestation"]):
            return {
                "intent": "CHANGE_DETECTION",
                "confidence": 0.97,
                "reasoning": "Temporal comparison keywords or bi-temporal raster pair provided. Routed to Bi-Temporal Change Specialist for delta clustering and area quantification."
            }

        # 3. Grounding / Localization (Bounding Boxes)
        grounding_triggers = [
            "highlight", "detect", "locate", "bound", "box", "show me all",
            "find the", "mark", "segment", "pinpoint", "where is", "where are",
            "runway", "airplane", "aircraft", "water body", "river", "bridge"
        ]
        if any(w in q_lower for w in grounding_triggers) and not any(w in q_lower for w in ["dominant", "summarize", "caption"]):
            return {
                "intent": "GROUNDING",
                "confidence": 0.95,
                "reasoning": "Spatial entity localization requested. Routed to Open-Vocabulary Visual Grounding Specialist to generate normalized coordinates and vector overlays."
            }

        # 4. Scene Captioning
        caption_triggers = ["caption", "describe scene", "overview", "detailed description", "summarize image"]
        if any(w in q_lower for w in caption_triggers):
            return {
                "intent": "CAPTION",
                "confidence": 0.93,
                "reasoning": "Global scene understanding requested. Routed to Remote Sensing Scene Captioning Specialist."
            }

        # 5. Default: Single Image VQA
        return {
            "intent": "VQA",
            "confidence": 0.92,
            "reasoning": "Natural language inquiry regarding scene properties, counts, or categorization. Routed to Remote Sensing VLM Specialist."
        }

    @staticmethod
    def _llm_classify(query: str, image_count: int, modalities: List[str], api_key: str, model_name: Optional[str]) -> Optional[Dict[str, Any]]:
        import google.generativeai as genai
        active_model = model_name or os.getenv("GEMINI_MODEL") or GEMINI_MODEL or "gemini-2.5-flash"
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(active_model)
        
        prompt = f"""
You are an expert Agentic Router for a Remote Sensing AI platform.
Analyze the user's query and the available image parameters, and decide which specialist engine should handle the request.

User Query: "{query}"
Number of Satellite Images Provided: {image_count}
Available Sensor Modalities: {modalities}

Available Intents:
1. OPTICAL_SAR_FUSION: Used if the user explicitly asks to combine/fuse Optical and SAR data. Only valid if image count is >= 2.
2. CHANGE_DETECTION: Used if the user asks about temporal changes, "before and after", growth, delta, or differences. Only valid if image count is >= 2.
3. GROUNDING: Used if the user asks to "highlight", "detect", "locate", "bound", "pinpoint" specific entities or draw bounding boxes.
4. CAPTION: Used if the user asks for a general scene description, overview, or caption.
5. VQA: Used for general questions (counts, condition, what is in the image) that don't fit above.

Return ONLY a valid JSON object with the following structure:
{{
    "intent": "INTENT_NAME_HERE",
    "confidence": 0.98,
    "reasoning": "A 1-sentence technical explanation of why you routed to this specialist based on the query semantics."
}}
"""
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json", "temperature": 0.1}
        )
        if response and response.text:
            data = json.loads(response.text)
            if "intent" in data and "reasoning" in data:
                # Add a marker so we know it was LLM routed
                data["reasoning"] = f"[LLM Routed] {data['reasoning']}"
                if "confidence" not in data:
                    data["confidence"] = 0.95
                return data
        return None
