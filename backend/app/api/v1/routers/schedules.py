"""Schedules router (stub)."""

from fastapi import APIRouter

router = APIRouter(tags=["schedules"])

@router.get("")
async def list_schedules():
    return {"data": [], "meta": {"page": 1, "pageSize": 20, "totalItems": 0, "totalPages": 0, "hasNextPage": False, "hasPreviousPage": False}}
