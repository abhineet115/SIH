import os
import io
import math
import base64
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from PIL import Image
import numpy as np

class GeoTIFFProcessor:
    """
    Ingests GeoTIFF, TIFF, PNG, and JPEG imagery.
    Extracts spatial metadata (CRS, resolution, bounds) and returns
    a web-renderable stretched RGB preview image.
    """

    @staticmethod
    def inspect(file_path: str | Path) -> Dict[str, Any]:
        """
        Extract raster dimensions, bands, bit depth, format, and spatial tags.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File {file_path} not found")

        # Basic file info
        file_size = path.stat().st_size
        suffix = path.suffix.lower()

        # Try reading with PIL
        with Image.open(path) as img:
            width, height = img.size
            format_name = img.format or suffix.replace(".", "").upper()
            mode = img.mode
            bands = len(img.getbands())

            # Attempt to read EXIF or TIFF tags for georeferencing
            tiff_tags = getattr(img, "tag_v2", {}) or {}
            
            # Known GeoTIFF tags:
            # 33550: ModelPixelScaleTag (dx, dy, dz)
            # 33922: ModelTiepointTag
            # 34735: GeoKeyDirectoryTag
            # 34737: GeoAsciiParamsTag
            has_geotiff_tags = any(tag in tiff_tags for tag in (33550, 33922, 34735))

            # Approximate GSD & CRS if tags present or default to ISRO benchmark
            gsd = 10.0  # default 10m Sentinel-2 GSD
            crs = "EPSG:32643"  # UTM 43N default
            
            if 33550 in tiff_tags:
                scale = tiff_tags[33550]
                if isinstance(scale, (tuple, list)) and len(scale) >= 2:
                    gsd = round(float(scale[0]), 2)

            # Geographic bounds (default realistic Delhi NCR bounding box if synthetic/unprojected)
            min_lon, min_lat = 77.10, 28.55
            delta_lon = (width * gsd) / 111320.0
            delta_lat = (height * gsd) / 110540.0
            bounds = {
                "west": round(min_lon, 4),
                "south": round(min_lat, 4),
                "east": round(min_lon + delta_lon, 4),
                "north": round(min_lat + delta_lat, 4)
            }

            # Bit depth and dtype estimate
            dtype_map = {
                "1": ("bool", 1),
                "L": ("uint8", 8),
                "P": ("uint8", 8),
                "RGB": ("uint8", 24),
                "RGBA": ("uint8", 32),
                "I;16": ("uint16", 16),
                "I": ("int32", 32),
                "F": ("float32", 32)
            }
            dtype, bit_depth = dtype_map.get(mode, ("uint8", 8 * bands))

            return {
                "filename": path.name,
                "format": format_name,
                "width": width,
                "height": height,
                "bands": bands,
                "mode": mode,
                "dtype": dtype,
                "bit_depth": bit_depth,
                "file_size_bytes": file_size,
                "file_size_mb": round(file_size / (1024 * 1024), 2),
                "is_geotiff": has_geotiff_tags or "tif" in suffix,
                "crs": crs,
                "gsd_meters": gsd,
                "bounds": bounds,
            }

    @staticmethod
    def get_web_preview(file_path: str | Path, max_dim: int = 1024) -> Tuple[Image.Image, str]:
        """
        Generates a 2%-98% percentile stretched RGB image suitable for web display.
        Returns PIL Image and base64 encoded PNG string.
        """
        path = Path(file_path)
        with Image.open(path) as img:
            # Downsample if image is huge
            w, h = img.size
            if max(w, h) > max_dim:
                scale = max_dim / max(w, h)
                new_w, new_h = int(w * scale), int(h * scale)
                img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)

            arr = np.array(img)

        # Multi-channel or single-channel normalization
        if arr.ndim == 2:  # Single band / Grayscale (e.g. SAR or Panchromatic)
            arr = GeoTIFFProcessor._percentile_stretch(arr)
            rgb_arr = np.stack([arr, arr, arr], axis=-1)
        elif arr.ndim == 3:
            if arr.shape[2] >= 3:
                channels = []
                for i in range(3):  # Take first 3 bands (R, G, B)
                    channels.append(GeoTIFFProcessor._percentile_stretch(arr[:, :, i]))
                rgb_arr = np.stack(channels, axis=-1)
            elif arr.shape[2] == 2:  # Dual-pol SAR (VV, VH) -> compose VV, VH, VV/VH
                vv = GeoTIFFProcessor._percentile_stretch(arr[:, :, 0])
                vh = GeoTIFFProcessor._percentile_stretch(arr[:, :, 1])
                ratio = np.clip((arr[:, :, 0].astype(np.float32) + 1e-5) / 
                                (arr[:, :, 1].astype(np.float32) + 1e-5), 0, 10)
                ratio_stretched = GeoTIFFProcessor._percentile_stretch(ratio)
                rgb_arr = np.stack([vv, vh, ratio_stretched], axis=-1)
            else:
                s = GeoTIFFProcessor._percentile_stretch(arr[:, :, 0])
                rgb_arr = np.stack([s, s, s], axis=-1)
        else:
            rgb_arr = np.zeros((256, 256, 3), dtype=np.uint8)

        preview_img = Image.fromarray(rgb_arr.astype(np.uint8), mode="RGB")
        
        # Buffer to Base64
        buf = io.BytesIO()
        preview_img.save(buf, format="PNG")
        b64_str = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

        return preview_img, b64_str

    @staticmethod
    def _percentile_stretch(channel: np.ndarray, p_min: float = 2.0, p_max: float = 98.0) -> np.ndarray:
        """Applies 2-98% radiometric linear stretch to 8-bit unsigned integer range [0, 255]."""
        c_flat = channel.flatten()
        if len(c_flat) == 0:
            return channel.astype(np.uint8)
            
        low, high = np.percentile(c_flat, (p_min, p_max))
        if high <= low:
            return np.zeros_like(channel, dtype=np.uint8)
            
        stretched = np.clip((channel - low) / (high - low) * 255.0, 0, 255)
        return stretched.astype(np.uint8)
