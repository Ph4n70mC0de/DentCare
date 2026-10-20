"""Consultations router (stub)."""

from fastapi import APIRouter

router = APIRouter(tags=["consultations"])

@router.get("")
async def list_consultations():
    return {"data": [], "meta": {"page": 1, "pageSize": 20, "totalItems": 0, "totalPages": 0, "hasNextPage": False, "hasPreviousPage": False}}
