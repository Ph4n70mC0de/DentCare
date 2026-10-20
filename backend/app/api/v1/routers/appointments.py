"""Appointment router: create/list/transition with idempotency and conflict handling."""

from fastapi import APIRouter, Header, HTTPException, Path

from app.core.exceptions import DentCareError
from app.core.logging import get_logger
from app.services.appointment_service import AppointmentService
from app.schemas.appointment import AppointmentResponse, CreateAppointmentRequest

logger = get_logger("appointments")
router = APIRouter(tags=["appointments"])


@router.post("", response_model=AppointmentResponse, status_code=201)
async def create_appointment(
    payload: CreateAppointmentRequest,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    service = AppointmentService()
    data = payload.model_dump()
    data["idempotency_key"] = idempotency_key
    try:
        return service.create_appointment(data)
    except DentCareError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": exc.message, "details": exc.details})
    except Exception as exc:  # noqa: BLE001
        logger.exception("create_appointment_failed")
        raise HTTPException(status_code=500, detail={"code": "INTERNAL_ERROR", "message": "Failed to create appointment."})


@router.patch("/{appointment_id}/status")
async def transition_status(
    appointment_id: str = Path(...),
    new_status: str | None = None,
    reason: str | None = None,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    if new_status is None:
        raise HTTPException(status_code=400, detail={"code": "VALIDATION_ERROR", "message": "new_status is required."})
    service = AppointmentService()
    try:
        # actor_id resolved from session cookie in production; placeholder here.
        return service.transition_status(appointment_id, new_status, actor_id=None, reason=reason)
    except DentCareError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": exc.message, "details": exc.details})
    except Exception as exc:  # noqa: BLE001
        logger.exception("transition_status_failed")
        raise HTTPException(status_code=500, detail={"code": "INTERNAL_ERROR", "message": "Failed to transition appointment."})


@router.get("")
async def list_appointments():
    return {"data": [], "meta": {"page": 1, "pageSize": 20, "totalItems": 0, "totalPages": 0, "hasNextPage": False, "hasPreviousPage": False}}
