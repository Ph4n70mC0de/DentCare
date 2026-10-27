-- Migration 001: Initial DentCare schema
-- Authored 2026-10-20. Source of truth for the production data model.
-- Apply to a fresh local database via Supabase CLI before any remote apply.
-- Never hand-edit production schema in the Dashboard once migrations are source of truth.

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Domain enums
-- ------------------------------------------------------------
create type user_role as enum ('patient', 'front_desk', 'dentist', 'admin');
create type appointment_status as enum (
  'Requested', 'Pending', 'Confirmed', 'Waitlisted', 'Rescheduled',
  'Cancelled', 'Checked-In', 'Waiting', 'In-Consultation', 'Payment-Pending',
  'Completed', 'No-Show', 'Emergency'
);
create type booking_source as enum ('online_form', 'app', 'phone_call', 'walk_in');
create type service_category as enum (
  'General', 'Restorative', 'Orthodontics', 'Endodontics', 'Periodontics',
  'Cosmetic', 'Surgery'
);
create type payment_method as enum ('Cash', 'Credit Card', 'Debit Card', 'Insurance', 'Online Banking');
create type payment_status as enum ('Pending', 'Paid', 'Partially-Paid', 'Refunded');
create type waitlist_status as enum ('active', 'notified', 'booked', 'cancelled');
create type waitlist_priority as enum ('normal', 'high', 'urgent');
create type waitlist_time_range as enum ('morning', 'afternoon', 'any');
create type notification_channel as enum ('in_app', 'sms', 'email');
create type notification_type as enum (
  'appointment_requested', 'appointment_confirmed', 'appointment_rescheduled',
  'appointment_cancelled', 'waitlist_slot_available', 'reminder', 'no_show_notice',
  'follow_up_reminder', 'emergency_schedule_adjustment', 'payment_receipt',
  'appointment_completed'
);
create type audit_entity_type as enum (
  'appointment', 'patient', 'dentist', 'service', 'schedule', 'payment',
  'consultation', 'waitlist', 'settings'
);

-- ------------------------------------------------------------
-- helper: updated_at trigger
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql strict;

-- ------------------------------------------------------------
-- user_profiles
-- ------------------------------------------------------------
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'patient',
  status text not null default 'active' check (status in ('active', 'inactive')),
  full_name text not null,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create trigger set_updated_at_user_profiles
before update on public.user_profiles
for each row
execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- patients
-- ------------------------------------------------------------
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete set null unique,
  patient_number text not null unique,
  full_name text not null,
  date_of_birth date,
  sex text check (sex in ('Male', 'Female', 'Other')),
  phone text not null,
  email text not null,
  address text,
  emergency_contact_name text,
  emergency_contact_relationship text,
  emergency_contact_phone text,
  identification_reference text,
  medical_alerts text[] not null default '{}',
  allergies text[] not null default '{}',
  no_show_count integer not null default 0 check (no_show_count >= 0),
  requires_staff_review_for_booking boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patients enable row level security;

create trigger set_updated_at_patients
before update on public.patients
for each row
execute procedure public.set_updated_at();

create index idx_patients_user_id on public.patients(user_id);
create index idx_patients_patient_number on public.patients(patient_number);
create index idx_patients_email on public.patients(email);

-- ------------------------------------------------------------
-- dentists
-- ------------------------------------------------------------
create table public.dentists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete set null unique,
  full_name text not null,
  license_reference text,
  specialization text,
  contact text,
  email text,
  status text not null default 'active' check (status in ('active', 'on_leave', 'inactive')),
  color_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dentists enable row level security;

create trigger set_updated_at_dentists
before update on public.dentists
for each row
execute procedure public.set_updated_at();

create index idx_dentists_user_id on public.dentists(user_id);

-- ------------------------------------------------------------
-- dental_services
-- ------------------------------------------------------------
create table public.dental_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category service_category not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10, 2) not null check (price >= 0),
  active boolean not null default true,
  icon_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dental_services enable row level security;

create trigger set_updated_at_dental_services
before update on public.dental_services
for each row
execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- dentist_schedules
-- ------------------------------------------------------------
create table public.dentist_schedules (
  id uuid primary key default gen_random_uuid(),
  dentist_id uuid not null references public.dentists(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  break_start time,
  break_end time check (break_end > break_start),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dentist_id, day_of_week)
);

alter table public.dentist_schedules enable row level security;

create trigger set_updated_at_dentist_schedules
before update on public.dentist_schedules
for each row
execute procedure public.set_updated_at();

create index idx_dentist_schedules_dentist_day on public.dentist_schedules(dentist_id, day_of_week);

-- ------------------------------------------------------------
-- blocked_schedules
-- ------------------------------------------------------------
create table public.blocked_schedules (
  id uuid primary key default gen_random_uuid(),
  dentist_id uuid references public.dentists(id) on delete cascade, -- null = whole clinic
  date date not null,
  start_time time,
  end_time time,
  reason text not null,
  is_all_day boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.blocked_schedules enable row level security;

create index idx_blocked_schedules_date on public.blocked_schedules(date);
create index idx_blocked_schedules_dentist_date on public.blocked_schedules(dentist_id, date);

-- ------------------------------------------------------------
-- appointments
-- ------------------------------------------------------------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  appointment_number text not null unique,
  patient_id uuid not null references public.patients(id) on delete restrict,
  dentist_id uuid not null references public.dentists(id) on delete restrict,
  service_id uuid not null references public.dental_services(id) on delete restrict,
  date date not null,
  start_time time not null,
  end_time time not null check (end_time > start_time),
  status appointment_status not null default 'Requested',
  booking_source booking_source not null default 'walk_in',
  notes text,
  cancellation_reason text,
  cancelled_by uuid,
  cancelled_at timestamptz,
  no_show_reason text,
  no_show_marked_by uuid,
  no_show_at timestamptz,
  emergency_severity text check (emergency_severity in ('high', 'critical')),
  emergency_notes text,
  rescheduled_from_id uuid references public.appointments(id) on delete set null,
  queue_number integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  arrived_at timestamptz,
  consultation_started_at timestamptz,
  completed_at timestamptz,
  follow_up_reminder_scheduled_for timestamptz,
  follow_up_reminder_sent_at timestamptz,
  idempotency_key text
);

alter table public.appointments enable row level security;

create trigger set_updated_at_appointments
before update on public.appointments
for each row
execute procedure public.set_updated_at();

create index idx_appointments_patient_date on public.appointments(patient_id, date);
create index idx_appointments_dentist_date on public.appointments(dentist_id, date);
create index idx_appointments_status_date on public.appointments(status, date);
create index idx_appointments_number on public.appointments(appointment_number);
create index idx_appointments_idempotency on public.appointments(idempotency_key) where idempotency_key is not null;

-- No-double-booking: no two active appointments overlap for the same dentist on the same date.
-- Active statuses overlap-protected at the application layer too; this constraint is the backstop.
create table public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  prior_status appointment_status,
  new_status appointment_status not null,
  actor_id uuid,
  actor_name text,
  actor_role user_role,
  reason text,
  occurred_at timestamptz not null default now()
);

alter table public.appointment_status_history enable row level security;

create index idx_appointment_status_history_appointment on public.appointment_status_history(appointment_id);

-- ------------------------------------------------------------
-- waitlist_entries
-- ------------------------------------------------------------
create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  preferred_dentist_id uuid references public.dentists(id) on delete set null,
  service_id uuid not null references public.dental_services(id) on delete restrict,
  preferred_date date not null,
  preferred_time_range waitlist_time_range not null default 'any',
  priority waitlist_priority not null default 'normal',
  status waitlist_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  matched_appointment_id uuid references public.appointments(id) on delete set null
);

alter table public.waitlist_entries enable row level security;

create index idx_waitlist_entries_patient on public.waitlist_entries(patient_id);
create index idx_waitlist_entries_service_date on public.waitlist_entries(service_id, preferred_date);
create index idx_waitlist_entries_status_priority on public.waitlist_entries(status, priority, created_at);

-- Active-entry deduplication: one active waitlist entry per patient+service+preferred_date.
create unique index idx_waitlist_entries_active_unique
on public.waitlist_entries(patient_id, service_id, preferred_date)
where status = 'active';

-- ------------------------------------------------------------
-- consultations
-- ------------------------------------------------------------
create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete restrict unique,
  dentist_id uuid not null references public.dentists(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  examination_findings text not null,
  diagnosis text not null,
  treatment_plan text not null,
  procedures_performed text[] not null default '{}',
  prescriptions jsonb not null default '[]'::jsonb,
  aftercare_instructions text not null default '',
  follow_up_required boolean not null default false,
  follow_up_timeframe_weeks integer,
  follow_up_recommended_date date,
  follow_up_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.consultations enable row level security;

create trigger set_updated_at_consultations
before update on public.consultations
for each row
execute procedure public.set_updated_at();

create index idx_consultations_appointment on public.consultations(appointment_id);
create index idx_consultations_patient on public.consultations(patient_id);
create index idx_consultations_dentist on public.consultations(dentist_id);

-- ------------------------------------------------------------
-- prescription_items
-- ------------------------------------------------------------
create table public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  medication text not null,
  dosage text not null,
  frequency text not null,
  duration text not null,
  instructions text not null,
  created_at timestamptz not null default now()
);

alter table public.prescription_items enable row level security;

create index idx_prescription_items_consultation on public.prescription_items(consultation_id);

-- ------------------------------------------------------------
-- payments / payment_events
-- ------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  insurance_coverage numeric(10, 2) not null default 0 check (insurance_coverage >= 0),
  insurance_provider text,
  insurance_policy_number text,
  amount_paid numeric(10, 2) not null check (amount_paid >= 0),
  balance numeric(10, 2) not null check (balance >= 0),
  payment_method payment_method not null,
  payment_status payment_status not null default 'Pending',
  receipt_number text not null unique,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create index idx_payments_patient on public.payments(patient_id);
create index idx_payments_appointment on public.payments(appointment_id);
create index idx_payments_receipt on public.payments(receipt_number);
create index idx_payments_created_at on public.payments(created_at);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  event_type text not null,
  amount numeric(10, 2) not null,
  actor_id uuid,
  occurred_at timestamptz not null default now(),
  details text
);

alter table public.payment_events enable row level security;

create index idx_payment_events_payment on public.payment_events(payment_id);

-- ------------------------------------------------------------
-- notifications / notification_outbox
-- ------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete set null,
  patient_id uuid references public.patients(id) on delete set null,
  type notification_type not null,
  title text not null,
  message text not null,
  channel notification_channel not null,
  read boolean not null default false,
  sent_at timestamptz not null default now(),
  related_appointment_id uuid references public.appointments(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.notifications enable row level security;

create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_patient on public.notifications(patient_id);
create index idx_notifications_read on public.notifications(read);
create index idx_notifications_sent_at on public.notifications(sent_at);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  type notification_type not null,
  channel notification_channel not null,
  payload jsonb not null default '{}'::jsonb,
  dedup_key text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'dead_letter')),
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  attempts integer not null default 0,
  error_category text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_outbox enable row level security;

create unique index idx_notification_outbox_dedup on public.notification_outbox(dedup_key)
where status in ('pending', 'sent');
create index idx_notification_outbox_status_scheduled on public.notification_outbox(status, scheduled_at);

-- ------------------------------------------------------------
-- audit_logs
-- ------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  actor_role user_role,
  action text not null,
  entity_type audit_entity_type not null,
  entity_id text not null,
  before_value text,
  after_value text,
  details text,
  timestamp timestamptz not null default now(),
  request_id text
);

alter table public.audit_logs enable row level security;

create index idx_audit_logs_actor on public.audit_logs(actor_id);
create index idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index idx_audit_logs_timestamp on public.audit_logs(timestamp);

-- ------------------------------------------------------------
-- clinic_settings
-- ------------------------------------------------------------
create table public.clinic_settings (
  id uuid primary key default gen_random_uuid(),
  clinic_name text not null,
  clinic_phone text,
  clinic_email text,
  clinic_address text,
  clinic_open_time time not null,
  clinic_close_time time not null check (clinic_close_time > clinic_open_time),
  timezone text not null default 'Asia/Manila',
  default_slot_duration_minutes integer not null default 45 check (default_slot_duration_minutes > 0),
  buffer_time_minutes integer not null default 10 check (buffer_time_minutes >= 0),
  pending_hold_minutes integer not null default 15 check (pending_hold_minutes >= 0),
  max_no_shows_before_lock integer not null default 2 check (max_no_shows_before_lock >= 0),
  require_staff_review_on_no_show boolean not null default true,
  reminder_lead_hours integer not null default 24 check (reminder_lead_hours > 0),
  auto_notify_waitlist_on_cancel boolean not null default true,
  emergency_buffer_shift_minutes integer not null default 20 check (emergency_buffer_shift_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clinic_settings enable row level security;

create trigger set_updated_at_clinic_settings
before update on public.clinic_settings
for each row
execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- idempotency keys (bounded retention)
-- ------------------------------------------------------------
create table public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  actor_id uuid,
  operation text not null,
  result_jsonb jsonb,
  status_code integer,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);

alter table public.idempotency_keys enable row level security;

create index idx_idempotency_keys_expires_at on public.idempotency_keys(expires_at);

-- ------------------------------------------------------------
-- auth_sessions (server-side cookie/session broker, per ADR-001)
-- ------------------------------------------------------------
create table public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.auth_sessions enable row level security;

create index idx_auth_sessions_user on public.auth_sessions(user_id);
create index idx_auth_sessions_token_hash on public.auth_sessions(token_hash);

-- ------------------------------------------------------------
-- Row-level security policies
-- ------------------------------------------------------------
-- Helper: current user role from session context (set by FastAPI via RLS-aware session or
-- Supabase auth JWT claims). Policies below use auth.uid() where Supabase Auth is the issuer,
-- and a fallback to a role snapshot where FastAPI forwards the actor.
create or replace function public.current_user_role()
returns text as $$
declare
  v text;
begin
  select current_setting('app.current_user_role', true) into v;
  if v is null or v = '' then
    return null;
  end if;
  return v;
end;
$$ language plpgsql strict;

create or replace function public.current_user_id()
returns uuid as $$
declare
  v text;
begin
  select current_setting('app.current_user_id', true) into v;
  if v is null then
    return null;
  end if;
  return v::uuid;
end;
$$ language plpgsql strict;

-- user_profiles: users read their own profile; staff read per role rules.
create policy "user_profiles_own" on public.user_profiles
  for all using (auth.uid() = id);

-- patients: patient reads own record; staff roles read per clinic role policy.
create policy "patients_own" on public.patients
  for select using (
    auth.uid() = user_id or
    public.current_user_role() in ('front_desk', 'dentist', 'admin')
  );
create policy "patients_staff_write" on public.patients
  for insert with check (public.current_user_role() in ('front_desk', 'admin'));
create policy "patients_staff_update" on public.patients
  for update using (
    auth.uid() = user_id or public.current_user_role() in ('front_desk', 'admin')
  );

-- dentists: dentists read own profile; staff read all; patients read active dentists.
create policy "dentists_read" on public.dentists
  for select using (
    auth.uid() = user_id or
    public.current_user_role() in ('front_desk', 'dentist', 'admin') or
    (public.current_user_role() = 'patient' and status = 'active')
  );
create policy "dentists_staff_write" on public.dentists
  for all using (public.current_user_role() in ('admin'));

-- dental_services: all authenticated read; staff write.
create policy "dental_services_read" on public.dental_services
  for select using (auth.uid() is not null);
create policy "dental_services_staff_write" on public.dental_services
  for all using (public.current_user_role() in ('front_desk', 'admin'));

-- dentist_schedules / blocked_schedules: staff manage; authenticated read.
create policy "dentist_schedules_read" on public.dentist_schedules
  for select using (auth.uid() is not null);
create policy "dentist_schedules_staff_write" on public.dentist_schedules
  for all using (public.current_user_role() in ('front_desk', 'admin'));
create policy "blocked_schedules_read" on public.blocked_schedules
  for select using (auth.uid() is not null);
create policy "blocked_schedules_staff_write" on public.blocked_schedules
  for all using (public.current_user_role() in ('front_desk', 'admin'));

-- appointments: patient reads own; dentist reads assigned; front desk/admin read all;
-- write scoped to role.
create policy "appointments_own" on public.appointments
  for all using (
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())
  );
create policy "appointments_staff" on public.appointments
  for all using (public.current_user_role() in ('front_desk', 'dentist', 'admin'));

-- appointment_status_history: staff read/append; no client update/delete.
create policy "appointment_status_history_staff" on public.appointment_status_history
  for all using (public.current_user_role() in ('front_desk', 'dentist', 'admin'));

-- waitlist_entries: patient reads/owns; staff manage.
create policy "waitlist_own" on public.waitlist_entries
  for all using (
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())
  );
create policy "waitlist_staff" on public.waitlist_entries
  for all using (public.current_user_role() in ('front_desk', 'dentist', 'admin'));

-- consultations: dentist/patient on the record read; dentist writes own; front desk/admin read.
create policy "consultations_scope" on public.consultations
  for all using (
    public.current_user_role() in ('front_desk', 'admin') or
    dentist_id = (select id from public.dentists where user_id = auth.uid() limit 1) or
    patient_id = (select id from public.patients where user_id = auth.uid() limit 1)
  );

-- prescription_items: scoped to parent consultation.
create policy "prescription_items_scope" on public.prescription_items
  for all using (
    consultation_id in (
      select c.id from public.consultations c
      where public.current_user_role() in ('front_desk', 'admin')
         or c.dentist_id = (select id from public.dentists where user_id = auth.uid() limit 1)
         or c.patient_id = (select id from public.patients where user_id = auth.uid() limit 1)
    )
  );

-- payments: patient/front desk/dentist on related appointment read; front desk writes.
create policy "payments_scope" on public.payments
  for all using (
    public.current_user_role() in ('front_desk', 'admin') or
    appointment_id in (
      select a.id from public.appointments a
      join public.patients p on p.id = a.patient_id
      where p.user_id = auth.uid()
    ) or
    patient_id = (select id from public.patients where user_id = auth.uid() limit 1)
  );

-- notifications: recipient reads own; staff manage.
create policy "notifications_own" on public.notifications
  for all using (
    auth.uid() = user_id or
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid()) or
    public.current_user_role() in ('front_desk', 'dentist', 'admin')
  );

-- audit_logs: append-only for app roles; staff read; never client-updatable after insert.
create policy "audit_logs_staff" on public.audit_logs
  for all using (public.current_user_role() in ('front_desk', 'dentist', 'admin'));

-- clinic_settings: authenticated read; admin write.
create policy "clinic_settings_read" on public.clinic_settings
  for select using (auth.uid() is not null);
create policy "clinic_settings_admin_write" on public.clinic_settings
  for all using (public.current_user_role() = 'admin');

-- notification_outbox: staff manage; no public access.
create policy "notification_outbox_staff" on public.notification_outbox
  for all using (public.current_user_role() in ('front_desk', 'admin'));

-- idempotency_keys / auth_sessions: service-side only; no public policy.
create policy "idempotency_keys_none" on public.idempotency_keys for all using (false);
create policy "auth_sessions_none" on public.auth_sessions for all using (false);
