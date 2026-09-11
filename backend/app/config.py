import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env if present
env_path = BASE_DIR / ".env"
if env_path.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path)
    except ImportError:
        # Fallback manual parser if python-dotenv is not installed
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip("'\"")
                    if k not in os.environ and v:
                        os.environ[k] = v
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

# Colab Bridge (Optional live GPU endpoint, defaults to None for fast local specialist execution)
COLAB_API_URL = os.getenv("COLAB_API_URL", None)

# Google Gemini API Settings for Plain-English Explanation & Summarization
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

