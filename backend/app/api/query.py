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
            query=req.query
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
