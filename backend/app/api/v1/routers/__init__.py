"""API v1 routers package."""

from app.api.v1.routers import (
    health,
    auth,
    patients,
    dentists,
    services,
    schedules,
    appointments,
    waitlist,
    consultations,
    payments,
    notifications,
    audit,
    settings,
    reports,
)

__all__ = [
    "health", "auth", "patients", "dentists", "services", "schedules",
    "appointments", "waitlist", "consultations", "payments", "notifications",
    "audit", "settings", "reports",
]
