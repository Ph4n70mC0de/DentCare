# Vercel Setup

## Projects

- **Frontend project**: root directory = repository root. Framework = Vite. Build command = `npm run build`. Output directory = `dist`. SPA fallback via root `vercel.json`.
- **Backend project**: root directory = `backend/`. Runtime = Python (Vercel). Entry point = `index.py`. Config = `backend/vercel.json`.

## Environment variables

### Frontend (Preview and Production)
- `VITE_API_BASE_URL` — backend base URL including `/api/v1` (HTTPS in production)
- `VITE_APP_URL` — frontend origin

### Backend (server-only, Preview and Production)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `SESSION_SECRET`
- `SESSION_COOKIE_SECURE`
- `SESSION_COOKIE_SAMESITE`
- `CORS_ORIGINS`
- `ENVIRONMENT`

## Routing/rewrite decisions
- Frontend SPA fallback: all non-asset paths -> `index.html`.
- Backend: all paths -> `index.py` (FastAPI app).

## Domain/cookie setup
- If frontend and backend share a registrable domain, prefer same-site cookies (`SameSite=Lax`, shared parent domain).
- If cross-site, use `SameSite=None; Secure` and explicit CORS origins; verify browser cookie behavior.

## Final deployed URL manifest (placeholders)
- Frontend (preview): `https://<frontend-preview>.vercel.app`
- Frontend (production): `https://<frontend-prod>.vercel.app`
- Backend (preview): `https://<backend-preview>.vercel.app`
- Backend (production): `https://<backend-prod>.vercel.app`
