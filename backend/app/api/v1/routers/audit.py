"""Audit router (stub)."""

from fastapi import APIRouter

router = APIRouter(tags=["audit"])

@router.get("")
async def list_audit_logs():
    return {"data": [], "meta": {"page": 1, "pageSize": 20, "totalItems": 0, "totalPages": 0, "hasNextPage": False, "hasPreviousPage": False}}
