import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.agents.controller import AgenticController
from app.reports.pdf_generator import PDFReportGenerator
from app.config import SAMPLES_DIR, REPORTS_DIR

def run_tests():
    print("--- 1. Testing Grounding on Airport Image ---")
    airport_img = SAMPLES_DIR / "airport_optical.tif"
    res1 = AgenticController.process_query(
        primary_path=airport_img,
        query="Highlight runway corridors and commercial aircraft"
    )
    assert res1["intent"] == "GROUNDING", f"Expected GROUNDING, got {res1['intent']}"
    assert len(res1["bounding_boxes"]) > 0, "No bounding boxes generated"
    print(f"Passed! Intent: {res1['intent']}, Boxes: {len(res1['bounding_boxes'])}, Latency: {res1['total_latency_ms']}ms")

    print("\n--- 2. Testing Bi-Temporal Change Detection ---")
    delhi_2022 = SAMPLES_DIR / "delhi_optical_2022.tif"
    delhi_2024 = SAMPLES_DIR / "delhi_optical_2024.tif"
    res2 = AgenticController.process_query(
        primary_path=delhi_2022,
        secondary_path=delhi_2024,
        query="Detect urban expansion and land use change between 2022 and 2024"
    )
    assert res2["intent"] == "CHANGE_DETECTION", f"Expected CHANGE_DETECTION, got {res2['intent']}"
    assert len(res2["change_polygons"]) > 0, "No change polygons"
    print(f"Passed! Intent: {res2['intent']}, Built-up Change: +{res2['built_up_change_pct']}%, Polygons: {len(res2['change_polygons'])}")

    print("\n--- 3. Testing Optical + SAR Cross-Sensor Fusion ---")
    delhi_sar = SAMPLES_DIR / "delhi_sar_2024.tif"
    res3 = AgenticController.process_query(
        primary_path=delhi_2024,
        secondary_path=delhi_sar,
        query="Fuse optical and SAR radar backscatter to verify urban masonry"
    )
    assert res3["intent"] == "OPTICAL_SAR_FUSION", f"Expected OPTICAL_SAR_FUSION, got {res3['intent']}"
    assert len(res3["fusion_layers"]) > 0, "No fusion layers"
    print(f"Passed! Intent: {res3['intent']}, Fusion layers: {len(res3['fusion_layers'])}, Composite Conf: {res3['confidence']['composite_score']}%")

    print("\n--- 4. Testing PDF Report Generation ---")
    pdf_out = REPORTS_DIR / "test_report.pdf"
    gen_path = PDFReportGenerator.generate(res2, pdf_out)
    assert Path(gen_path).exists(), "PDF report not found"
    print(f"Passed! PDF generated at: {gen_path}, size: {Path(gen_path).stat().st_size} bytes")

    print("\n>>> ALL BACKEND SPECIALIST MODULES PASSED WITH 100% SUCCESS! <<<")

if __name__ == "__main__":
    run_tests()
