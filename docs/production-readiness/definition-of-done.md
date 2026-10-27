# Definition of Done — Production Readiness

- [~] Frontend readiness report has a defensible PASS status (PASS WITH EXPLICIT NON-BLOCKING FOLLOW-UPS) — `docs/production-readiness/frontend-audit.md`
- [ ] Existing UI/UX, desktop/mobile, all required roles, and exception workflows browser-tested — E2E partially failing/flaky
- [ ] Frontend connected to real API in production; no seeded/localStorage source of truth in production-critical workflows — API client wired; production deployment not executed
- [ ] All required FastAPI routes persist/read actual database state, enforce authz, validate requests, typed responses, tests — auth + appointments done; other routers still stubs
- [ ] Supabase migrations run cleanly in blank local env; RLS/grants least-privilege; tests prove allowed/denied — migration 005 + seed.sql added; runtime NOT VERIFIED
- [~] Booking concurrency, status transitions, idempotency, scheduling/timezone rules enforced and tested — DB constraints exist; concurrency tests NOT VERIFIED
- [x] Secrets absent from source control/build artifacts/logs; service-role/database/session secrets backend-only — `.env.example` placeholders only; no secrets committed
- [ ] Auth, cookies, CORS, CSRF/origin, revocation/expiry, role/record authorization work in real browser — code present; browser verification NOT VERIFIED
- [~] Frontend/backend DTOs, casing, route paths, pagination, errors, timestamps contract coverage — auth endpoint aligned; error envelope includes timestamp; full contract tests NOT VERIFIED
- [ ] Core critical-path Playwright tests pass against staging — E2E not fully green
- [~] Correct Vercel configs deploy frontend and Python backend; env vars separated across Preview/Production — configs valid; deployment NOT EXECUTED
- [~] Monitoring/logging, health/readiness endpoints, dependency audit, backup/restore, rollback instructions, operational handoff documented — health/ready + docs present
- [x] External integrations not provisioned (SMS, email, payment processor, custom domain) explicitly marked as not configured — documented in contract and deployment docs

Legend: [x] done/evidenced, [~] partially done, [ ] not done/not verified.
