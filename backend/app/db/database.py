import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import DATA_DIR

# Supports SQLite by default or PostgreSQL via DATABASE_URL env var
DEFAULT_SQLITE_URL = f"sqlite:///{DATA_DIR / 'satquery.db'}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)

# SQLite requires check_same_thread=False for multithreaded FastAPI requests
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """FastAPI Dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes all database tables on application launch."""
    import app.db.models
    Base.metadata.create_all(bind=engine)
