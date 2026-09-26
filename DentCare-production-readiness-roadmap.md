# DentCare production readiness roadmap

## 1. Purpose

This document defines the work required to move DentCare from its current frontend prototype to a production-ready application with a React/TypeScript frontend, a Python backend, and Supabase as the primary database and authentication platform.

The implementation order is deliberate:

1. Verify and stabilize the existing frontend.
2. Freeze the frontend contract and user flows.
3. Design and implement the Supabase data model and security rules.
4. Build the Python API and move business rules to the server.
5. Replace browser-only persistence with API-backed persistence.
6. Integrate authentication, authorization, notifications, audit logging, observability, testing, and deployment controls.
7. Run end-to-end acceptance testing before production release.

The frontend must pass its exit gate before backend implementation is treated as the next production phase.

## 2. Current repository assessment

The supplied `DentCare` contains a substantial React/TypeScript frontend. The repository includes 51 TSX files, 5 TypeScript files, and roughly 50 UI/component files covering patient, front desk, dentist, admin, notification, exception, and shared UI areas.

The current implementation already represents many of the intended workflows: appointment booking, appointment lifecycle states, waitlist handling, cancellation, rescheduling, no-show handling, emergency scheduling, consultation, payment, notifications, audit records, and administrative screens.

However, the current repository should be treated as a functional prototype rather than a production system. The main reasons are:

- `src/services/store.ts` uses `localStorage` as the persistence layer.
- The active user is stored locally and can be switched by role from the UI. This is suitable for demonstration but is not authentication or authorization.
- The repository has Express dependencies, but the inspected source does not contain a real production API implementation.
- There is no Supabase integration in the supplied source.
- The `.env.example` contains Gemini and application URL variables, but no production database/auth configuration.
- The frontend directly owns domain state and business operations that should eventually be enforced by the server.
- The current application is effectively a single-page client with view switching rather than a complete authenticated application boundary.

These findings do not mean the existing UI needs to be discarded. The existing components and flow logic should become the frontend reference implementation while the data and business layers are progressively replaced.

## 3. Frontend completion gate

### Gate F0: inventory and build verification

Before changing architecture, run:

```bash
npm ci
npm run lint
npm run build
npm run preview
```

Record the result of each command. A failed build or TypeScript check blocks the frontend completion gate.

Also check:

- all imports resolve
- no dead routes or unreachable views remain
- no browser console errors appear during normal navigation
- no runtime exceptions occur when seed data is reset or modified
- the production build contains no development-only secrets

### Gate F1: UI and workflow verification

Test every major role with clean seed data.

#### Patient

- dashboard loads
- patient identity is correct
- appointment booking opens
- patient/service/dentist/date/time selection works
- unavailable slots are rejected
- waitlist entry works
- appointments can be viewed
- cancellation and rescheduling flows work
- dental history and prescriptions are readable
- notifications are displayed

#### Front desk

- dashboard loads
- patient search works
- patient registration/edit flow works
- staff booking works
- check-in works
- waiting room works
- day flow works
- cancellation/reschedule/no-show flows work
- billing/payment workflow works
- reports open and export behavior is verified

#### Dentist

- dashboard loads
- schedule loads
- patient records are accessible within the intended permission boundary
- consultation can be started
- examination and diagnosis fields persist during the session
- treatment plan and prescriptions work
- consultation completion changes appointment state correctly
- follow-up recommendation is saved

#### Admin

- dashboard loads
- user directory works
- services can be managed
- dentist schedules can be managed
- clinic settings work
- audit trail is visible
- reports and analytics render with valid data
- waitlist controls work

### Gate F2: state-machine verification

The frontend currently contains a broad appointment status model. Convert it into an explicit transition matrix before production integration.

For every transition define:

- source status
- allowed destination status
- actor role
- required fields
- side effects
- notification event
- audit event
- failure message

Example:

| From | To | Allowed actor | Required checks |
|---|---|---|---|
| Requested | Confirmed | Front desk/Admin | patient, dentist, service, slot still available |
| Confirmed | Checked-In | Front desk | appointment date and valid appointment state |
| Checked-In | Waiting | Front desk | patient arrived |
| Waiting | In-Consultation | Dentist | dentist owns/handles appointment |
| In-Consultation | Payment-Pending | Dentist/authorized staff | consultation completed |
| Payment-Pending | Completed | Front desk/Admin | payment condition satisfied |
| Confirmed | Cancelled | permitted staff/patient | cancellation policy satisfied |
| Confirmed | Rescheduled | permitted staff/patient | replacement slot available |

The exact rules must follow the approved DentCare requirements and flowchart. Do not invent new business rules during the migration.

### Gate F3: responsive and accessibility verification

Check desktop, tablet, and mobile widths.

Verify:

- keyboard navigation
- visible focus states
- semantic buttons and form controls
- labels associated with inputs
- modal focus handling
- accessible error messages
- sufficient text contrast
- no information conveyed only through color
- tables remain usable on narrow screens
- loading, empty, success, and error states exist for important operations

### Gate F4: data-boundary verification

Before backend work begins, remove assumptions that browser state is authoritative.

Create a frontend service boundary such as:

```text
src/
  api/
    client.ts
    appointments.ts
    patients.ts
    dentists.ts
    services.ts
    consultations.ts
    payments.ts
    waitlist.ts
    notifications.ts
    reports.ts
  auth/
  hooks/
  components/
  types/
```

Components should call application services/hooks rather than manipulating the storage implementation directly.

### Frontend exit criteria

The frontend is considered ready to hand off to backend integration only when all of these are true:

- `npm run lint` passes.
- `npm run build` passes.
- Every documented role can complete its critical workflows using controlled test data.
- Appointment transitions match the approved state machine.
- Validation exists for all critical forms.
- Loading, empty, success, and failure states are covered.
- No critical console errors remain.
- Responsive and accessibility checks have been completed.
- Business logic is isolated behind service/hooks boundaries.
- The UI no longer depends on direct `localStorage` access from feature components.
- A frontend test suite covers critical booking and appointment flows.
- An API contract has been agreed before replacing the local store.

Until this checklist passes, backend implementation should remain limited to contract design and test scaffolding.

## 4. Target production architecture

```text
Browser
  |
  | HTTPS
  v
React + TypeScript + Vite
  |
  | REST/JSON + access token
  v
Python API
  |
  +---- Authentication/authorization checks
  +---- Appointment state machine
  +---- Availability engine
  +---- Waitlist matching
  +---- Consultation and clinical records rules
  +---- Payment record rules
  +---- Notifications/outbox
  +---- Audit logging
  |
  v
Supabase PostgreSQL
  |
  +---- relational data
  +---- Row Level Security
  +---- indexes/constraints
  +---- migrations
  +---- storage where required

Optional external services
  +---- email provider
  +---- SMS provider
  +---- payment provider
  +---- monitoring/error tracking
```

The browser should never be the final authority for appointment availability, authorization, payment state, audit history, or clinical-data access.

## 5. Supabase database plan

### Core tables

Create a normalized schema around the current TypeScript domain model.

Suggested tables:

- `profiles`
- `patients`
- `dentists`
- `dental_services`
- `dentist_schedules`
- `blocked_schedules`
- `appointments`
- `waitlist_entries`
- `consultations`
- `prescriptions`
- `prescription_items`
- `payments`
- `notifications`
- `audit_logs`
- `system_settings`

Additional tables may be needed for:

- notification delivery attempts
- appointment status history
- insurance information
- uploaded clinical documents
- payment transactions/refunds
- user sessions or external identities

### Database constraints

Add database-level constraints for fields whose validity must never depend on frontend code.

Examples:

- appointment start time must precede end time
- service duration must be positive
- payment amounts cannot be negative
- required foreign keys must exist
- appointment status must use an allowed value
- notification channel must use an allowed value
- unique patient/user relationships must be enforced where required

### Indexes

Plan indexes for common queries:

- appointments by date and dentist
- appointments by patient and date
- appointments by status and date
- waitlist by service/date/status
- notifications by user/read state
- audit logs by entity and timestamp
- schedules by dentist/day

Do not add indexes blindly. Confirm them against actual query patterns.

### Row Level Security

RLS must be designed around actual roles and ownership.

Examples of policy intent:

- patients can read their own profile, appointments, notifications, and permitted records
- dentists can access clinical records for appointments they are authorized to handle
- front desk users can manage operational appointment and patient workflows according to their role
- admins can manage system configuration and authorized administrative records
- audit records should not be writable by arbitrary clients

Service-role credentials must stay server-side.

## 6. Python backend plan

Use a production Python web framework such as FastAPI unless project requirements specify another framework.

Recommended structure:

```text
backend/
  app/
    main.py
    config.py
    dependencies.py
    api/
      auth.py
      patients.py
      dentists.py
      services.py
      appointments.py
      waitlist.py
      consultations.py
      payments.py
      notifications.py
      reports.py
      admin.py
    domain/
      appointment_state.py
      availability.py
      waitlist.py
      permissions.py
      notifications.py
    schemas/
    repositories/
    services/
    db/
    security/
    tests/
  migrations/
  pyproject.toml
  .env.example
```

### Backend responsibilities

The Python API should own:

1. authentication verification
2. authorization
3. input validation
4. appointment availability
5. appointment state transitions
6. waitlist matching
7. no-show rules
8. emergency scheduling rules
9. consultation persistence
10. payment record validation
11. notification creation and delivery orchestration
12. audit logging
13. reporting queries
14. transactional operations
15. error handling

### API design

Use versioned endpoints such as:

```text
/api/v1/auth
/api/v1/patients
/api/v1/dentists
/api/v1/services
/api/v1/appointments
/api/v1/waitlist
/api/v1/consultations
/api/v1/payments
/api/v1/notifications
/api/v1/reports
/api/v1/admin
```

Document the API with OpenAPI.

For mutations, return predictable response envelopes and structured errors. Validation failures should identify the field or business rule that failed.

## 7. Appointment and availability engine

Move the scheduling rules out of React and into the backend.

The server must calculate available slots from:

- dentist working schedule
- clinic hours
- service duration
- configured buffer time
- blocked schedules
- existing appointments
- pending appointment holds
- emergency rules
- date/time validity

The client may display an available slot, but the server must re-check availability during booking to prevent race conditions.

Use database transactions and appropriate locking or conflict detection for concurrent bookings.

## 8. Authentication and authorization

Use Supabase Auth for user identity where appropriate, with the Python API validating the presented access token and resolving the user's role.

Do not keep the current `activeUserId` role-switch mechanism in production.

Development-only impersonation should be isolated behind an explicit development flag and must never be enabled in a production build.

Authorization should be checked server-side on every protected mutation and sensitive read.

## 9. Notifications

Replace the current simulated notification behavior with a durable notification pipeline.

Recommended pattern:

```text
Business event
  -> database transaction
  -> notification/outbox record
  -> worker/job
  -> provider
  -> delivery result
  -> audit/status update
```

At minimum support the notification types already represented in the frontend, including appointment confirmation, cancellation, rescheduling, waitlist availability, reminders, no-show notices, emergency changes, payment receipts, and completion notices.

Do not make an external SMS/email request the only record of an event. Persist the event and delivery status.

## 10. Clinical and patient data controls

DentCare handles patient and clinical information, so production design must minimize unnecessary exposure.

Required controls:

- least-privilege access
- server-side authorization
- RLS where Supabase access is used
- encrypted transport
- secrets kept outside source control
- audit trail for sensitive mutations
- controlled file access if documents are stored
- no sensitive patient data in browser logs
- no sensitive patient data in error-monitoring payloads unless explicitly justified
- defined retention and backup policy

The exact legal and regulatory obligations should be reviewed with the clinic/project owner and applicable Philippine requirements before production deployment.

## 11. Frontend migration plan

Replace the local store incrementally.

### Phase A: adapter layer

Create repository interfaces matching the current operations:

```text
PatientRepository
AppointmentRepository
DentistRepository
ServiceRepository
ConsultationRepository
PaymentRepository
WaitlistRepository
NotificationRepository
```

Implement the current local adapter first so the UI continues to work.

### Phase B: API adapter

Implement the same interfaces against the Python API.

Feature components should not need to know whether the source is local storage or HTTP.

### Phase C: cutover

Switch environments:

```text
development: API + Supabase
staging: API + Supabase staging project
production: API + Supabase production project
```

Remove the local persistence adapter after the production cutover is stable.

## 12. Testing strategy

### Frontend unit tests

Test:

- appointment state transitions at the UI boundary
- form validation
- slot rendering
- booking wizard validation
- waitlist UI behavior
- role-based navigation
- error states

### Backend unit tests

Test:

- permission checks
- availability calculation
- appointment transition rules
- no-show rules
- waitlist matching
- emergency scheduling
- payment validation
- notification creation

### Integration tests

Test Python API against a test Supabase database/project.

Important scenarios:

- two users attempt the same slot
- cancellation releases a slot
- released slot can trigger waitlist matching
- rescheduling keeps the correct audit history
- unauthorized user cannot access another patient's record
- consultation cannot be created for an invalid appointment state
- payment cannot mark an invalid balance as paid

### End-to-end tests

Automate the critical workflows with a browser test framework such as Playwright.

Minimum journeys:

1. patient books an appointment
2. front desk confirms/checks in patient
3. dentist completes consultation
4. front desk records payment
5. appointment becomes completed
6. cancellation releases availability
7. waitlist patient receives an eligible slot
8. no-show rule blocks or flags the patient according to configuration
9. emergency flow changes the schedule according to approved rules

## 13. Security checklist

Before production:

- remove development role switching
- rotate all development secrets
- configure production secrets through the deployment platform
- verify CORS allowlist
- enforce HTTPS
- validate request bodies
- rate-limit sensitive endpoints
- protect authentication endpoints
- prevent IDOR by checking ownership/authorization
- verify RLS policies
- never expose Supabase service-role keys to the browser
- sanitize exported reports
- review file upload restrictions if enabled
- redact sensitive values from logs
- configure dependency vulnerability scanning

## 14. Observability and operations

Add:

- structured backend logs
- request IDs
- error tracking
- health endpoint
- readiness endpoint
- database connectivity check
- API latency measurements
- failed notification metrics
- booking conflict metrics
- audit trail monitoring

Suggested endpoints:

```text
GET /health
GET /ready
GET /api/v1/health/version
```

Do not expose database credentials or sensitive diagnostic information through health endpoints.

## 15. Deployment environments

Maintain separate configuration for:

```text
local
staging
production
```

Each environment should have its own:

- API base URL
- Supabase project/configuration
- authentication configuration
- notification provider configuration
- logging level
- allowed frontend origins

Production deployment should require a successful CI pipeline.

## 16. CI/CD pipeline

Recommended pipeline stages:

```text
install
  -> typecheck
  -> lint
  -> unit tests
  -> frontend build
  -> backend tests
  -> API integration tests
  -> security/dependency checks
  -> migration validation
  -> deploy staging
  -> smoke tests
  -> manual production approval
  -> production deploy
  -> production smoke tests
```

A failed test, migration validation, or security check should block deployment.

## 17. Database migration strategy

Never edit production tables manually as the normal workflow.

Use versioned SQL migrations.

Each migration should be:

- reviewed
- repeatable in a clean environment
- tested against staging
- backward-compatible where rolling deployment requires it
- accompanied by any required data migration

Before changing the existing local seed data, map every seed entity to the corresponding database record.

## 18. Data migration from the prototype

The current `seedData.ts` should be treated as demonstration data.

Create a migration/import script that can transform approved seed records into Supabase rows for development and staging.

Do not copy browser `localStorage` data into production automatically.

For each entity define:

- source field
- destination field
- transformation
- default value
- validation
- foreign-key dependency

## 19. Production readiness gates

### Gate 1: frontend

Required before backend integration:

- build passes
- typecheck passes
- critical workflows pass
- responsive checks pass
- accessibility checks pass
- state machine verified
- API boundary defined

### Gate 2: database

Required before backend production work:

- schema reviewed
- migrations tested
- foreign keys defined
- constraints defined
- indexes reviewed
- RLS policies tested
- seed data works in staging
- backup/recovery process defined

### Gate 3: backend

Required before frontend cutover:

- API contract complete
- authentication works
- authorization tests pass
- scheduling logic is server-side
- transactional booking works
- audit logging works
- notification pipeline works
- OpenAPI documentation is generated
- integration tests pass

### Gate 4: full-stack staging

Required before production:

- frontend uses the real API
- API uses staging Supabase
- no production credentials are present in client code
- E2E tests pass
- critical security tests pass
- smoke tests pass
- monitoring works
- rollback procedure is tested

## 20. Recommended implementation sequence

### Sprint 1: frontend audit and stabilization

- complete build/typecheck verification
- inspect every major screen
- fix broken interactions
- finalize appointment state machine
- add loading/error/empty states
- establish API service interfaces
- add frontend tests

Deliverable: frontend release candidate using the local adapter.

### Sprint 2: Supabase schema

- create database schema
- create migrations
- define constraints and indexes
- configure Supabase Auth
- implement RLS
- load development seed data
- verify queries

Deliverable: reproducible staging database.

### Sprint 3: Python API foundation

- create FastAPI application
- configuration and environment handling
- authentication middleware
- authorization dependencies
- error model
- OpenAPI setup
- database access layer
- health/readiness endpoints

Deliverable: authenticated API skeleton.

### Sprint 4: appointment backend

- patients
- dentists
- services
- schedules
- blocked schedules
- availability engine
- booking
- confirmation
- cancellation
- rescheduling
- no-show handling
- emergency scheduling

Deliverable: server-authoritative appointment lifecycle.

### Sprint 5: clinical and operational modules

- consultations
- prescriptions
- patient history
- payments
- reports
- waitlist
- audit logs
- notifications

Deliverable: complete API coverage for the current frontend.

### Sprint 6: frontend API migration

- replace local repository with API repository
- implement authentication flow
- implement protected routes/views
- map API errors to UI errors
- remove production role switching
- remove direct local persistence

Deliverable: full-stack staging release.

### Sprint 7: hardening

- E2E tests
- concurrency tests
- security testing
- accessibility regression testing
- performance testing
- dependency checks
- logging and monitoring
- backup/recovery validation

Deliverable: production candidate.

### Sprint 8: production release

- final migration review
- production environment configuration
- smoke test
- controlled deployment
- post-deployment verification
- rollback readiness

Deliverable: production release.

## 21. Definition of done

DentCare can be called production-ready only when a real authenticated user can complete the required workflow through the React frontend, the Python API enforces the rules, and Supabase persists the resulting data with appropriate authorization and audit controls.

The following chain must work without mock persistence:

```text
Login
  -> authorized dashboard
  -> patient/service selection
  -> server-side availability check
  -> appointment creation transaction
  -> confirmation notification
  -> check-in
  -> consultation
  -> payment
  -> completion
  -> audit history
  -> follow-up/reminder processing
```

The same environment must also correctly handle cancellation, rescheduling, no-show, waitlist, and emergency flows.

## 22. Immediate next actions

1. Run the frontend build and typecheck in a normal Node environment and record the exact result.
2. Manually verify every role and critical flow against the supplied flowchart.
3. Freeze the TypeScript domain model as the initial API contract source.
4. Extract the current appointment rules from `store.ts` into explicit domain rules and tests.
5. Create the Supabase schema and migration plan.
6. Create the FastAPI project and authentication boundary.
7. Implement appointments and availability first because they are the highest-impact shared workflow.
8. Migrate the frontend from `localStorage` to the API one module at a time.
9. Add E2E tests before removing the local adapter.
10. Deploy to staging and complete the full production readiness gates before production release.

## 23. Verification record for the supplied archive

The supplied archive was inspected as the source of truth for this roadmap. The source contains a React/Vite application with extensive role-based UI components and a client-side `DentalDataStore`. The store persists users, patients, dentists, services, schedules, appointments, waitlist entries, consultations, payments, notifications, audit logs, and settings through browser `localStorage`.

The repository also declares Express-related dependencies, but the inspected source does not establish a complete Python backend or Supabase persistence layer. Therefore the frontend should not yet be marked 100% production-ready. The appropriate status is **frontend functional baseline: substantially implemented; production readiness: not yet verified/passed**.

The next technical decision should be to complete Gate F0 through Gate F4 and produce a signed-off frontend checklist before treating backend implementation as the next production phase.
