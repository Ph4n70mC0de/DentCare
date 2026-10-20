"""Appointment business service: transactional, idempotent booking."""

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.db.session import get_connection
from app.repositories.appointment_repo import AppointmentRepository

# Central appointment status state machine (mirrors the DB guard function).
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "Requested": {"Confirmed", "Cancelled", "Rescheduled", "No-Show"},
    "Pending": {"Confirmed", "Cancelled", "Rescheduled", "No-Show"},
    "Confirmed": {"Checked-In", "Cancelled", "Rescheduled", "No-Show"},
    "Waitlisted": {"Confirmed", "Cancelled"},
    "Checked-In": {"Waiting"},
    "Waiting": {"In-Consultation"},
    "In-Consultation": {"Payment-Pending"},
    "Payment-Pending": {"Completed"},
    "Rescheduled": set(),
    "Cancelled": set(),
    "No-Show": set(),
    "Completed": set(),
    "Emergency": {"In-Consultation"},
}


class AppointmentService:
    def __init__(self) -> None:
        self.repo = AppointmentRepository()

    def create_appointment(self, data, actor_id: UUID | None = None):
        repo = self.repo

        # Idempotency: reject duplicate keys for a mutating write.
        if data.idempotency_key:
            self._check_idempotency(data.idempotency_key, actor_id, "create_appointment")

        dentist_id = UUID(data.dentist_id)
        patient_id = UUID(data.patient_id)
        service_id = UUID(data.service_id)

        duration = 45  # default slot; in future, read from dental_services
        end_time = (datetime.combine(data.date, data.start_time) + timedelta(minutes=duration)).time()

        with get_connection() as conn:
            conn.autocommit = False
            try:
                with conn.cursor() as cur:
                    # Verify referenced entities exist and are active.
                    cur.execute("select 1 from public.dentists where id = %s and status = 'active'", (dentist_id,))
                    if cur.fetchone() is None:
                        raise NotFoundError(code="DENTIST_NOT_FOUND", message="Dentist not found or inactive.")
                    cur.execute("select 1 from public.patients where id = %s", (patient_id,))
                    if cur.fetchone() is None:
                        raise NotFoundError(code="PATIENT_NOT_FOUND", message="Patient not found.")
                    cur.execute("select 1 from public.dental_services where id = %s and active = true", (service_id,))
                    if cur.fetchone() is None:
                        raise NotFoundError(code="SERVICE_NOT_FOUND", message="Service not found or inactive.")

                    # Re-check slot availability inside the transaction.
                    if not repo.slot_available(dentist_id, data.date, data.start_time, end_time):
                        raise ConflictError(code="SLOT_UNAVAILABLE", message="Selected slot is no longer available.")

                    cur.execute(
                        """
                        insert into public.appointments
                          (appointment_number, patient_id, dentist_id, service_id, date, start_time, end_time,
                           status, booking_source, notes, idempotency_key)
                        values (%s, %s, %s, %s, %s, %s, %s, 'Confirmed', 'walk_in', %s, %s)
                        returning id, appointment_number, patient_id, dentist_id, service_id, date, start_time, end_time, status
                        """,
                        (f"DC-{data.date.strftime('%Y')}-{uuid4().hex[:4].upper()}", patient_id, dentist_id, service_id,
                         data.date, data.start_time, end_time, data.notes, data.idempotency_key),
                    )
                    row = cur.fetchone()
                    appointment = {
                        "id": str(row[0]),
                        "appointment_number": row[1],
                        "patient_id": str(row[2]),
                        "dentist_id": str(row[3]),
                        "service_id": str(row[4]),
                        "date": str(row[5]),
                        "start_time": str(row[6]),
                        "end_time": str(row[7]),
                        "status": row[8],
                    }

                    # Audit history append-only.
                    cur.execute(
                        """
                        insert into public.appointment_status_history
                          (appointment_id, prior_status, new_status, actor_id, actor_role, reason, occurred_at)
                        values (%s, NULL, 'Confirmed', %s, 'front_desk', 'Appointment booked', %s)
                        """,
                        (row[0], actor_id, datetime.now(timezone.utc)),
                    )

                conn.commit()
            except Exception:
                conn.rollback()
                raise

        if data.idempotency_key:
            self._record_idempotency(data.idempotency_key, actor_id, "create_appointment", appointment)

        return appointment

    def transition_status(self, appointment_id: str, new_status: str, actor_id: UUID | None, reason: str | None = None):
        """Transition an appointment to a new status, enforcing the state machine.

        The DB trigger enforces this as a backstop; this method validates
        up-front for a clear application error and writes audit history.
        """
        apt_uuid = UUID(appointment_id)
        actor_role = "front_desk"  # resolved from session context in production

        with get_connection() as conn:
            conn.autocommit = False
            try:
                with conn.cursor() as cur:
                    # Lock the appointment row for the duration of the transaction.
                    cur.execute(
                        "select id, status, patient_id, dentist_id from public.appointments where id = %s for update",
                        (apt_uuid,),
                    )
                    row = cur.fetchone()
                    if row is None:
                        raise NotFoundError(code="APPOINTMENT_NOT_FOUND", message="Appointment not found.")
                    prior_status = row[1]

                    if new_status not in ALLOWED_TRANSITIONS.get(prior_status, set()):
                        raise ConflictError(
                            code="ILLEGAL_TRANSITION",
                            message=f"Illegal transition {prior_status} -> {new_status}.",
                        )

                    confirmed_clause = ", confirmed_at = now()" if new_status == "Confirmed" else ""

                    cur.execute(
                        f"""
                        update public.appointments
                        set status = %s{confirmed_clause}, updated_at = now()
                        where id = %s
                        returning id, status
                        """,
                        (new_status, apt_uuid),
                    )
                    cur.fetchone()

                    # Audit history append-only.
                    cur.execute(
                        """
                        insert into public.appointment_status_history
                          (appointment_id, prior_status, new_status, actor_id, actor_role, reason, occurred_at)
                        values (%s, %s, %s, %s, %s, %s, %s)
                        """,
                        (apt_uuid, prior_status, new_status, actor_id, actor_role, reason, datetime.now(timezone.utc)),
                    )

                conn.commit()
            except ConflictError:
                raise
            except NotFoundError:
                raise
            except Exception:
                conn.rollback()
                raise

        return {"id": appointment_id, "prior_status": prior_status, "new_status": new_status}

    def _check_idempotency(self, key: str, actor_id: UUID | None, operation: str) -> None:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "select 1 from public.idempotency_keys where key_hash = %s and operation = %s",
                    (key, operation),
                )
                if cur.fetchone() is not None:
                    raise ConflictError(code="IDEMPOTENCY_CONFLICT", message="Request already processed.")

    def _record_idempotency(self, key: str, actor_id: UUID | None, operation: str, result: dict) -> None:
        import json
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into public.idempotency_keys (key_hash, actor_id, operation, result_jsonb, status_code)
                    values (%s, %s, %s, %s, 200)
                    """,
                    (key, actor_id, operation, json.dumps(result)),
                )
                conn.commit()
