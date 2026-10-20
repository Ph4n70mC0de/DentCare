"""Health and readiness endpoints.

GET /health  - process liveness (no dependency checks).
GET /ready   - dependency readiness (database, auth).
"""

from fastapi import APIRouter, Depends

from app.db.session import db_health

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "healthy", "service": "dentcare-api"}


@router.get("/ready")
async def ready(db_ok: bool = Depends(db_health)):
    return {"status": "ready" if db_ok else "degraded", "database": "up" if db_ok else "down"}
