from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import APP_NAME, APP_VERSION, UPLOADS_DIR, SAMPLES_DIR, REPORTS_DIR
from app.db.database import init_db
from app.api.upload import router as upload_router
from app.api.query import router as query_router
from app.api.samples import router as samples_router
from app.api.report import router as report_router
from app.api.history import router as history_router

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Multimodal Remote Sensing Vision-Language Assistant for ISRO (SIH 26167)"
)

# CORS middleware for React Vite client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables on startup
@app.on_event("startup")
def on_startup():
    init_db()

# Include API Routers
app.include_router(upload_router)
app.include_router(query_router)
app.include_router(samples_router)
app.include_router(report_router)
app.include_router(history_router)

# Mount static directories for media serving
app.mount("/static/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/static/samples", StaticFiles(directory=str(SAMPLES_DIR)), name="samples")
app.mount("/static/reports", StaticFiles(directory=str(REPORTS_DIR)), name="reports")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": APP_NAME,
        "version": APP_VERSION,
        "organization": "Indian Space Research Organisation (ISRO)",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": APP_NAME,
        "version": APP_VERSION
    }
