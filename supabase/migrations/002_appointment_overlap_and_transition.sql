-- Migration 002: Appointment overlap protection and state-machine guard
-- Adds a database-level exclusion constraint preventing overlapping active
-- appointments for the same dentist on the same date, plus a PL/pgSQL guard
-- function for legal status transitions applied server-side.

-- Extension required for exclusion constraints with range types.
create extension if not exists btree_gist;

-- Exclusion constraint: no two active appointments may overlap in time for
-- the same dentist on the same date. Active statuses are treated as booked
-- slots; Cancelled and No-Show do not block.
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    dentist_id with =,
    (date) with =,
    tstzrange(
      timezone('UTC', (date || ' ' || start_time)::timestamp),
      timezone('UTC', (date || ' ' || end_time)::timestamp),
      '[)'
    ) with &&
  )
  where (status <> 'Cancelled' and status <> 'No-Show');

-- Guard function: returns true if the transition prior_status -> new_status
-- is permitted. Application layer must still validate, but this is the DB
-- backstop used by triggers or direct SQL calls.
create or replace function public.is_valid_appointment_transition(
  prior_status appointment_status,
  new_status appointment_status
) returns boolean language sql stable as $$
  select case
    when prior_status = 'Requested' then new_status in ('Confirmed','Cancelled','Rescheduled','No-Show')
    when prior_status = 'Pending'   then new_status in ('Confirmed','Cancelled','Rescheduled','No-Show')
    when prior_status = 'Confirmed' then new_status in ('Checked-In','Cancelled','Rescheduled','No-Show')
    when prior_status = 'Waitlisted' then new_status in ('Confirmed','Cancelled')
    when prior_status = 'Rescheduled' then false
    when prior_status = 'Cancelled' then false
    when prior_status = 'Checked-In' then new_status = 'Waiting'
    when prior_status = 'Waiting' then new_status = 'In-Consultation'
    when prior_status = 'In-Consultation' then new_status = 'Payment-Pending'
    when prior_status = 'Payment-Pending' then new_status = 'Completed'
    when prior_status = 'Completed' then false
    when prior_status = 'No-Show' then false
    when prior_status = 'Emergency' then new_status = 'In-Consultation'
    else false
  end;
$$;

-- Trigger: reject illegal appointment status transitions on update.
create or replace function public.enforce_appointment_transition()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if not public.is_valid_appointment_transition(old.status, new.status) then
      raise exception 'Illegal appointment transition % -> %', old.status, new.status
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger appointments_enforce_transition
before update of status on public.appointments
for each row
execute procedure public.enforce_appointment_transition();

-- Index for transition-history lookups by status change.
create index idx_appointment_status_history_transition
  on public.appointment_status_history(prior_status, new_status, occurred_at);
