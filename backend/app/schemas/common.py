"""Common schemas."""

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict


class ErrorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    message: str
    status_code: int
    details: dict | None = None
    timestamp: datetime
    request_id: str | None = None


T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)

    data: list[T]
    meta: dict
