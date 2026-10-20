# ADR-001: Authentication, Session, and Database Access Strategy

## Status
Proposed

## Date
2026-10-20

## Context
DentCare is a React/Vite frontend currently backed by an in-memory store seeded from `localStorage` (`src/services/store.ts`, `src/services/useDentalServices.ts`). The audit determined this is a functional prototype, not a production data path. A production backend (FastAPI on Vercel) and Supabase Postgres/Auth must be added.

The existing API client (`src/services/api/client.ts`) assumes backend-managed sessions over Secure HttpOnly cookies (`credentials: 'include'`) and says the backend owns CSRF/origin validation. No backend currently implements that contract. A coherent identity strategy must be chosen before features are built, and the client, token lifecycle, threat model, and RLS architecture must remain consistent.

## Decision
**Recommended strategy:** Supabase Auth as the identity provider, plus a FastAPI-for-frontend session boundary.

- Supabase Auth handles user registration, email verification, password reset, MFA, and session management.
- FastAPI validates the Supabase JWT (or issues its own `Secure; HttpOnly; SameSite=Strict` session cookie after verifying the Supabase session), owns the cookie/session boundary, enforces CSRF/origin checks on unsafe methods, and never exposes service credentials or signing keys to the browser.
- Sensitive tokens are kept server-side. The browser only holds the session cookie.
- Every protected FastAPI request is authorized independently of UI state; the UI never determines a user's role or record access.
- Supabase Row-Level Security (RLS) is enabled on every user-exposed table, default-deny, with policies keyed to `auth.uid()` and the user's role snapshot. Normal user CRUD never uses the Supabase `service_role` key as a shortcut.

## Alternatives considered
1. **Bearer JWT stored in browser (localStorage/memory).** Rejected: vulnerable to XSS exfiltration, inconsistent with the existing cookie-based client contract, and harder to rotate/revoke centrally.
2. **Supabase Auth directly from the browser with `service_role` key.** Rejected: service_role bypasses RLS and must never reach the client.
3. **FastAPI-managed JWT only (no Supabase Auth).** Possible but duplicates identity features (password reset, MFA, email verification) already provided by Supabase Auth; increases surface area.

## Consequences
- Positive: single coherent identity source, HttpOnly cookies, server-side authorization, RLS defense-in-depth, audit-friendly session lifecycle.
- Negative: requires cookie/CSRF handling, CORS origin allowlisting, refresh-token rotation, and a session broker in FastAPI; adds operational complexity vs. a pure bearer design.
- The frontend login/register flows must be updated to send credentials over cookies and handle `401/403` as explicit session errors (not silent logouts).

## Related records
- DC-004 API contract freeze
- DC-005 Appointment workflow specification
- Supabase production checklist: https://supabase.com/docs/guides/deployment/going-into-prod
- Supabase JWT guidance: https://supabase.com/docs/guides/auth/jwts
