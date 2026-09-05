from typing import Dict, Any, List

class AgentClassifier:
    """
    Agentic Intent Classifier:
    Examines natural-language query semantics, input image count,
    and sensor modalities to route requests to the optimal specialist workflow.
    """

    @staticmethod
    def classify_intent(
        query: str,
        image_count: int = 1,
        modalities: List[str] | None = None
    ) -> Dict[str, Any]:
        q_lower = query.lower().strip()
        modalities = modalities or ["OPTICAL"]

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
