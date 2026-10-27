# Supabase Setup

## Project
- Reference: `tznapvnohrqcmonggvfs`
- URL: `https://tznapvnohrqcmonggvfs.supabase.co`
- Anon/public key: owner-supplied (public by design). No service-role key committed.

## Migration workflow
- Apply numbered migrations in `supabase/migrations/` via Supabase CLI.
- Seed test data via `supabase/seed.sql` (local/test only).
- Never modify production schema in the Dashboard.

## Connection string
- Use the transaction-mode pooler URL for serverless (port 6543) with `pgbouncer=true`.
- Migrations use direct session connection (port 5432).

## Auth redirect URLs
- Configure Supabase Auth redirect URLs to the frontend origin(s).

## RLS/Storage review
- RLS enabled on all public tables; policies default-deny for anon except documented public reads.
- Storage buckets for clinical documents are private; see `004_private_storage_buckets.sql`.

## Backup/security checks
- Enable PITR/backups in Supabase dashboard.
- Review Security Advisor before go-live.
- Verify SSL/network restrictions.

## Rollback cautions
- Database rollback must account for destructive migrations; prefer forward repair and verified backups over down-migrations.
