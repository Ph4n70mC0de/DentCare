# DentCare production implementation plan

## 1. Goal and target architecture

Move DentCare from a browser-persisted React prototype to a production web application with a React/TypeScript frontend, a Python API, Supabase PostgreSQL, Supabase Auth (if selected), and Vercel deployment for the frontend.

Recommended request path:

```text
Patient / Front desk / Dentist / Admin
                 |
            Vercel frontend
          React + TypeScript
                 |
          HTTPS API requests
                 |
        Python API service
       (FastAPI recommended)
          |             |
    Supabase Auth   PostgreSQL
    token checks    via controlled DB access
          |
  authorization, validation,
  transactions, audit events
```

The Python API can run on a Python-capable hosting platform. Vercel should host the frontend and can host Python functions only if the chosen framework/runtime, request duration, connection handling, and deployment constraints are verified. Do not assume that a long-running FastAPI server can be deployed on Vercel exactly like a traditional server. For a first production release, use Vercel for the Vite frontend and a dedicated Python API host unless a tested Vercel Python deployment is an explicit requirement.

Supabase provides PostgreSQL and can provide Auth and Storage. The API must enforce business rules. If the API uses a privileged Supabase service-role key, that key must remain server-side, never be exposed to the browser, and access must be narrowly controlled. Decide whether row-level security (RLS) is also used as defense in depth; test policies using real user claims.

## 2. Current state and release decision

The supplied archive includes a broad React/TypeScript UI and demo data. The store at `src/services/store.ts` uses `localStorage`; `src/data/seedData.ts` supplies initial data. No production Python API or Supabase schema was identified in the inspected source inventory.

`npm run lint` currently fails with eight TypeScript errors. `npm run build` could not be verified because the archived dependency tree had a non-executable Vite launcher and lacked Rollup's platform-specific optional dependency. The build result is therefore **unknown**, not a pass.

**Release decision:** do not call the current version production-ready. Fix the frontend gate in `DentCare-frontend-audit.md`, then connect features in vertical slices. Database/API design can be prepared in parallel.

## 3. Delivery phases and gates

### Phase 0: Repository and baseline

**Tasks**
- [ ] Preserve the current prototype as a tagged baseline or branch.
- [ ] Remove committed `node_modules`, `.git` internals, local build output, real secrets, and machine-specific artifacts from distribution archives.
- [ ] Choose npm or Bun as the official package manager and keep one valid lockfile.
- [ ] Add CI for clean install, type checking, build, tests, and dependency/security checks.
- [ ] Capture screenshots and workflow notes for the existing UI.
- [ ] Establish dev, staging, and production environments with separate credentials and data.

**Exit gate:** a clean checkout installs reproducibly and CI records the current failures without relying on a developer's local environment.

### Phase 1: Frontend stabilization

Use `DentCare-frontend-audit.md` as the acceptance checklist.

**Tasks**
- [ ] Resolve the eight current TypeScript errors.
- [ ] Pass clean install, type check, and production build.
- [ ] Add unit/component/integration tests for the critical flows.
- [ ] Verify patient, front-desk, dentist, and admin navigation and permissions.
- [ ] Test form validation, modal behavior, empty/loading/error states, mobile layouts, keyboard navigation, and accessibility.
- [ ] Replace local domain persistence with an API adapter interface. Temporary mock data can implement the same interface for UI tests.
- [ ] Remove local role selection from production and avoid treating localStorage data as authoritative.
- [ ] Approve a screen-to-endpoint matrix and API contract before wiring screens to the real backend.

**Exit gate:** frontend audit criteria pass and the API contract is approved.

### Phase 2: Domain model and Supabase database

Create version-controlled SQL migrations. Avoid creating the production schema only through manual dashboard edits.

**Initial entities to evaluate against actual UI requirements**
- `profiles` or `user_profiles`: user ID linked to Supabase Auth, display name, account state, timestamps.
- `clinics`: clinic identity and configuration, if multi-clinic operation is required.
- `clinic_memberships`: user, clinic, role, status, and scope.
- `patients`: demographic and contact data, with carefully controlled access.
- `dentists`: professional profile and user link.
- `dental_services`: service description, duration, price, active state, category.
- `dentist_schedules`: recurring working hours and effective dates.
- `blocked_schedules`: holidays, leave, and unavailable periods.
- `appointments`: patient, dentist, service, start/end timestamps, status, reason, creation/update metadata.
- `waitlist_entries`: patient, service, preferences, priority, status.
- `consultations`: appointment/patient references, clinical notes, diagnosis, treatment plan, completion metadata.
- `prescriptions`: consultation, author, medication instructions, status.
- `invoices` and `payments`: amount, currency, status, provider/reference, idempotency key, timestamps. Keep payment-card data out of the application database.
- `notifications`: recipient, type, content/reference, read state, delivery state.
- `audit_events`: actor, action, entity type/id, timestamp, request correlation ID, limited metadata.
- `clinic_settings`: clinic-level configuration with explicit fields and constraints.

This list is a starting proposal, not a final schema. Review all TypeScript types and screens, then normalize the schema and define which records are global versus clinic-scoped.

**Database rules**
- [ ] Use UUID primary keys and foreign keys.
- [ ] Add `created_at` and `updated_at` where appropriate; manage updates consistently.
- [ ] Use explicit enums/check constraints for appointment, waitlist, payment, and account statuses.
- [ ] Store appointment timestamps in `timestamptz`; document clinic timezone and display conversions.
- [ ] Prevent invalid appointment intervals (`ends_at > starts_at`) and duplicate/conflicting bookings.
- [ ] Prevent overlapping active bookings for a dentist/operatory using a transaction-safe strategy. PostgreSQL exclusion constraints can help when the model supports them; otherwise use a transaction and appropriate locking. A UI availability check alone is insufficient.
- [ ] Add indexes for common filters: clinic, patient, dentist, appointment start, status, and foreign keys.
- [ ] Define retention, archival, deletion, and correction policies for clinical and audit records.
- [ ] Create synthetic development seed data; never copy real patient records into test environments.
- [ ] Write migrations and rollback/recovery notes; test migrations on a disposable database before staging.

**RLS and data access**
- [ ] Enable RLS on tables exposed through Supabase APIs.
- [ ] Write policies for patient self-access, assigned dentist access, front-desk access, and administrator access according to approved clinic policy.
- [ ] Include clinic membership/scope checks where applicable.
- [ ] Test both allowed and denied operations for every role.
- [ ] Keep service-role credentials exclusively in server-side secrets.
- [ ] If all database access goes through Python, restrict direct client table access and still define a defense-in-depth policy where appropriate.
- [ ] Do not rely on hidden UI buttons as authorization.

**Exit gate:** reviewed migrations apply cleanly; constraints and indexes are tested; role-based access tests pass; synthetic data is available.

### Phase 3: Python API and business rules

Use FastAPI unless the project has a strong reason to standardize on another Python framework. Keep API routes, schemas, domain services, database access, and configuration separated.

Suggested layout:

```text
backend/
  app/
    main.py
    core/            # settings, logging, auth dependencies
    api/v1/           # route handlers
    schemas/          # request and response validation
    services/         # business rules and workflows
    repositories/     # database access
    security/         # token verification and permissions
    tests/
  migrations/         # or a dedicated SQL migrations directory
  pyproject.toml
  .env.example
  Dockerfile          # if required by the selected host
```

**API conventions**
- [ ] Version endpoints under `/api/v1`.
- [ ] Use Pydantic request/response schemas and return consistent error shapes.
- [ ] Validate every input on the server.
- [ ] Verify Supabase JWTs using a supported, secure verification method; validate issuer, audience, expiry, and signature/key rotation behavior.
- [ ] Centralize role and clinic-scope authorization in dependencies/services.
- [ ] Use transactions for booking, appointment state transitions, and payment records.
- [ ] Use idempotency keys for booking/payment operations that may be retried.
- [ ] Use pagination and server-side filtering for patient lists, appointments, reports, and audit events.
- [ ] Add rate limits to sign-in-adjacent, search, booking, and sensitive endpoints where appropriate.
- [ ] Use structured logs with request IDs; never log passwords, access tokens, full clinical notes, or payment secrets.
- [ ] Generate OpenAPI documentation and use it to align frontend types or maintain a checked-in contract.

**Initial endpoint map**
- `GET /api/v1/me`: authenticated user and allowed clinic memberships.
- `GET/POST /api/v1/patients`; `GET/PATCH /api/v1/patients/{id}`.
- `GET /api/v1/services`; admin-only create/update/deactivate routes.
- `GET /api/v1/dentists`; `GET /api/v1/dentists/{id}/availability`.
- `GET/POST /api/v1/appointments`; `GET/PATCH /api/v1/appointments/{id}`.
- `POST /api/v1/appointments/{id}/cancel`, `/reschedule`, `/check-in`, and `/complete` for explicit state transitions.
- `GET/POST /api/v1/waitlist`; role-appropriate update/leave routes.
- `GET/POST /api/v1/consultations`; consultation update/completion routes.
- `GET/POST /api/v1/prescriptions` according to clinician permissions.
- `GET/POST /api/v1/invoices`; `POST /api/v1/payments` only after payment-provider design is approved.
- `GET /api/v1/notifications`; `POST /api/v1/notifications/{id}/read`.
- `GET /api/v1/reports/...` with strict permissions and bounded date ranges.
- `GET /api/v1/audit-events` for authorized administrators only.

Adjust endpoints after mapping actual UI actions and agreeing state transitions. Avoid one generic endpoint that lets the client write arbitrary status values.

**Exit gate:** OpenAPI contract reviewed, unit tests pass, authorization-denial tests pass, database transaction behavior is verified, and staging deployment works.

### Phase 4: Replace local persistence with the API

Migrate by vertical slice so each delivered feature is usable and testable.

1. Authentication and `/me` identity.
2. Services, dentist directory, clinic hours, and availability.
3. Patient profile and patient directory.
4. Appointment booking and conflict prevention.
5. Appointment view, cancellation, rescheduling, check-in, and no-show.
6. Waitlist.
7. Consultation, clinical history, treatment plan, and prescriptions.
8. Invoices and payment-provider integration.
9. Notifications.
10. Admin settings, reports, exports, and audit events.

For each slice:
- [ ] Add backend migrations and API tests.
- [ ] Add frontend API methods and loading/error handling.
- [ ] Test success, validation failure, permission denial, conflict, retry, and server failure.
- [ ] Confirm refresh and sign-in on a second browser/device show server data.
- [ ] Remove the corresponding `localStorage` read/write path after cutover.
- [ ] Keep a feature flag or rollback plan until staging acceptance passes.

Do not migrate all screens in one large change. Keep mock adapters available for frontend tests, but ensure production configuration cannot silently fall back to fake success or demo records.

### Phase 5: Security, privacy, and operational readiness

- [ ] Complete a data inventory and identify personal and clinical information.
- [ ] Apply least privilege to database roles, API credentials, and staff permissions.
- [ ] Use TLS for all network traffic and secure, HttpOnly cookies or a well-reviewed token strategy where applicable.
- [ ] Configure CORS for known frontend origins; do not use unrestricted origins with credentials.
- [ ] Add CSRF protection if cookie-based authentication is used.
- [ ] Validate uploads and file types if document/image upload is added; use private buckets and signed URLs with short expiry.
- [ ] Define audit coverage for viewing/exporting and modifying sensitive records according to policy.
- [ ] Define backup frequency, recovery-point objective, recovery-time objective, and test restore procedures.
- [ ] Configure error monitoring, uptime checks, structured logs, and alerts without exposing patient information.
- [ ] Add dependency scanning, secret scanning, and regular updates.
- [ ] Review applicable Philippine privacy and healthcare obligations with the responsible organization/legal adviser before handling live patient data.
- [ ] Document incident response, account deactivation, data correction, retention, and breach escalation procedures.

### Phase 6: Vercel and environment configuration

**Frontend on Vercel**
- [ ] Connect the Git repository and configure the correct root directory (`DentCare` if the repository root is above it).
- [ ] Build command: `npm run build`.
- [ ] Output directory: `dist`.
- [ ] Confirm Vite SPA routes refresh correctly. Add a Vercel rewrite to `index.html` if needed for client-side routes.
- [ ] Set frontend environment variables using only the `VITE_` values safe for browser exposure, such as the public API base URL and, if the architecture requires it, Supabase project URL and anon/publishable key.
- [ ] Never add service-role keys, database passwords, Gemini private keys, or payment secrets to `VITE_*` variables.
- [ ] Configure preview deployments to use staging services and synthetic data.
- [ ] Add custom domain, HTTPS, security headers, and a rollback procedure.

**Python API**
- [ ] Deploy to a Python-compatible host, or prove the chosen Vercel Python function setup satisfies framework and runtime limits.
- [ ] Set secrets in the backend host's secret manager.
- [ ] Restrict allowed origins to the deployed frontend domains.
- [ ] Add health/readiness endpoints that do not leak environment details.
- [ ] Configure connection pooling suitable for Supabase and the host's concurrency model.
- [ ] Run migrations as a controlled release step, not automatically from every application instance.
- [ ] Configure API domain, TLS, timeouts, logs, monitoring, and rollback.

**Supabase**
- [ ] Separate development, staging, and production projects or otherwise enforce strict environment isolation.
- [ ] Apply migrations through a reviewed process.
- [ ] Configure Auth redirect URLs and allowed origins.
- [ ] Configure RLS, indexes, backups, and database connection method.
- [ ] Keep private credentials server-side and rotate any credential that may have been exposed.

### Phase 7: Testing and release

**Required test layers**
- Unit tests for validation and domain rules.
- Database tests for constraints, transactions, conflict prevention, and migrations.
- API integration tests for every role and denied access.
- Frontend component tests for forms, modals, loading states, and errors.
- End-to-end tests for the critical role-based workflows.
- Security tests for authorization bypass, IDOR, injection, CORS, session expiry, and secret leakage.
- Performance tests for appointment availability, patient search, reporting, and peak booking concurrency.
- Backup restoration and rollback rehearsal.

**Production release checklist**
- [ ] Frontend lint, test, and build all pass from a clean checkout.
- [ ] Backend unit/integration tests pass.
- [ ] Database migrations and RLS tests pass.
- [ ] No critical/high unresolved security issue remains.
- [ ] All core workflows pass on staging using synthetic data.
- [ ] Monitoring, alerts, backups, and rollback have been tested.
- [ ] Staff training, support ownership, and incident contacts are defined.
- [ ] Product owner signs the acceptance record.
- [ ] Deploy during a planned window and monitor logs, error rate, latency, and booking failures.
- [ ] Keep a documented rollback path and do not use live patient data for initial smoke tests.

## 4. Definition of done

DentCare may be labeled production-ready only when:
- the frontend audit gate passes;
- the Python API enforces authentication, authorization, validation, and business rules;
- Supabase migrations, constraints, and access policies are tested;
- production screens use server-backed data with no silent local/demo fallback;
- booking conflicts and duplicate submissions are handled safely;
- clinical and payment data have appropriate access and audit controls;
- CI, monitoring, backups, and rollback procedures work;
- end-to-end tests pass on the production-like staging environment; and
- an authorized project owner approves the release.

## 5. Immediate next actions

1. Fix the eight TypeScript errors in the frontend audit.
2. Reinstall dependencies in a clean environment and get `npm run lint` and `npm run build` passing.
3. Create the role/workflow acceptance tests and API contract.
4. Agree the clinic, patient, appointment, clinical, and payment data model.
5. Create Supabase migrations and RLS tests.
6. Implement the Python API starting with identity, services, availability, and appointments.
7. Integrate one vertical slice at a time and deploy to staging before production.
