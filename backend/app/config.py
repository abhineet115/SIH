import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
SAMPLES_DIR = DATA_DIR / "sample_images"
REPORTS_DIR = DATA_DIR / "reports"

# Create required directories
for d in [UPLOADS_DIR, SAMPLES_DIR, REPORTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Application settings
APP_NAME = "SatQuery AI"
APP_VERSION = "1.0.0"
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
ALLOWED_EXTENSIONS = {".tif", ".tiff", ".png", ".jpg", ".jpeg", ".geojson", ".json"}
MAX_FILE_SIZE_MB = 100

# ISRO default coordinates (e.g. New Delhi / NCR bounding box)
DEFAULT_CRS = "EPSG:32643"  # WGS 84 / UTM zone 43N
