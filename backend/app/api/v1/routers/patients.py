"""Patients router (stub)."""

from fastapi import APIRouter

router = APIRouter(tags=["patients"])

@router.get("")
async def list_patients():
    return {"data": [], "meta": {"page": 1, "pageSize": 20, "totalItems": 0, "totalPages": 0, "hasNextPage": False, "hasPreviousPage": False}}
