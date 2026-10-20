import json, os, subprocess
from pathlib import Path
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/pipeline", tags=["AI Pipeline"])

AI_MODULE_DIR = Path(os.getenv("AI_MODULE_DIR", "../ai")).resolve()
INCIDENTS_JSON = AI_MODULE_DIR / "data" / "processed" / "incidents.json"

def get_ai_python():
    env_path = os.getenv("AI_PYTHON_PATH")
    if env_path and Path(env_path).exists():
        return str(Path(env_path).resolve())
    venv_py = AI_MODULE_DIR / ".venv" / "Scripts" / "python.exe"
    if venv_py.exists():
        return str(venv_py)
    return "python"

@router.post("/run-pipeline")
def run_ai_pipeline():
    python_exe = get_ai_python()
    try:
        result = subprocess.run(
            [python_exe, "pipeline.py"],
            cwd=str(AI_MODULE_DIR),
            capture_output=True, text=True, timeout=120,
        )
    except FileNotFoundError:
        raise HTTPException(500, f"Python interpreter not found: '{python_exe}'")
    except subprocess.TimeoutExpired:
        raise HTTPException(504, "AI pipeline timed out")

    if result.returncode != 0:
        raise HTTPException(500, f"AI pipeline failed:\n{result.stderr}")
    if not INCIDENTS_JSON.exists():
        raise HTTPException(500, "Pipeline ran but incidents.json was not produced")

    with open(INCIDENTS_JSON) as f:
        return json.load(f)

@router.get("/live")
def get_live_incidents():
    if not INCIDENTS_JSON.exists():
        return []
    with open(INCIDENTS_JSON) as f:
        return json.load(f)