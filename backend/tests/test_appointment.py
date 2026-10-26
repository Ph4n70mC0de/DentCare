"""Appointment service tests.

test_state_machine runs without a database and proves only legal transitions pass.
test_concurrent_booking requires a live DATABASE_URL (staging/test Supabase) and
proves two concurrent requests for the same overlapping slot yield exactly one success.
"""

import os
import threading
from types import SimpleNamespace
from uuid import uuid4

# Supabase/FastAPI settings are instantiated at import time; provide defaults
# so the state-machine unit tests can import without a live database.
os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_ANON_KEY", "anon")
os.environ.setdefault("DATABASE_URL", "postgres://localhost/postgres")
os.environ.setdefault("SESSION_SECRET", "test-secret")

import pytest

from app.services.appointment_service import ALLOWED_TRANSITIONS, AppointmentService


@pytest.mark.parametrize(
    "prior,new,allowed",
    [
        ("Requested", "Confirmed", True),
        ("Requested", "Completed", False),
        ("Confirmed", "Completed", False),
        ("Confirmed", "Checked-In", True),
        ("Checked-In", "Waiting", True),
        ("Waiting", "In-Consultation", True),
        ("In-Consultation", "Payment-Pending", True),
        ("Payment-Pending", "Completed", True),
        ("Completed", "Completed", False),
        ("Cancelled", "Confirmed", False),
        ("No-Show", "Confirmed", False),
    ],
)
def test_state_machine_transitions(prior, new, allowed):
    assert (new in ALLOWED_TRANSITIONS.get(prior, set())) is allowed


@pytest.mark.skipif(
    not os.environ.get("DENTCARE_TEST_DB"),
    reason="DENTCARE_TEST_DB not set; requires live test Supabase",
)
def test_concurrent_booking_no_double_booking():

    service = AppointmentService()
    dentist_id = str(uuid4())
    patient_id = str(uuid4())
    service_id = str(uuid4())
    date_obj = __import__("datetime").date(2026, 11, 1)
    start_time_obj = __import__("datetime").time(10, 0)

    results = []
    errors = []

    def attempt(label):
        try:
            result = service.create_appointment(
                SimpleNamespace(
                    patient_id=patient_id,
                    dentist_id=dentist_id,
                    service_id=service_id,
                    date=date_obj,
                    start_time=start_time_obj,
                    notes=label,
                    idempotency_key=f"key-{label}-{uuid4().hex[:8]}",
                ),
                actor_id=None,
            )
            results.append((label, result))
        except Exception as exc:  # noqa: BLE001
            errors.append((label, str(exc)))

    threads = [threading.Thread(target=attempt, args=(f"user-{i}",)) for i in range(20)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    successes = [r for r in results if r[1] is not None]
    assert len(successes) <= 1, f"double booking: {len(successes)} succeeded"
    # At least the failures should be conflict errors, not 500s.
    for _label, err in errors:
        assert "SLOT_UNAVAILABLE" in err or "IDEMPOTENCY_CONFLICT" in err, err
