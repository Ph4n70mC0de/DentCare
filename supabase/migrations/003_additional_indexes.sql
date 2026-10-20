-- Migration 003: Additional indexes matching measured query patterns
-- Appends to 001_initial.sql (migrations are append-only once applied).

-- Appointment lookups by patient/dentist with date + time (composite).
create index idx_appointments_patient_date_time
  on public.appointments(patient_id, date, start_time);
create index idx_appointments_dentist_date_time
  on public.appointments(dentist_id, date, start_time);

-- Active waitlists: service + priority + preferred date for matching workers.
create index idx_waitlist_entries_active_service_priority_date
  on public.waitlist_entries(service_id, priority, preferred_date)
  where status = 'active';

-- Notifications: recipient + read state + scheduled time.
create index idx_notifications_user_read_sent
  on public.notifications(user_id, read, sent_at);
create index idx_notifications_patient_read_sent
  on public.notifications(patient_id, read, sent_at);

-- Outbox: pending deliveries ordered by scheduled time (worker poll pattern).
create index idx_notification_outbox_pending_scheduled
  on public.notification_outbox(status, scheduled_at)
  where status = 'pending';

-- Payments: patient + created time for statements/reports.
create index idx_payments_patient_created
  on public.payments(patient_id, created_at);

-- Audit logs: actor + time, and entity + time for forensic queries.
create index idx_audit_logs_actor_time
  on public.audit_logs(actor_id, timestamp);
create index idx_audit_logs_entity_time
  on public.audit_logs(entity_type, entity_id, timestamp);

-- Foreign-key-adjacent lookups.
create index idx_prescription_items_consultation_created
  on public.prescription_items(consultation_id, created_at);
create index idx_payment_events_payment_occurred
  on public.payment_events(payment_id, occurred_at);
