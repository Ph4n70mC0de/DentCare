# Deployment and Environment Configuration

## Environment contract

### Frontend (public build-time, Vite)

| Variable | Dev | Preview/Staging | Production |
|---|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` (local backend) | Staging API URL including `/api/v1` | Production API URL including `/api/v1`, HTTPS |
| `VITE_APP_URL` | `http://localhost:3000` | Preview/staging frontend origin | Production frontend origin |

- `VITE_API_BASE_URL` is validated at build time by `scripts/validate-env.mjs` (must be set and not localhost in deployed builds).
- Only `VITE_`-prefixed values are browser-visible. Never put secrets there.

### Backend (server-only)

| Variable | Notes |
|---|---|
| `SUPABASE_URL` | `https://tznapvnohrqcmonggvfs.supabase.co` |
| `SUPABASE_ANON_KEY` | Public anon key (owner-supplied). Not a secret, but required for Supabase Auth integration. |
| `DATABASE_URL` | Supabase Postgres pooler URL. Server-only. Never committed. |
| `SESSION_SECRET` | Strong random secret, unique per environment. No default in production. |
| `SESSION_COOKIE_SECURE` | `true` in production. |
| `SESSION_COOKIE_SAMESITE` | `lax` or `strict` depending on origin topology; verify in browser. |
| `CORS_ORIGINS` | Comma-separated exact origins. No wildcard with credentials. |
| `ENVIRONMENT` | `development`, `staging`, or `production`. |

### Vercel

- Frontend project: `vercel.json` builds `package.json` and serves `dist`; SPA fallback to `index.html`.
- Backend: deploy `backend/` as a Python function using `backend/vercel.json` / `backend/index.py`.
- Set environment variables per environment in the Vercel dashboard. Do not commit `.env`.

## Verification commands

Frontend:
```
npm ci
npm run lint
npm run lint:eslint
npm run format
npm test
npm run build
npm run test:e2e
```

Backend:
```
cd backend
pip install -e ".[dev]"
ruff check .
pytest -q
```

## Deployment stages

1. Local developer setup using `.env.example` files.
2. Local Supabase migration/reset + seed (`supabase/seed.sql`).
3. Vercel Preview/staging frontend + backend using staging Supabase project.
4. Run smoke + critical E2E flows in staging.
5. Review Supabase Security Advisor, RLS, grants, SSL/network restrictions, backup/restore.
6. Deploy production only after explicit environment + migration checklist.
7. Apply migrations in a controlled step before app code depends on them (expand/migrate/contract). Never wipe production data.
8. Post-deployment verify frontend load, `/health`, `/ready`, login/session restoration, booking conflict protection, permissions, logs, CORS/cookies, and a smoke test with an approved non-sensitive test account.
9. Document rollback/forward-fix procedures; database rollback must account for destructive migrations (prefer forward repair + verified backups).


- Vercel preview/production deployment not executed in this session.
- Playwright E2E not executed (requires staging API + Chromium).
- Supabase migration apply / RLS runtime verification not executed (requires DB password / access token).
- Browser cookie/CORS verification not executed.
