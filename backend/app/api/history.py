import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Analysis, ExecutionTrace, Evidence, Image

router = APIRouter(prefix="/api", tags=["History"])

@router.get("/analyses")
def get_analysis_history(limit: int = 20, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns persistent analysis history stored in the database.
    """
    records = (
        db.query(Analysis)
        .order_by(Analysis.created_at.desc())
        .limit(limit)
        .all()
    )

    history = []
    for r in records:
        traces = [
            {
                "step": t.step_number,
                "tool": t.tool_name,
                "latency_ms": t.latency_ms,
                "status": t.status,
                "details": t.details,
            }
            for t in r.traces
        ]

        images = [
            {
                "filename": img.filename,
                "modality": img.modality,
                "crs": img.crs,
                "resolution": img.resolution,
            }
            for img in r.images
        ]

        history.append({
            "id": r.id,
            "query": r.query,
            "task": r.task,
            "confidence": r.confidence,
            "final_answer": r.final_answer,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "images": images,
            "execution_trace": traces,
        })

    return {"total": len(history), "analyses": history}
