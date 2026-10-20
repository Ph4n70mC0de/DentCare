-- RLS integration tests.
-- Run against a fresh local Supabase database after applying migrations.
-- Sets app.current_user_id / app.current_user_role to simulate actor context,
-- then asserts expected row-level access. Each assertion raises an exception
-- on failure so CI can fail the build.

\set ON_ERROR_STOP on

-- Helper assertion: expect zero rows visible to current role.
create or replace procedure public.assert_no_rows(query text)
language plpgsql as $$
declare
  cnt integer;
begin
  execute 'select count(*) from (' || query || ') as t' into cnt;
  if cnt > 0 then
    raise exception 'RLS violation: expected 0 rows, got %', cnt;
  end if;
end;
$$;

-- Patient A must not see Patient B's records.
set app.current_user_id = '11111111-1111-1111-1111-111111111105'; -- James Wilson (patient)
set app.current_user_role = 'patient';

call public.assert_no_rows(
  'select id from public.patients where full_name <> ''James Wilson'''
);
call public.assert_no_rows(
  'select id from public.appointments where patient_id <> (select id from public.patients where user_id = current_setting(''app.current_user_id'', true)::uuid)'
);

-- Dentist must not read unassigned clinical records (consultations of other dentists).
set app.current_user_id = '11111111-1111-1111-1111-111111111103'; -- Dr. Marcus Vance
set app.current_user_role = 'dentist';

call public.assert_no_rows(
  'select c.id from public.consultations c where c.dentist_id <> (select id from public.dentists where user_id = current_setting(''app.current_user_id'', true)::uuid)'
);

-- Anonymous (no role set) must not read patient or appointment tables.
reset app.current_user_id;
reset app.current_user_role;
call public.assert_no_rows('select id from public.patients');
call public.assert_no_rows('select id from public.appointments');

select 'rls_tests_passed' as result;
