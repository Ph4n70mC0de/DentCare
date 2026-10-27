-- Migration 005: fail-closed identity helper (current_user_role)
-- current_user_role() must not default to 'patient' when the trusted claim is absent.
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

-- Also ensure dental_services and schedules are not publicly readable by unauthenticated users.
-- (Re-create policies with authenticated restriction.)
drop policy if exists "dental_services_read" on public.dental_services;
create policy "dental_services_read" on public.dental_services
  for select using (auth.uid() is not null);

drop policy if exists "dentist_schedules_read" on public.dentist_schedules;
create policy "dentist_schedules_read" on public.dentist_schedules
  for select using (auth.uid() is not null);

drop policy if exists "blocked_schedules_read" on public.blocked_schedules;
create policy "blocked_schedules_read" on public.blocked_schedules
  for select using (auth.uid() is not null);

drop policy if exists "clinic_settings_read" on public.clinic_settings;
create policy "clinic_settings_read" on public.clinic_settings
  for select using (auth.uid() is not null);
