-- Migration 004: Private storage buckets for clinical documents
-- Clinical files (consent forms, x-rays, referral letters) are stored in
-- private buckets and served only via signed URLs or an authorization-checked
-- endpoint. Never place patient files in a public bucket.

insert into storage.buckets (id, name, public)
values ('clinical-documents', 'clinical-documents', false);

-- RLS on storage.objects: patients read own uploads; staff read/write per role.
-- Supabase storage RLS uses auth.uid() and bucket name/bucket_id.
create policy "clinical_documents_patient_own"
on storage.objects
for select
using (
  bucket_id = 'clinical-documents' and
  (storage.folder(name))[1] = auth.uid()::text
);

create policy "clinical_documents_staff_manage"
on storage.objects
for all
using (
  bucket_id = 'clinical-documents' and
  exists (
    select 1 from public.user_profiles
    where id = auth.uid()
      and role in ('front_desk', 'dentist', 'admin')
      and status = 'active'
  )
);

create policy "clinical_documents_patient_upload"
on storage.objects
for insert
with check (
  bucket_id = 'clinical-documents' and
  (storage.folder(name))[1] = auth.uid()::text
);

-- Anonymous: no access to clinical documents bucket.
-- (Default deny: no policy grants anonymous access.)

-- Note: retention/deletion/export workflows for patient files are pending
-- clinic sign-off and will be implemented as server-side endpoints with audit logging.
