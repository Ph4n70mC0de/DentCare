-- Deterministic local/test seed data. NEVER apply to production.
-- Uses fixed UUIDs so RLS tests can assert exact ownership.

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111101', 'admin@dentcare.test', now(), '{"role":"admin"}'),
  ('11111111-1111-1111-1111-111111111102', 'frontdesk@dentcare.test', now(), '{"role":"front_desk"}'),
  ('11111111-1111-1111-1111-111111111103', 'dentist1@dentcare.test', now(), '{"role":"dentist"}'),
  ('11111111-1111-1111-1111-111111111104', 'dentist2@dentcare.test', now(), '{"role":"dentist"}'),
  ('11111111-1111-1111-1111-111111111105', 'patienta@dentcare.test', now(), '{"role":"patient"}'),
  ('11111111-1111-1111-1111-111111111106', 'patientb@dentcare.test', now(), '{"role":"patient"}')
on conflict (id) do nothing;

insert into public.user_profiles (id, role, status, full_name, email)
values
  ('11111111-1111-1111-1111-111111111101', 'admin', 'active', 'Admin User', 'admin@dentcare.test'),
  ('11111111-1111-1111-1111-111111111102', 'front_desk', 'active', 'Front Desk User', 'frontdesk@dentcare.test'),
  ('11111111-1111-1111-1111-111111111103', 'dentist', 'active', 'Dr. Marcus Vance', 'dentist1@dentcare.test'),
  ('11111111-1111-1111-1111-111111111104', 'dentist', 'active', 'Dr. Sarah Lin', 'dentist2@dentcare.test'),
  ('11111111-1111-1111-1111-111111111105', 'patient', 'active', 'James Wilson', 'patienta@dentcare.test'),
  ('11111111-1111-1111-1111-111111111106', 'patient', 'active', 'Emily Chen', 'patientb@dentcare.test')
on conflict (id) do nothing;

insert into public.dentists (id, user_id, full_name, status)
values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111103', 'Dr. Marcus Vance', 'active'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111104', 'Dr. Sarah Lin', 'active')
on conflict (id) do nothing;

insert into public.patients (id, user_id, patient_number, full_name, email, phone)
values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111105', 'PAT-001', 'James Wilson', 'patienta@dentcare.test', '+1-555-0101'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111106', 'PAT-002', 'Emily Chen', 'patientb@dentcare.test', '+1-555-0102')
on conflict (id) do nothing;

insert into public.dental_services (id, name, category, price, duration_minutes, active)
values
  ('44444444-4444-4444-4444-444444444401', 'Cleaning', 'General', 100.00, 30, true)
on conflict (id) do nothing;

insert into public.appointments (id, appointment_number, patient_id, dentist_id, service_id, date, start_time, end_time, status, booking_source)
values
  ('55555555-5555-5555-5555-555555555501', 'APT-001', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444401', '2026-11-02', '09:00', '09:30', 'Confirmed', 'app'),
  ('55555555-5555-5555-5555-555555555502', 'APT-002', '33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202', '44444444-4444-4444-4444-444444444401', '2026-11-02', '10:00', '10:30', 'Confirmed', 'app')
on conflict (id) do nothing;

insert into public.consultations (id, appointment_id, dentist_id, patient_id, examination_findings, diagnosis, treatment_plan)
values
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333301', 'Findings A', 'Diagnosis A', 'Plan A'),
  ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555502', '22222222-2222-2222-2222-222222222202', '33333333-3333-3333-3333-333333333302', 'Findings B', 'Diagnosis B', 'Plan B')
on conflict (id) do nothing;
