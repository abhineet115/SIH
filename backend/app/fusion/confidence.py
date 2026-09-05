from typing import Dict, Any

class CompositeConfidenceEngine:
    """
    Computes a 4-signal composite confidence metric:
    - C_model: Specialist model inference certainty
    - C_sensor: Radiometric SNR and sensor quality
    - C_alignment: Spatial co-registration IoU and CRS concordance
    - C_resolution: GSD suitability for the requested query scale
    """

    @staticmethod
    def calculate(
        model_conf: float,
        modality_info: Dict[str, Any],
        reg_info: Dict[str, Any] | None = None,
        gsd_meters: float = 10.0
    ) -> Dict[str, Any]:
        c_model = max(0.5, min(1.0, model_conf))

        # Sensor confidence based on radiometric classification certainty
        c_sensor = max(0.6, min(1.0, modality_info.get("confidence", 0.90)))

        # Alignment confidence
        if reg_info:
            c_alignment = max(0.5, min(1.0, reg_info.get("iou", 0.95)))
            if not reg_info.get("crs_match", True):
                c_alignment *= 0.85
        else:
            c_alignment = 0.98  # Single image has no relative spatial discrepancy

        # Resolution suitability: 10m is ideal for regional, 0.5-3m is ideal for fine objects
        if gsd_meters <= 15.0:
            c_resolution = 0.95
        elif gsd_meters <= 30.0:
            c_resolution = 0.85
        else:
            c_resolution = 0.70

        # Weighted harmonic composite score
        weights = [0.40, 0.20, 0.25, 0.15]
        composite_score = (
            weights[0] * c_model +
            weights[1] * c_sensor +
            weights[2] * c_alignment +
            weights[3] * c_resolution
        )
        composite_pct = round(composite_score * 100, 1)

        # Rating level
        if composite_pct >= 85.0:
            rating = "HIGH"
            badge_color = "#10b981"  # Emerald
        elif composite_pct >= 70.0:
            rating = "MODERATE"
            badge_color = "#f59e0b"  # Amber
        else:
            rating = "LOW"
            badge_color = "#ef4444"  # Red

        return {
            "composite_score": composite_pct,
            "rating": rating,
            "badge_color": badge_color,
            "breakdown": {
                "model_inference": round(c_model * 100, 1),
                "sensor_radiometry": round(c_sensor * 100, 1),
                "spatial_alignment": round(c_alignment * 100, 1),
                "resolution_suitability": round(c_resolution * 100, 1)
            }
        }
