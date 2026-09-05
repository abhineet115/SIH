from typing import Dict, Any

class ModalityClassifier:
    """
    Classifies satellite imagery into OPTICAL, SAR, or MULTISPECTRAL
    using multi-criteria heuristics:
    Score(Modality) = w1*S_bands + w2*S_metadata + w3*S_filename
    """

    @staticmethod
    def classify(metadata: Dict[str, Any]) -> Dict[str, Any]:
        filename = metadata.get("filename", "").lower()
        bands = metadata.get("bands", 3)
        dtype = metadata.get("dtype", "uint8")

        sar_score = 0.0
        optical_score = 0.0

        # Filename indicators
        sar_keywords = ["sar", "s1", "sentinel1", "sentinel-1", "vv", "vh", "hh", "hv", "risat", "palsar", "terrasar"]
        optical_keywords = ["optical", "s2", "sentinel2", "sentinel-2", "landsat", "planet", "rgb", "b02", "b03", "b04"]

        if any(kw in filename for kw in sar_keywords):
            sar_score += 0.5
        if any(kw in filename for kw in optical_keywords):
            optical_score += 0.5

        # Band count indicators
        if bands in (1, 2):
            sar_score += 0.4
        elif bands >= 3:
            optical_score += 0.4
            if bands > 4:
                optical_score += 0.1  # Multispectral

        # Dynamic range / dtype heuristics
        if dtype in ("uint16", "float32", "int32"):
            # High dynamic range typical of SAR or L2A multispectral
            sar_score += 0.1
            optical_score += 0.1

        # Final decision
        if sar_score > optical_score:
            modality = "SAR"
            confidence = min(0.98, sar_score)
            description = "Synthetic Aperture Radar (Active Microwave - Cloud Penetrating)"
        elif bands > 4:
            modality = "MULTISPECTRAL"
            confidence = min(0.96, optical_score)
            description = f"Multispectral Optical ({bands} Bands - VNIR/SWIR)"
        else:
            modality = "OPTICAL"
            confidence = min(0.99, optical_score if optical_score > 0 else 0.85)
            description = "High-Resolution Optical Imagery (True Color RGB)"

        return {
            "modality": modality,
            "confidence": round(confidence, 2),
            "description": description,
            "sar_score": round(sar_score, 2),
            "optical_score": round(optical_score, 2),
            "bands_detected": bands
        }
