"""Application wiring: FastAPI app, middleware, routers, exception handling."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routers import (
    appointments,
    audit,
    auth,
    consultations,
    dentists,
    health,
    notifications,
    patients,
    payments,
    reports,
    schedules,
    services,
    waitlist,
)
from app.api.v1.routers import (
    settings as settings_router,
)
from app.core.logging import configure_logging
from app.core.middleware import ErrorHandlerMiddleware, OriginCheckMiddleware, RequestIDMiddleware, SecurityHeadersMiddleware
from app.core.settings import settings

configure_logging()

app = FastAPI(title="DentCare API", version="0.1.0", docs_url="/api/v1/docs", openapi_url="/api/v1/openapi.json")

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Requested-With", "Idempotency-Key", "X-Request-Id"],
)

app.add_middleware(RequestIDMiddleware)
app.add_middleware(OriginCheckMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(ErrorHandlerMiddleware)

app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(patients.router, prefix="/api/v1/patients")
app.include_router(dentists.router, prefix="/api/v1/dentists")
app.include_router(services.router, prefix="/api/v1/services")
app.include_router(schedules.router, prefix="/api/v1/schedules")
app.include_router(appointments.router, prefix="/api/v1/appointments")
app.include_router(waitlist.router, prefix="/api/v1/waitlist")
app.include_router(consultations.router, prefix="/api/v1/consultations")
app.include_router(payments.router, prefix="/api/v1/payments")
app.include_router(notifications.router, prefix="/api/v1/notifications")
app.include_router(audit.router, prefix="/api/v1/audit-logs")
app.include_router(settings_router.router, prefix="/api/v1/settings")
app.include_router(reports.router, prefix="/api/v1/reports")


@app.get("/health", tags=["health"])
async def health_root():
    return {"status": "ok"}
