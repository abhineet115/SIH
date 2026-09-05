import time
from pathlib import Path
from typing import Dict, Any, List, Optional

from app.preprocessing.geotiff import GeoTIFFProcessor
from app.preprocessing.modality import ModalityClassifier
from app.preprocessing.registration import SpatialRegistrationValidator
from app.agents.classifier import AgentClassifier
from app.models.vqa_engine import VQAEngine
from app.models.grounding_engine import GroundingEngine
from app.models.change_engine import ChangeDetectionEngine
from app.models.optical_sar_engine import OpticalSARFusionEngine
from app.fusion.confidence import CompositeConfidenceEngine

class AgenticController:
    """
    Core Agentic Orchestrator for SatQuery AI.
    Executes the dynamic multi-step decision cycle:
    Preprocess -> Inspect -> Align -> Plan -> Execute Specialist -> Fuse Evidence -> Trace
    """

    @staticmethod
    def process_query(
        primary_path: str | Path,
        secondary_path: Optional[str | Path] = None,
        query: str = "Analyze this remote sensing scene"
    ) -> Dict[str, Any]:
        trace: List[Dict[str, Any]] = []
        start_time = time.time()

        # Step 1: Preprocess & Extract Metadata for Primary Image
        step1_start = time.time()
        primary_meta = GeoTIFFProcessor.inspect(primary_path)
        primary_modality = ModalityClassifier.classify(primary_meta)
        primary_meta["modality_info"] = primary_modality
        step1_dur = round((time.time() - step1_start) * 1000, 1)

        trace.append({
            "step": 1,
            "action": "Raster Ingestion & Metadata Parsing",
            "tool": "GeoTIFFProcessor",
            "status": "COMPLETED",
            "latency_ms": step1_dur,
            "details": f"Ingested {primary_meta['filename']} ({primary_meta['width']}x{primary_meta['height']}, {primary_meta['bands']} bands). Detected {primary_modality['modality']}."
        })

        # Step 2: Handle Secondary Image if present & Co-Registration
        secondary_meta = None
        secondary_modality = None
        reg_info = None

        if secondary_path and Path(secondary_path).exists():
            step2_start = time.time()
            secondary_meta = GeoTIFFProcessor.inspect(secondary_path)
            secondary_modality = ModalityClassifier.classify(secondary_meta)
            secondary_meta["modality_info"] = secondary_modality

            reg_info = SpatialRegistrationValidator.validate_pair(primary_meta, secondary_meta)
            step2_dur = round((time.time() - step2_start) * 1000, 1)

            trace.append({
                "step": 2,
                "action": "Spatial Co-Registration & Alignment Validation",
                "tool": "SpatialRegistrationValidator",
                "status": "COMPLETED" if reg_info["is_aligned"] else "WARNING",
                "latency_ms": step2_dur,
                "details": f"Spatial overlap IoU: {reg_info['iou_percentage']}%. CRS match: {reg_info['crs_match']}. {reg_info['status_message']}"
            })

        # Step 3: Intent Classification & Dynamic DAG Planning
        step3_start = time.time()
        modalities = [primary_modality["modality"]]
        if secondary_modality:
            modalities.append(secondary_modality["modality"])

        image_count = 2 if secondary_path else 1
        intent_decision = AgentClassifier.classify_intent(query, image_count, modalities)
        intent = intent_decision["intent"]
        step3_dur = round((time.time() - step3_start) * 1000, 1)

        trace.append({
            "step": 3 if secondary_path else 2,
            "action": "Agentic Query Classification & Tool Routing",
            "tool": "AgentClassifier",
            "status": "COMPLETED",
            "latency_ms": step3_dur,
            "details": f"Routed to '{intent}' workflow. Reasoning: {intent_decision['reasoning']}"
        })

        # Step 4: Dispatch Specialist Model
        step4_start = time.time()
        result_payload: Dict[str, Any] = {}
        specialist_name = ""

        if intent == "OPTICAL_SAR_FUSION":
            specialist_name = "OpticalSARFusionEngine"
            result_payload = OpticalSARFusionEngine.fuse_analysis(
                primary_path, secondary_path or primary_path, query, reg_info or {}
            )
        elif intent == "CHANGE_DETECTION":
            specialist_name = "ChangeDetectionEngine"
            result_payload = ChangeDetectionEngine.detect_change(
                primary_path, secondary_path or primary_path, query, reg_info or {}
            )
        elif intent == "GROUNDING":
            specialist_name = "GroundingEngine"
            result_payload = GroundingEngine.ground_entities(
                primary_path, query, primary_meta
            )
            # Add descriptive answer for UI
            result_payload["answer"] = f"Visual Grounding Specialist localized {result_payload['count']} spatial feature instance(s) matching '{query}'. Coordinates and bounding masks have been plotted on the GIS canvas."
        else:  # VQA or CAPTION
            specialist_name = "VQAEngine"
            result_payload = VQAEngine.answer_query(
                primary_path, query, primary_meta
            )

        step4_dur = round((time.time() - step4_start) * 1000, 1)
        trace.append({
            "step": len(trace) + 1,
            "action": f"Specialist Model Execution ({specialist_name})",
            "tool": specialist_name,
            "status": "COMPLETED",
            "latency_ms": step4_dur,
            "details": f"Executed inference for query: '{query}'. Generated structured spatial findings."
        })

        # Step 5: Multi-Signal Composite Confidence
        step5_start = time.time()
        confidence_result = CompositeConfidenceEngine.calculate(
            model_conf=result_payload.get("confidence", 0.92),
            modality_info=primary_modality,
            reg_info=reg_info,
            gsd_meters=primary_meta.get("gsd_meters", 10.0)
        )
        step5_dur = round((time.time() - step5_start) * 1000, 1)

        trace.append({
            "step": len(trace) + 1,
            "action": "Evidence Fusion & 4-Signal Confidence Rating",
            "tool": "CompositeConfidenceEngine",
            "status": "COMPLETED",
            "latency_ms": step5_dur,
            "details": f"Final Composite Confidence: {confidence_result['composite_score']}% ({confidence_result['rating']})."
        })

        total_latency_ms = round((time.time() - start_time) * 1000, 1)

        # Assemble unified response contract
        return {
            "query": query,
            "intent": intent,
            "specialist": specialist_name,
            "answer": result_payload.get("answer", ""),
            "key_findings": result_payload.get("key_findings", []),
            "bounding_boxes": result_payload.get("bounding_boxes", []),
            "change_polygons": result_payload.get("change_polygons", []),
            "fusion_layers": result_payload.get("fusion_layers", []),
            "land_cover_distribution": result_payload.get("land_cover_distribution", {}),
            "built_up_change_pct": result_payload.get("built_up_change_pct"),
            "vegetation_change_pct": result_payload.get("vegetation_change_pct"),
            "confidence": confidence_result,
            "primary_metadata": primary_meta,
            "secondary_metadata": secondary_meta,
            "registration": reg_info,
            "execution_trace": trace,
            "total_latency_ms": total_latency_ms
        }
