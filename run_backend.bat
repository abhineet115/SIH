@echo off
echo Starting SatQuery AI FastAPI Backend...
cd backend
echo Checking requirements...
pip install -r requirements.txt -q
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
