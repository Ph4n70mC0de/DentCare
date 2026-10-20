"""Settings router (stub)."""

from fastapi import APIRouter

router = APIRouter(tags=["settings"])

@router.get("")
async def get_settings():
    return {}
