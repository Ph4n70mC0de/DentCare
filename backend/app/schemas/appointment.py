"""Appointment request/response schemas."""

from datetime import date, time
from typing import Optional

from pydantic import BaseModel


class CreateAppointmentRequest(BaseModel):
    patient_id: str
    dentist_id: str
    service_id: str
    date: date
    start_time: time
    notes: Optional[str] = None
    idempotency_key: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: str
    appointment_number: str
    status: str
    date: date
    start_time: time
    end_time: time
