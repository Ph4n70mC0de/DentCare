# Phase 0 — Frontend Audit Report (DentCare)

**Date:** 2026-10-26
**Scope:** React/TypeScript/Vite frontend (`src/`), build, lint, tests, Vercel config.

## Baseline commands and results

| Command | Result |
|---|---|
| `npm run lint` (tsc --noEmit) | PASS (0 errors) |
| `npm run lint:eslint` | PASS after fixes (was 77 errors) |
| `npm run format` | PASS after `format:write` (84 files reformatted) |
| `npm test` | PASS: 12 test files, 183 tests (was 19 smoke failures) |
| `npm run build` (with `VITE_API_BASE_URL=https://api-staging.dentcare.example.com/api/v1`) | PASS: dist produced (705.99 kB JS) |
| `npm run test:e2e` (Playwright) | NOT VERIFIED — requires staging API and browser install; not run in this session. |

## Findings and fixes

1. **Smoke tests tested the legacy localStorage auth flow** (`dentalStore.setActiveUser`) instead of the `useDentalServices` bootstrap. Updated to await async render via `findBy*` and made tests async. Result: 183/183 pass.
2. **ESLint failures (77)** concentrated in dead code (`hooks.ts`, `components.tsx`) and React hooks misuse (`FollowUpModal`, `PaymentModal` calling hooks after early return), plus `any` casts and unused vars. Removed dead files, reordered hooks, replaced `any` with concrete/`never` casts, configured underscore-prefixed unused args.
3. **Prettier drift** across 84 files — reformatted.
4. **Backend ruff config** used legacy schema (`[tool.ruff] select`) incompatible with ruff 0.11; migrated to `[tool.ruff.lint]`. Fixed B904/F405 and long lines. `ruff check .` now passes.
5. **Backend deps** versions in environment differ from pyproject pins (FastAPI 0.143 vs <0.116); NOT VERIFIED against CI's pinned 0.115. Local tests pass (12 passed, 1 skipped).

## Security observations

- `VITE_API_BASE_URL` validated at build time (no localhost, HTTPS in prod). Good.
- No secrets in frontend env example. Good.
- Session carried via HttpOnly cookies; client uses `credentials: 'include'`. Good.
- `setActiveUser` is a no-op in production (`import.meta.env.PROD`). Good.

## NOT VERIFIED

- Playwright E2E (`npm run test:e2e`) — not executed (needs staging API + Chromium).
- Browser manual smoke / Lighthouse / accessibility audit — not executed.
- Supabase RLS policies execution — not run against a live DB.
- Vercel preview deployment — not performed.

## Final gate verification (this session)

- `npm run lint`: PASS
- `npm run lint:eslint`: PASS
- `npm run format`: PASS
- `npm test`: PASS (12 files, 183 tests)
- `npm run build`: PASS (dist produced)
- Backend `ruff check .`: PASS
- Backend `pytest`: PASS (12 passed, 1 skipped)


## Readiness decision

Frontend lint/typecheck/test/build gates are green. E2E, browser, accessibility, and deployment verification remain NOT VERIFIED. The system is **NOT yet declared 100% production-ready**; remaining gates must be executed in staging.
