"""Application wiring: FastAPI app, middleware, routers, exception handling."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.logging import configure_logging
from app.core.middleware import RequestIDMiddleware, ErrorHandlerMiddleware
from app.api.v1.routers import health, auth, appointments, patients, dentists, services, schedules, waitlist, consultations, payments, notifications, audit, settings, reports

configure_logging()

app = FastAPI(title="DentCare API", version="0.1.0", docs_url="/api/v1/docs", openapi_url="/api/v1/openapi.json")

app.add_middleware(RequestIDMiddleware)
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
app.include_router(settings.router, prefix="/api/v1/settings")
app.include_router(reports.router, prefix="/api/v1/reports")

@app.get("/health", tags=["health"])
async def health_root():
    return {"status": "ok"}
