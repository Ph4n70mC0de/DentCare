"""API v1 routers package."""

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
    settings,
    waitlist,
)

__all__ = [
    "health", "auth", "patients", "dentists", "services", "schedules",
    "appointments", "waitlist", "consultations", "payments", "notifications",
    "audit", "settings", "reports",
]
