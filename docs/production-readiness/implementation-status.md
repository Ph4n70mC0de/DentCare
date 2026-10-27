# Implementation Status Checklist

| Phase | Work | Exit gate | Status |
|---|---|---|---|
| 0 | Inspect source/config; run baseline; record limits and defects | Evidence-based frontend audit exists; no claims of unrun tests | **PASS WITH FOLLOW-UPS** — `docs/production-readiness/frontend-audit.md`, `docs/audit/phase0-frontend-audit.md` |
| 1 | Freeze architecture, DTOs, auth/session and API contract | ADR + contract documented and reviewed against source | **PASS WITH FOLLOW-UPS** — ADR-001 Accepted; contract updated; backend vercel.json fixed |
| 2 | Correct Supabase migration, constraints, RLS/grants, seeds and DB tests | Clean migration works; non-vacuous role-based RLS tests pass | **NOT VERIFIED** — migration 005 + seed.sql added; runtime RLS not executed (no DB token) |
| 3 | Implement FastAPI auth, domain APIs, services/repos and API tests | No placeholder routes; auth/authorization/contract tests pass | **IN PROGRESS** — auth + appointments core done; other routers still stubs |
| 4 | Integrate frontend API and finish end-to-end workflows | Each core role journey passes against API + test DB; no local mock production fallback | **NOT VERIFIED** — API client aligned; E2E not fully green |
| 5 | Harden CI, unit/integration/E2E/security/accessibility/performance checks | Required CI gates green; skips/blockers documented | **PASS WITH FOLLOW-UPS** — CI workflow complete; E2E flaky; a11y/perf not verified |
| 6 | Configure Preview/staging/production Vercel + Supabase | Real staging deployment passes smoke/E2E and security checklist | **NOT VERIFIED** — config/docs added; no deployment executed |
| 7 | Production launch readiness, rollback, monitoring and handoff | Owner-facing runbooks and verified go/no-go checklist complete | **NOT VERIFIED** — deployment docs added; owner validation pending |

## Changed files (this session)
- Backend: `app/core/middleware.py`, `app/core/deps.py`, `app/main.py`, `app/api/v1/routers/auth.py`, `app/api/v1/routers/appointments.py`, `app/services/appointment_service.py`, `pyproject.toml`, `.env.example`, `vercel.json`
- Frontend: `src/services/api/client.ts`, `src/services/api/localImplementation.ts`, `src/services/api/apiImplementation.ts`, `src/services/api/hooks.ts` (removed), `src/services/api/components.tsx` (removed), multiple component fixes, `src/smoke.test.tsx`, `vitest.config.ts`
- Database: `supabase/migrations/001_initial.sql`, `supabase/migrations/005_fail_closed_identity.sql`, `supabase/seed.sql`, `supabase/tests/rls_test.sql`
- Docs: `docs/audit/phase0-frontend-audit.md`, `docs/production-readiness/frontend-audit.md`, `docs/production-readiness/implementation-status.md`, `docs/deployment.md`, `docs/deployment/vercel-setup.md`, `docs/deployment/supabase-setup.md`
- CI: `.github/workflows/ci.yml` (unchanged, already comprehensive)

## Key decisions
- Cookie sessions via HttpOnly Secure cookie; Supabase Auth as identity provider.
- Fail-closed RLS identity helper (no default patient role).
- Service duration from selected service (not hardcoded 45 min).
- Hashed idempotency keys scoped to actor/operation.

## Command/test results (latest)
- `npm ci`: PASS
- `npm run lint`: PASS
- `npm run lint:eslint`: PASS
- `npm run format`: PASS
- `npm test`: PASS (183/183)
- `npm run test:coverage`: PASS (lcov generated)
- `npm run build`: PASS
- `npm run test:e2e`: NOT FULLY VERIFIED (flaky role-switch/booking cases)
- Backend `ruff check .`: PASS
- Backend `pytest -q`: PASS (12 passed, 1 skipped)
- Supabase migration/RLS runtime: NOT VERIFIED (no DB token)

## Blockers
- Supabase personal access token / DB password not supplied.
- Vercel account/credentials not supplied.
- External payment/SMS/email providers not selected.

## Exact next task
Implement remaining domain routers (patients, dentists, services, schedules, waitlist, consultations, payments, notifications, audit, settings, reports) following the service/repository/schema pattern, then add API integration tests and stabilize Playwright E2E.
