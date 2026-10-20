-- Dev-only disposable seed fixture. NEVER load into production.
-- Intended for local development and CI test databases only.

insert into public.clinic_settings (
  clinic_name, clinic_phone, clinic_email, clinic_address,
  clinic_open_time, clinic_close_time, timezone,
  default_slot_duration_minutes, buffer_time_minutes, pending_hold_minutes,
  max_no_shows_before_lock, require_staff_review_on_no_show,
  reminder_lead_hours, auto_notify_waitlist_on_cancel, emergency_buffer_shift_minutes
) values (
  'DentCare Dental Clinic & Specialties', '+1 (555) 248-3688', 'care@dentcare-clinic.com',
  '450 Health Sciences Parkway, Suite 300, Metro City', '08:30', '17:30', 'Asia/Manila',
  45, 10, 15, 2, true, 24, true, 20
);

-- Note: auth.users must be created via Supabase Auth (sign-up) before linking user_profiles.
-- This seed only creates profile rows; user_id links are established after auth account creation.

insert into public.user_profiles (id, role, full_name, email, phone, status) values
  ('11111111-1111-1111-1111-111111111101', 'admin', 'Dr. Eleanor Vance', 'admin@dentcare.com', '+1 (555) 019-2831', 'active'),
  ('11111111-1111-1111-1111-111111111102', 'front_desk', 'Clara Mendez', 'reception@dentcare.com', '+1 (555) 019-4455', 'active'),
  ('11111111-1111-1111-1111-111111111103', 'dentist', 'Dr. Marcus Vance, DDS', 'marcus.vance@dentcare.com', '+1 (555) 019-7711', 'active'),
  ('11111111-1111-1111-1111-111111111104', 'dentist', 'Dr. Sarah Lin, DMD', 'sarah.lin@dentcare.com', '+1 (555) 019-9922', 'active'),
  ('11111111-1111-1111-1111-111111111105', 'patient', 'James Wilson', 'james.wilson@example.com', '+1 (555) 321-7890', 'active');

insert into public.dentists (user_id, full_name, license_reference, specialization, contact, email, status, color_code) values
  ('11111111-1111-1111-1111-111111111103', 'Dr. Marcus Vance, DDS', 'DDS-CA-84920', 'Orthodontics & General Dentistry', '+1 (555) 019-7711', 'marcus.vance@dentcare.com', 'active', '#2563EB'),
  ('11111111-1111-1111-1111-111111111104', 'Dr. Sarah Lin, DMD', 'DMD-CA-93012', 'Endodontics & Restorative Surgery', '+1 (555) 019-9922', 'sarah.lin@dentcare.com', 'active', '#0D9488');

insert into public.dental_services (name, description, category, duration_minutes, price, active) values
  ('Check-up & Comprehensive Cleaning', 'Full oral examination, ultrasonic plaque & tartar scaling, polish.', 'General', 45, 95, true),
  ('Composite Dental Filling', 'Tooth-colored resin filling to restore cavity decay.', 'Restorative', 45, 160, true),
  ('Tooth Extraction (Simple / Surgical)', 'Safe extraction of damaged or impacted teeth.', 'Surgery', 60, 210, true),
  ('Root Canal Therapy (Endodontics)', 'Removal of infected pulp and canal filling.', 'Endodontics', 90, 780, true),
  ('Orthodontic Consultation & Adjustment', 'Assessment for clear aligners or braces.', 'Orthodontics', 30, 130, true),
  ('Emergency Dental Exam & Pain Triage', 'Same-day urgent assessment.', 'General', 30, 120, true),
  ('Teeth Whitening & Enamel Care', 'Professional in-chair bleaching treatment.', 'Cosmetic', 60, 290, true);

insert into public.dentist_schedules (dentist_id, day_of_week, start_time, end_time, break_start, break_end, active)
select d.id, s.day_of_week, s.start_time, s.end_time, s.break_start, s.break_end, true
from public.dentists d
cross join (
  values ('11111111-1111-1111-1111-111111111103', 1, '08:30', '17:30', '12:30', '13:30'),
         ('11111111-1111-1111-1111-111111111103', 2, '08:30', '17:30', '12:30', '13:30'),
         ('11111111-1111-1111-1111-111111111103', 3, '08:30', '17:30', '12:30', '13:30'),
         ('11111111-1111-1111-1111-111111111103', 4, '08:30', '17:30', '12:30', '13:30'),
         ('11111111-1111-1111-1111-111111111103', 5, '08:30', '17:30', '12:30', '13:30'),
         ('11111111-1111-1111-1111-111111111104', 2, '09:00', '17:00', '13:00', '14:00'),
         ('11111111-1111-1111-1111-111111111104', 3, '09:00', '17:00', '13:00', '14:00'),
         ('11111111-1111-1111-1111-111111111104', 4, '09:00', '17:00', '13:00', '14:00'),
         ('11111111-1111-1111-1111-111111111104', 5, '09:00', '17:00', '13:00', '14:00'),
         ('11111111-1111-1111-1111-111111111104', 6, '09:00', '17:00', '13:00', '14:00')
) as s(dentist_email, day_of_week, start_time, end_time, break_start, break_end)
where d.email = s.dentist_email;
