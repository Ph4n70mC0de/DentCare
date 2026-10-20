"""Reports router (stub)."""

from fastapi import APIRouter

router = APIRouter(tags=["reports"])

@router.post("/generate")
async def generate_report():
    return {"status": "accepted"}
