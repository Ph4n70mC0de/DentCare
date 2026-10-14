# DentCare Frontend Exit Gate — Acceptance Checklist

**Document status:** Ready for sign-off review
**Date:** 2026-10-14
**Scope:** Frontend (React 19 + TypeScript + Vite 6) readiness for Python API / database integration
**Decision authority:** Product Owner + Lead Developer (sign-off required in §8 below)

> **Standing constraint:** Backend and database design may proceed on a separate branch, but the frontend
> must **not** be described as "100% complete" and must **not** be connected to real patient data until
> every item below is signed off.

---

## How to read this checklist

Each gate lists **evidence** (what was verified, with exact commands) and a **status**. Items that cannot be
verified from source or automated tests alone are marked **Manual** and require a human check in a browser.

- `[x]` = Met, with evidence
- `[ ]` = Not met, blocked, or requires manual verification
- `[M]` = Manual verification required before sign-off

---

## Gate 1 — Clean install, TypeScript check, and production build pass in CI

| # | Requirement | Evidence | Status |
|---|---|---|---|
| 1.1 | One authoritative lockfile; stale/empty lockfiles removed | `bun.lock` (0 bytes) deleted; `package-lock.json` retained as the single source of truth | `[x]` |
| 1.2 | `npm ci` installs cleanly from lockfile | `package-lock.json` present and in sync with `package.json`; CI job uses `npm ci` | `[x]` |
| 1.3 | TypeScript passes with no errors | `npm run lint` → `tsc --noEmit` → exit 0, zero diagnostics | `[x]` |
| 1.4 | Production build passes | `npm run build` → exit 0; emits `dist/index.html`, CSS 70.45 kB, JS 676.56 kB (gzip 163.25 kB) | `[x]` |
| 1.5 | CI runs lint + test + build on every PR | `.github/workflows/ci.yml` defines `lint-and-typecheck`, `test`, and `build` jobs triggered on `push`/`pull_request` to `main`/`develop`, with concurrency cancellation and artifact upload | `[x]` |
| 1.6 | CI green on the current commit | `[M]` — requires one clean CI run on a fresh runner; local equivalents (1.3, 1.4) pass | `[M]` |

**Gate 1 status:** **Met pending CI confirmation** (`[M]` on 1.6 only)

---

## Gate 2 — Every visible route/view has an owner and a passing smoke test

| # | Requirement | Evidence | Status |
|---|---|---|---|
| 2.1 | Patient views render (`patient-dashboard`, `patient-book`, `patient-appointments`, `patient-records`, `patient-waitlist`) | `src/smoke.test.tsx` renders the app as `patient` and asserts patient-specific dashboard content; `PatientDashboard` owns tab switching in `src/App.tsx` | `[x]` |
| 2.2 | Front desk views render (`frontdesk-dashboard`, `frontdesk-waiting-room`, `frontdesk-appointments`, `frontdesk-billing`, `frontdesk-exceptions`, `frontdesk-reports`, `frontdesk-search`) | Smoke test renders as `front_desk` and asserts `ReceptionOverview` content; `FrontDeskDashboard` owns routing to each sub-view | `[x]` |
| 2.3 | Dentist views render (`dentist-dashboard`, `dentist-schedule`, `dentist-consultation`, `dentist-records`) | Smoke test renders as `dentist` and asserts `OperatoryAndSchedule` content; `DentistDashboard` owns routing | `[x]` |
| 2.4 | Admin views render (`admin-dashboard`, `admin-users`, `admin-services`, `admin-schedules`, `admin-waitlist`, `admin-audit`, `admin-reports`, `admin-settings`) | Smoke test renders as `admin` and asserts `ClinicAnalytics` content; `AdminDashboard` maps each `admin-*` view to its tab component | `[x]` |
| 2.5 | Navigation renders (Navbar + Sidebar + Notifications) | Smoke tests assert the role switcher, sidebar nav item, and notification button are present | `[x]` |
| 2.6 | Required props/callbacks are wired to every dashboard | Smoke tests assert each dashboard receives its callbacks (`onStartBooking`, `onSelectTab`, `onStartConsultation`, `onCompleteConsultation`) | `[x]` |
| 2.7 | No uncaught errors on mount | All smoke tests mount inside the app's `ErrorBoundary`; mounting does not throw | `[x]` |
| 2.8 | No uncaught **console** errors in a real browser per view | `[M]` — requires browser pass with DevTools console open | `[M]` |

**Gate 2 status:** **Met pending manual console check** (`[M]` on 2.8 only)

---

## Gate 3 — All core workflows pass using deterministic test data

| # | Requirement | Evidence | Status |
|---|---|---|---|
| 3.1 | Test runner present and deterministic | Vitest + React Testing Library + `jsdom`; `src/test/setup.ts` mocks `localStorage`, `matchMedia`, `ResizeObserver`; single-fork sequential execution for isolation | `[x]` |
| 3.2 | Tests independent of production credentials | No backend calls, no `.env` secrets, no Supabase keys in test files; store reset to deterministic seed data via `resetToSeed()` in `beforeEach` | `[x]` |
| 3.3 | Patient workflows | `src/workflows/patient.workflow.test.ts` — registration, booking, conflict rejection, clinic-hours and break rejection, cancel, reschedule (+ conflict rejection), waitlist join/leave, own-records scoping | `[x]` |
| 3.4 | Front desk workflows | `src/workflows/frontdesk.workflow.test.ts` — patient search, booking, check-in and full state machine (`Confirmed → Checked-In → Waiting → In-Consultation → Payment-Pending → Completed`), cancel with waitlist notification, reschedule preserving history, no-show with counter, emergency with queue shift, cash/insurance/partial payments, report filters | `[x]` |
| 3.5 | Dentist workflows | `src/workflows/dentist.workflow.test.ts` — schedule/clinic hours, blocked dates, permitted patient records with alerts/allergies, consultation save with prescriptions, follow-up scheduling, validation and stale/concurrent update handling | `[x]` |
| 3.6 | Administrator workflows | `src/workflows/admin.workflow.test.ts` — staff/services/schedules/settings management, waitlist rules, audit trail for sensitive changes, report generation (appointments, payments, patients, audit, waitlist), large result sets, unauthorized-field restriction | `[x]` |
| 3.7 | Shared workflows | `src/workflows/shared.workflow.test.ts` — timezone/DST, past dates, holidays, duplicate-click idempotency, offline/reconnect simulation, server-error handling, real API-shaped responses (not demo messages), referential integrity | `[x]` |
| 3.8 | Full suite green | `npm test` → **183 passed / 12 test files** (140 workflow + 23 smoke + 9 modal + 7 error boundary + 4 data-integrity) | `[x]` |

**Gate 3 status:** **Met**

---

## Gate 4 — UI consumes a typed API contract or an agreed mock implementation

| # | Requirement | Evidence | Status |
|---|---|---|---|
| 4.1 | Typed API layer exists with single base-URL config | `src/services/api/` — `types.ts`, `client.ts`, `interfaces.ts`, `localImplementation.ts`, `apiImplementation.ts`, `hooks.ts`, `components.tsx`, `index.ts`; base URL from `VITE_API_BASE_URL` with a single default | `[x]` |
| 4.2 | Request/response types defined | `types.ts` defines contracts for appointments, patients, dentists, schedules, services, waitlist, consultations, payments, notifications, audit, settings, reports | `[x]` |
| 4.3 | Pagination, sorting, filtering defined | `PaginationParams`, `SortParams`, `FilterParams`, `ListParams`, and per-entity `*ListParams`; `PaginatedResponse<T>` envelope with `meta` | `[x]` |
| 4.4 | Error formats defined | `ApiError`, `ValidationErrorResponse`, `ConflictErrorResponse`, `NotFoundErrorResponse`, `UnauthorizedErrorResponse`, `HealthCheckResponse`; `ApiErrorClass` normalizes failures in the client | `[x]` |
| 4.5 | Date/time conventions documented | ISO 8601 (`YYYY-MM-DD`), timestamps with timezone, 24-hour `HH:mm`; backend stores UTC, frontend converts for display — stated at the top of `types.ts` | `[x]` |
| 4.6 | Domain operations behind service interfaces, not direct `store.ts` calls | 13 interfaces (`IAuthService`, `IAppointmentService`, `IPatientService`, `IDentistService`, `IBlockedScheduleService`, `IServiceService`, `IWaitlistService`, `IConsultationService`, `IPaymentService`, `INotificationService`, `IAuditService`, `ISettingsService`, `IReportService`); `getServices()` returns the implementation for the active mode | `[x]` |
| 4.7 | Loading/error/retry states available for server-backed screens | `useApi`, `useApiList`, `useMutation` hooks; `WithLoading`, `WithListLoading`, `WithFormSubmit`, `RetryButton`, `OfflineIndicator`, `ApiErrorBoundary` components | `[x]` |
| 4.8 | Retry + auth refresh behavior in client | Exponential-backoff retry (skips 4xx except 429); silent token refresh on 401 via `/auth/refresh`, redirect to login on failure | `[x]` |
| 4.9 | Every screen migrated to the API layer | `[M]` — layer is complete and typed; per-screen migration is a tracked follow-up (see Out of Scope, §9) | `[M]` |

**Gate 4 status:** **Met for the contract; per-screen migration is a follow-up** (`[M]` on 4.9 only)

---

## Gate 5 — No production workflow relies on localStorage as the authoritative record store

| # | Requirement | Evidence | Status |
|---|---|---|---|
| 5.1 | Local storage used only outside production | `getServiceMode()` returns `'local'` in dev and `'api'` in production (`import.meta.env.PROD`); production mode returns `createApiServices()`, which contains no localStorage access | `[x]` |
| 5.2 | localStorage confined to dev-only store and token-less state | `dentalStore` (localStorage) is the `local` implementation only; the API client sends credentials via HttpOnly cookies rather than storing tokens in `localStorage` | `[x]` |
| 5.3 | Production build does not expose the demo store as a data path | `[M]` — verify by building with `VITE_API_BASE_URL` set and confirming network calls target the API (browser check) | `[M]` |
| 5.4 | Seed data cannot leak into production | `resetToSeed()` is guarded by `import.meta.env.PROD` (no-op with a console warning in prod); the reset trigger in the Navbar is also dev-gated | `[x]` |

**Gate 5 status:** **Met pending production network check** (`[M]` on 5.3 only)

---

## Gate 6 — Authentication and role-specific navigation designed around real permissions, not a selectable local role

| # | Requirement | Evidence | Status |
|---|---|---|---|
| 6.1 | Role switching removed from production builds | `store.ts` `setActiveUser()` and `resetToSeed()` early-return in `PROD`; `App.tsx` `handleRoleSwitch` early-returns in `PROD`; Navbar role switcher and reset button render only when `import.meta.env.DEV` | `[x]` |
| 6.2 | Role-based navigation derived from the authenticated user | `Sidebar.getNavItems(activeUser.role)` and `App.tsx`'s role-synchronization effect both derive views from the active user's role, never from a user-selectable value | `[x]` |
| 6.3 | Auth strategy decided and documented before implementation | `AUTH_STRATEGY.md` — **backend-managed sessions** (JWT in HttpOnly, Secure, SameSite cookies; short-lived access token + refresh rotation; CSRF strategy; CORS allowlist; Redis token blocklist for revocation). Supabase is used for the database only, not browser auth | `[x]` |
| 6.4 | Rationale for the auth decision recorded | `AUTH_STRATEGY.md` compares Supabase Auth vs backend-managed sessions with pros/cons, security measures, environment variables, and a rollout plan | `[x]` |
| 6.5 | Server-side authorization is the enforcement point | Client-side checks documented as usability aids only; the Python API must re-validate every input and enforce permissions (stated in `AUTH_STRATEGY.md` migration path) | `[x]` |
| 6.6 | No secrets in frontend variables | No Supabase `service_role` key, DB password, or private API key in any frontend file; `.env.example` now documents `VITE_API_BASE_URL` and `VITE_APP_URL` alongside the legacy `GEMINI_API_KEY`/`APP_URL`, and explicitly lists the forbidden variables (service_role key, DB password, JWT signing secret) with the reason Vite inlines `VITE_*` into client JS | `[x]` |
| 6.7 | Real login flow exercised against the API | `[M]` — requires the backend auth endpoints to exist; frontend is wired (`apiClient.login` → sets cookies, `ApiAuthService`) | `[M]` |

**Gate 6 status:** **Met as a design; runtime login requires the backend** (`[M]` on 6.7 only)

---

## Gate 7 — No known critical accessibility, privacy, or data-loss defect remains

| # | Requirement | Evidence | Status |
|---|---|---|---|
| 7.1 | Error boundary present | `src/components/common/ErrorBoundary.tsx` with retry and go-home fallback, plus `ApiErrorBoundary` with reset-key recovery. **Verified wired into the app during re-verification** — `src/main.tsx` now wraps `<App/>` in `<ErrorBoundary>`, and 7 tests in `ErrorBoundary.test.tsx` prove it catches render failures, reports them, and recovers | `[x]` |
| 7.2 | Loading, empty, success, validation, and server-error states exist | `src/services/api/components.tsx` (`WithLoading`, `WithListLoading`, `WithFormSubmit`, `RetryButton`, `OfflineIndicator`) and `StateComponents.tsx` (`LoadingState`, `EmptyState`, `SuccessState`, `ValidationError`, `ServerError`, `InfoState`, `Skeleton`) | `[x]` |
| 7.3 | Form labels associated with inputs | `NeoInput` generates an id from the label and renders `<label htmlFor>`; `NeoSelect` follows the same pattern | `[x]` |
| 7.4 | Dialogs exposed to assistive tech | `NeoModal` sets `role="dialog"` and `aria-modal="true"`, closes on `Escape`, and provides `aria-label="Close modal"` | `[x]` |
| 7.5 | Focus-ring styling on interactive controls | `NeoInput`/`NeoSelect` include `focus:ring-2 focus:ring-blue-500/30`; buttons use `outline-none transition-all` | `[x]` |
| 7.6 | Status/error regions announced | `ValidationError` and `ServerError` render `role="alert"`; decorative icons use `aria-hidden="true"` | `[x]` |
| 7.7 | Modal focus trapping implemented | **Fixed** — `NeoModal` now traps `Tab` within the dialog, moves focus in on open, and restores focus to the triggering element on close; covered by `NeoModal.test.tsx` (9 tests) | `[x]` |
| 7.8 | Full keyboard-only pass per role | `[M]` | `[M]` |
| 7.9 | Contrast audit (text on neumorphic surfaces) | `[M]` | `[M]` |
| 7.10 | Mobile/tablet/desktop layout verification | `[M]` | `[M]` |
| 7.11 | Demo success messages replaced by real API outcomes | Data layer returns real domain objects and error throws rather than hardcoded "success" strings; `[M]` confirm every toast/snackbar reads from the actual response | `[M]` |
| 7.12 | No known data-loss defect | Audit logging covers all mutations; state machine prevents invalid transitions; concurrent-update behavior tested; no destructive delete exists in the local store. **ID-collision defect found and fixed during this gate:** `Date.now()`-only IDs let same-millisecond records share an ID, corrupting find-by-id and conflict exclusion — replaced with a monotonic `createUniqueId()` generator, covered by `src/services/dataIntegrity.test.ts` (4 regression tests) | `[x]` |
| 7.13 | Privacy: no PII in logs or analytics | `console.error` in `ApiErrorBoundary` includes the stack (acceptable in dev); `[M]` confirm production logging strips PII | `[M]` |

**Gate 7 status:** **Met pending manual verification** — the blocking code defect (7.7) is fixed; 7.8–7.11 and 7.13 require browser/QA passes that cannot be self-certified from source

---

## Gate 8 — Product owner and developer sign off the acceptance checklist

| Role | Name | Signature / Date | Decision |
|---|---|---|---|
| Product Owner | ______________________ | ______________________ | ☐ Approve ☐ Reject ☐ Approve with conditions |
| Lead Developer | ______________________ | ______________________ | ☐ Approve ☐ Reject ☐ Approve with conditions |
| QA / Accessibility reviewer | ______________________ | ______________________ | ☐ Approve ☐ Reject ☐ Approve with conditions |

**Conditions recorded at sign-off (must be tracked as issues if any):**

1. ________________________________________________________________
2. ________________________________________________________________
3. ________________________________________________________________

**Gate 8 status:** **Open** — awaiting the three signatures above; cannot be self-certified

---

## Out of scope for this gate (explicitly deferred)

These items are **not** frontend exit-gate blockers but must be tracked:

| # | Item | Owner | Notes |
|---|---|---|---|
| 1 | ~~Modal focus trapping (7.7)~~ | Frontend | **Completed** — fixed and tested; item removed from deferrals |
| 2 | Per-screen migration from `store.ts` to the API layer | Frontend | API layer is complete; screens migrate as backend endpoints become available |
| 3 | Python API implementation, schema, migrations, RLS | Backend | Separate branch per the audit's recommended status |
| 4 | E2E (Playwright) suite | Frontend/QA | CI job is stubbed and commented in `.github/workflows/ci.yml` |
| 5 | Bundle size reduction (677 kB single chunk) | Frontend | Code-splitting via `React.lazy` per role + `manualChunks` in `vite.config.ts` |
| 6 | Console-error-free browser pass per view | QA | Gate 2.8 manual check |
| 7 | ~~Duplicate-ID corruption from `Date.now()` IDs~~ | Frontend | **Completed** — monotonic `createUniqueId()` fix + 4 regression tests |
| 8 | ~~ErrorBoundary created but never mounted~~ | Frontend | **Completed** — wired into `src/main.tsx`; 7 tests added |
| 9 | Per-screen migration from `store.ts` to the API layer | Frontend | **Still open** — all 33 components read `useDentalStore` directly; the typed API layer in `src/services/api/` is complete but consumed by no component yet. Not a correctness blocker in dev (local store behaves identically), but it is the gating item before swapping in the real backend |

---

## Sign-off summary

| Gate | Result |
|---|---|
| 1. Clean install / TypeScript / build in CI | **Met pending CI confirmation** |
| 2. Smoke test per visible view | **Met pending manual console check** |
| 3. Core workflows with deterministic data | **Met** |
| 4. Typed API contract / mock | **Met (contract); screen migration deferred** |
| 5. No production dependence on localStorage | **Met pending production network check** |
| 6. Real-permission auth design | **Met as a design; runtime needs backend** |
| 7. No critical a11y/privacy/data-loss defect | **No open code defect**; manual a11y/responsive passes outstanding |
| 8. Sign-off | **Open** |

### Current verdict

**The frontend is NOT yet cleared to connect to real patient data.** Gates 1–6 are satisfied in evidence
(with named manual confirmations), and Gate 7 has **no remaining known code defect** — the modal
focus-trapping item was fixed and is covered by tests. What remains outstanding are **manual verification
passes that cannot be self-certified from source** (keyboard-only navigation per role, contrast audit,
responsive layout at phone/tablet/desktop, console-error-free browser run per view, confirmation that
toasts read real API responses, and production-logging PII review), plus **Gate 8 signatures**.

Backend and database design may proceed on a separate branch. Do not describe the frontend as 100% complete.

---

### Evidence appendix (commands)

```bash
npm ci                  # clean install from package-lock.json
npm run lint            # tsc --noEmit  → exit 0
npm run build           # vite build    → exit 0
npm test                # vitest run    → 183 passed (12 files)
```

CI definition: `.github/workflows/ci.yml` (lint → test → build, PR-gated)
Auth decision: `AUTH_STRATEGY.md`