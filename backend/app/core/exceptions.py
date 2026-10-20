"""Custom application exceptions mapped to HTTP status codes."""

from typing import Any


class DentCareError(Exception):
    status_code: int = 500
    code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred"

    def __init__(self, message: str | None = None, details: dict[str, Any] | None = None):
        self.message = message or self.message
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(DentCareError):
    status_code = 400
    code = "VALIDATION_ERROR"


class NotFoundError(DentCareError):
    status_code = 404
    code = "NOT_FOUND"


class ConflictError(DentCareError):
    status_code = 409
    code = "CONFLICT"


class UnauthorizedError(DentCareError):
    status_code = 401
    code = "UNAUTHORIZED"


class ForbiddenError(DentCareError):
    status_code = 403
    code = "FORBIDDEN"


class TooManyRequestsError(DentCareError):
    status_code = 429
    code = "TOO_MANY_REQUESTS"


class ServiceUnavailableError(DentCareError):
    status_code = 503
    code = "SERVICE_UNAVAILABLE"
