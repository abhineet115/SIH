import json
from typing import Optional
from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.agents.controller import AgenticController
from app.db.database import get_db
from app.db.models import Analysis, Image, ExecutionTrace, Evidence

router = APIRouter(prefix="/api", tags=["Query"])

class QueryRequest(BaseModel):
    query: str
    primary_path: str
    secondary_path: Optional[str] = None
    explanation_mode: Optional[str] = "simple"
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None

class GeminiCheckRequest(BaseModel):
    api_key: Optional[str] = None
    model_name: Optional[str] = None

@router.get("/gemini/status")
def get_gemini_status():
    from app.config import GEMINI_API_KEY, GEMINI_MODEL
    has_key = bool(GEMINI_API_KEY and GEMINI_API_KEY.strip())
    return {
        "configured": has_key,
        "default_model": GEMINI_MODEL or "gemini-2.5-flash",
        "masked_key": f"{GEMINI_API_KEY[:4]}...{GEMINI_API_KEY[-4:]}" if has_key and len(GEMINI_API_KEY) > 8 else ("Configured" if has_key else "Not Configured"),
        "features": [
            "Plain-English Remote Sensing Summaries",
            "Real-World Impact Breakdown",
            "Actionable Recommendations",
            "Dynamic Follow-Up Questions"
        ]
    }

@router.post("/gemini/test")
def test_gemini_key(req: GeminiCheckRequest):
    import os
    import requests
    from app.config import GEMINI_API_KEY, GEMINI_MODEL

    key = req.api_key or os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY
    if not key or not key.strip():
        return {
            "valid": False,
            "message": "No API key provided. Using Smart Local Synthesizer."
        }

    model = req.model_name or os.getenv("GEMINI_MODEL") or GEMINI_MODEL or "gemini-2.5-flash"
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key.strip()}"
        payload = {
            "contents": [{"parts": [{"text": "Reply with 'OK'."}]}]
        }
        r = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=8)
        if r.status_code == 200:
            return {
                "valid": True,
                "model": model,
                "message": f"Successfully connected to Google Gemini ({model})!"
            }
        else:
            return {
                "valid": False,
                "status_code": r.status_code,
                "message": f"Gemini error: {r.text[:200]}"
            }
    except Exception as e:
        return {
            "valid": False,
            "message": f"Connection test failed: {str(e)}"
        }

@router.post("/query")
def execute_query(req: QueryRequest, db: Session = Depends(get_db)):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty")
    if not req.primary_path:
        raise HTTPException(status_code=400, detail="primary_path is required")

    try:
        result = AgenticController.process_query(
            primary_path=req.primary_path,
            secondary_path=req.secondary_path,
            query=req.query,
            explanation_mode=req.explanation_mode or "simple",
            gemini_api_key=req.gemini_api_key,
            gemini_model=req.gemini_model
        )

        # Persist analysis to Database
        try:
            analysis_rec = Analysis(
                query=req.query,
                task=result.get("intent", "VQA"),
                confidence=result.get("confidence", {}).get("composite_score", 0.0),
                final_answer=result.get("answer", "")
            )
            db.add(analysis_rec)
            db.flush()  # populate analysis_rec.id

            # Save primary image
            p_meta = result.get("primary_metadata", {})
            db.add(Image(
                analysis_id=analysis_rec.id,
                filename=p_meta.get("filename", Path(req.primary_path).name),
                modality=p_meta.get("modality_info", {}).get("modality", "OPTICAL"),
                crs=p_meta.get("crs", "EPSG:32643"),
                resolution=f"{p_meta.get('gsd_meters', 10.0)}m"
            ))

            # Save secondary image if exists
            if req.secondary_path and result.get("secondary_metadata"):
                s_meta = result.get("secondary_metadata", {})
                db.add(Image(
                    analysis_id=analysis_rec.id,
                    filename=s_meta.get("filename", Path(req.secondary_path).name),
                    modality=s_meta.get("modality_info", {}).get("modality", "SAR"),
                    crs=s_meta.get("crs", "EPSG:32643"),
                    resolution=f"{s_meta.get('gsd_meters', 10.0)}m"
                ))

            # Save execution trace
            for step in result.get("execution_trace", []):
                db.add(ExecutionTrace(
                    analysis_id=analysis_rec.id,
                    step_number=step.get("step", 1),
                    tool_name=step.get("tool", ""),
                    status=step.get("status", "COMPLETED"),
                    latency_ms=step.get("latency_ms", 0.0),
                    details=step.get("details", "")
                ))

            # Save evidence (bounding boxes, change polygons, fusion layers)
            for b in result.get("bounding_boxes", []):
                db.add(Evidence(
                    analysis_id=analysis_rec.id,
                    type="bounding_box",
                    data=json.dumps(b),
                    confidence=b.get("confidence", 0.9)
                ))

            for cp in result.get("change_polygons", []):
                db.add(Evidence(
                    analysis_id=analysis_rec.id,
                    type="change_polygon",
                    data=json.dumps(cp),
                    confidence=cp.get("confidence", 0.9)
                ))

            for fl in result.get("fusion_layers", []):
                db.add(Evidence(
                    analysis_id=analysis_rec.id,
                    type="fusion_layer",
                    data=json.dumps(fl),
                    confidence=fl.get("confidence", 0.9)
                ))

            db.commit()
            result["analysis_id"] = analysis_rec.id
        except Exception as db_err:
            db.rollback()
            print(f"[DB Warning] Could not persist analysis: {db_err}")

        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agentic analysis error: {str(e)}")
