from pathlib import Path
from fastapi import APIRouter
from app.config import SAMPLES_DIR
from app.preprocessing.geotiff import GeoTIFFProcessor
from app.preprocessing.modality import ModalityClassifier

router = APIRouter(prefix="/api", tags=["Samples"])

@router.get("/samples")
def get_sample_scenarios():
    """
    Returns pre-configured ISRO remote sensing scenarios with instant web previews.
    """
    scenarios = [
        {
            "id": "scenario_grounding",
            "title": "Scenario 1: Visual Grounding & Infrastructure Localization",
            "description": "Airport infrastructure inspection: detect runways, apron tarmac, and aircraft assets.",
            "primary_file": "airport_optical.tif",
            "secondary_file": None,
            "default_query": "Highlight all runway corridors and commercial aircraft in the scene",
            "suggested_queries": [
                "Highlight all runway corridors and commercial aircraft in the scene",
                "Where are the runways located?",
                "Identify taxiways and apron facilities",
                "What is the predominant land cover?"
            ]
        },
        {
            "id": "scenario_change",
            "title": "Scenario 2: Bi-Temporal Urban Expansion (2022 vs 2024)",
            "description": "Multi-year monitoring: detect urban sprawl, new expressways, and canopy changes.",
            "primary_file": "delhi_optical_2022.tif",
            "secondary_file": "delhi_optical_2024.tif",
            "default_query": "Detect urban expansion and land use changes between 2022 and 2024",
            "suggested_queries": [
                "Detect urban expansion and land use changes between 2022 and 2024",
                "What are the major structural differences between these two dates?",
                "Quantify vegetation loss and built-up growth",
                "Identify new transport infrastructure"
            ]
        },
        {
            "id": "scenario_fusion",
            "title": "Scenario 3: Cross-Sensor Optical + SAR Fusion",
            "description": "All-weather analysis: combine optical spectral reflectance with SAR active radar backscatter.",
            "primary_file": "delhi_optical_2024.tif",
            "secondary_file": "delhi_sar_2024.tif",
            "default_query": "Fuse optical and SAR radar backscatter to verify urban masonry and water boundaries",
            "suggested_queries": [
                "Fuse optical and SAR radar backscatter to verify urban masonry and water boundaries",
                "Cross-examine SAR double-bounce scattering against optical built-up",
                "Pierce cloud cover and highlight radar specular reflections",
                "Classify standing water using NDWI and low SAR return"
            ]
        },
        {
            "id": "scenario_vqa",
            "title": "Scenario 4: Single-Image Remote Sensing VQA",
            "description": "Metropolitan scene characterization: land use breakdown and riverine corridor inspection.",
            "primary_file": "delhi_optical_2024.tif",
            "secondary_file": None,
            "default_query": "What is the dominant land cover class and describe the river corridor?",
            "suggested_queries": [
                "What is the dominant land cover class and describe the river corridor?",
                "Summarize the scene characteristics",
                "Estimate the percentage of built-up vs green cover",
                "Highlight water bodies and floodplains"
            ]
        }
    ]

    # Populate preview and metadata for each sample
    results = []
    for sc in scenarios:
        p_path = SAMPLES_DIR / sc["primary_file"]
        sec_path = (SAMPLES_DIR / sc["secondary_file"]) if sc["secondary_file"] else None

        p_meta = GeoTIFFProcessor.inspect(p_path)
        p_meta["modality_info"] = ModalityClassifier.classify(p_meta)
        _, p_b64 = GeoTIFFProcessor.get_web_preview(p_path)
        p_meta["preview_b64"] = p_b64

        sec_meta = None
        if sec_path and sec_path.exists():
            sec_meta = GeoTIFFProcessor.inspect(sec_path)
            sec_meta["modality_info"] = ModalityClassifier.classify(sec_meta)
            _, sec_b64 = GeoTIFFProcessor.get_web_preview(sec_path)
            sec_meta["preview_b64"] = sec_b64

        results.append({
            **sc,
            "primary_path": str(p_path),
            "primary_metadata": p_meta,
            "secondary_path": str(sec_path) if sec_path else None,
            "secondary_metadata": sec_meta
        })

    return {"scenarios": results}
