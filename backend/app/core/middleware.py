"""Request ID and error-handling middleware."""

import json
import uuid
from collections.abc import Callable
from datetime import UTC, datetime

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.exceptions import DentCareError
from app.core.logging import get_logger
from app.core.settings import settings

logger = get_logger("middleware")


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        request.state.request_id = request_id
        response: Response = await call_next(request)
        response.headers["x-request-id"] = request_id
        return response


class OriginCheckMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            origin = request.headers.get("origin")
            referer = request.headers.get("referer")
            allowed = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
            if origin is not None and origin not in allowed:
                return _error_response(403, "CSRF_REJECTED", "Origin not allowed.", None, getattr(request.state, "request_id", None))
            if origin is None and referer is not None:
                if not any(referer.startswith(o) for o in allowed):
                    return _error_response(403, "CSRF_REJECTED", "Referer not allowed.", None, getattr(request.state, "request_id", None))
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response: Response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        return response


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except DentCareError as exc:
            request_id = getattr(request.state, "request_id", None)
            logger.warning("api_error", code=exc.code, status=exc.status_code, request_id=request_id, details=exc.details)
            return _error_response(exc.status_code, exc.code, exc.message, exc.details, request_id)
        except Exception:  # noqa: BLE001 - last-resort boundary, never leak internals
            request_id = getattr(request.state, "request_id", None)
            logger.exception("unhandled_error", request_id=request_id)
            return _error_response(500, "INTERNAL_ERROR", "An unexpected error occurred", None, request_id)


def _error_response(status_code: int, code: str, message: str, details: dict | None, request_id: str | None) -> Response:
    body: dict = {"code": code, "message": message, "statusCode": status_code, "timestamp": datetime.now(UTC).isoformat()}
    if details:
        body["details"] = details
    if request_id:
        body["requestId"] = request_id
    return Response(
        content=json.dumps(body),
        status_code=status_code,
        media_type="application/json",
    )
