import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db.database import init_db, SessionLocal
from app.db.models import Analysis, User, Image, ExecutionTrace, Evidence
from app.agents.controller import AgenticController
from app.config import SAMPLES_DIR

def test_database_flow():
    print("--- Initializing Database ---")
    init_db()
    db = SessionLocal()

    # Create dummy user if not exists
    user = db.query(User).first()
    if not user:
        user = User(name="ISRO Scientist Abhineet", role="Lead Remote Sensing Scientist")
        db.add(user)
        db.commit()
        db.refresh(user)
    print(f"Active DB User: {user.name} (Role: {user.role}, ID: {user.id})")

    # Run query
    print("--- Executing Agent Query & Storing in DB ---")
    airport_img = SAMPLES_DIR / "airport_optical.tif"
    res = AgenticController.process_query(
        primary_path=airport_img,
        query="Highlight all active runways"
    )

    analysis_rec = Analysis(
        user_id=user.id,
        query=res["query"],
        task=res["intent"],
        confidence=res["confidence"]["composite_score"],
        final_answer=res["answer"]
    )
    db.add(analysis_rec)
    db.flush()

    for step in res["execution_trace"]:
        db.add(ExecutionTrace(
            analysis_id=analysis_rec.id,
            step_number=step["step"],
            tool_name=step["tool"],
            status=step["status"],
            latency_ms=step["latency_ms"],
            details=step["details"]
        ))

    db.commit()
    print(f"Persisted Analysis ID {analysis_rec.id} to SQLite DB ({analysis_rec.task})")

    # Verify query back
    fetched = db.query(Analysis).filter(Analysis.id == analysis_rec.id).first()
    assert fetched is not None
    assert len(fetched.traces) > 0
    print(f"Verification Successful! Fetched record with {len(fetched.traces)} trace steps.")
    db.close()

if __name__ == "__main__":
    test_database_flow()
