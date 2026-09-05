import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import UPLOADS_DIR
from app.preprocessing.geotiff import GeoTIFFProcessor
from app.preprocessing.modality import ModalityClassifier

router = APIRouter(prefix="/api", tags=["Upload"])

@router.post("/upload")
async def upload_raster(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty filename provided")

    dest_path = UPLOADS_DIR / file.filename
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        metadata = GeoTIFFProcessor.inspect(dest_path)
        modality_info = ModalityClassifier.classify(metadata)
        metadata["modality_info"] = modality_info
        
        _, preview_b64 = GeoTIFFProcessor.get_web_preview(dest_path)
        metadata["preview_b64"] = preview_b64

        return {
            "success": True,
            "filename": file.filename,
            "file_path": str(dest_path),
            "metadata": metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process raster: {str(e)}")
