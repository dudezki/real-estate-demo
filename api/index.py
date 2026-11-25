"""Vercel Python function entrypoint for the FastAPI token service (backend/app)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.main import create_app  # noqa: E402

app = create_app()
