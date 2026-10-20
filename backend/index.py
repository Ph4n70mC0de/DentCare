# Vercel Python entrypoint for the DentCare FastAPI backend.
# Vercel routes requests to this file's `app` object.
# Build command: pip install -r backend/pyproject-style requirements (Vercel installs from pyproject).
# Route config lives in vercel.json (frontend project) / backend vercel settings.

from app.main import app

__all__ = ["app"]
