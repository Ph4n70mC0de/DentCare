"""Appointment repository: database access for appointments."""

from uuid import UUID

from app.db.session import get_connection


class AppointmentRepository:
    def slot_available(self, dentist_id: UUID, date, start_time, end_time, exclude_id: UUID | None = None) -> bool:
        with get_connection() as conn:
            with conn.cursor() as cur:
                if exclude_id is not None:
                    cur.execute(
                        """
                        select 1 from public.appointments
                        where dentist_id = %s and date = %s
                          and id <> %s and status <> 'Cancelled' and status <> 'No-Show'
                          and start_time < %s and end_time > %s
                        limit 1
                        """,
                        (dentist_id, date, exclude_id, end_time, start_time),
                    )
                else:
                    cur.execute(
                        """
                        select 1 from public.appointments
                        where dentist_id = %s and date = %s
                          and status <> 'Cancelled' and status <> 'No-Show'
                          and start_time < %s and end_time > %s
                        limit 1
                        """,
                        (dentist_id, date, end_time, start_time),
                    )
                return cur.fetchone() is None

    def create(self, dentist_id: UUID, patient_id: str, service_id: str, date, start_time, end_time, status, booking_source, notes, actor_id: UUID | None, idempotency_key: str | None):
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into public.appointments
                      (appointment_number, patient_id, dentist_id, service_id, date, start_time, end_time, status, booking_source, notes, actor_id, idempotency_key)  # noqa: E501
                    values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    returning id, appointment_number
                    """,
                    ("PENDING-NUMBER", patient_id, dentist_id, service_id, date, start_time, end_time, status, booking_source, notes, actor_id, idempotency_key),  # noqa: E501
                )
                return cur.fetchone()
