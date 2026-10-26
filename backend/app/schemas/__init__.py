"""Pydantic request/response schemas."""

from app.schemas.appointment import *  # noqa: F401,F403
from app.schemas.auth import *  # noqa: F401,F403
from app.schemas.common import *  # noqa: F401,F403

__all__ = [  # noqa: F405
    "LoginRequest", "LoginResponse", "ErrorResponse",
    "CreateAppointmentRequest", "AppointmentResponse",
]
