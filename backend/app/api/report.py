import uuid
from typing import Dict, Any
from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.config import REPORTS_DIR
from app.reports.pdf_generator import PDFReportGenerator

router = APIRouter(prefix="/api", tags=["Reports"])

class ExportRequest(BaseModel):
    analysis_data: Dict[str, Any]

@router.post("/report/pdf")
def generate_pdf_report(req: ExportRequest):
    try:
        report_id = str(uuid.uuid4())[:8]
        filename = f"SatQuery_Mission_Report_{report_id}.pdf"
        output_path = REPORTS_DIR / filename

        PDFReportGenerator.generate(req.analysis_data, output_path)

        return {
            "success": True,
            "filename": filename,
            "download_url": f"/api/report/download/{filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@router.get("/report/download/{filename}")
def download_pdf(filename: str):
    file_path = REPORTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report file not found")

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename
    )
