# DC-004: API Contract Freeze

## Purpose
Freeze the current TypeScript domain types and API service interfaces (`src/services/api/interfaces.ts`, `src/services/api/types.ts`) as the starting contract between the DentCare frontend and the FastAPI backend. This contract is a baseline, not unquestionable truth; vocabulary or type changes must be documented before both sides implement them.

## Conventions
- Endpoints versioned under `/api/v1`.
- Common pagination shape: `{ data: T[], meta: { page, pageSize, totalItems, totalPages, hasNextPage, hasPreviousPage } }`.
- Common error envelope: machine-readable `code`, human-readable `message`, HTTP `statusCode`, optional `details`, ISO-8601 `timestamp`, optional `requestId`.
- Timestamps: ISO-8601 with timezone (`timestamptz` stored in UTC, converted to local for display). Dates: `YYYY-MM-DD`. Times: `HH:mm` 24-hour.
- All mutating operations that can be retried (appointment create/cancel/reschedule, payment, waitlist join) require an idempotency key or equivalent durable deduplication.

## Minimum API surface

| Domain | Endpoints | Critical server invariants |
|---|---|---|
| Health/config | `GET /health`, `GET /ready` | No secrets/PII; readiness checks dependencies separately from liveness. |
| Auth/profile | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, password recovery/change, session refresh | Rate-limit attempts; verify sessions; no client-selected role; consistent 401/403 semantics. |
| Patients | list/search/detail/create/update, booking eligibility | Patients see only their own records; staff least-privilege; sensitive fields minimized. |
| Dentists/services | list/detail, service admin, dentist profiles | Only authorized staff/admin mutate clinic catalog and staff data. |
| Schedules/availability | recurring schedules, blocked times, slot query | Timezone-aware; service duration/buffer rules; DB-backed availability authoritative. |
| Appointments | create/detail/list/update status/cancel/reschedule/no-show/emergency | Atomic no-double-booking; status state machine; booking eligibility/no-show gate; actor+time recorded. |
| Waitlist | join/list/leave/match/notify | Duplicate prevention; deterministic priority; idempotent matching/delivery. |
| Consultation/prescriptions | read/create/update per workflow | Dentist scope/assignment validated; clinical edits audited; patients see only released records. |
| Payments/insurance | create payment record, receipts, summary, export | Monetary values validated server-side; no raw card data; refunds auditable. |
| Notifications | list/read status, delivery status | Durable outbox; idempotent delivery; retries/backoff; suppression/preferences; provider failure visibility. |
| Audit/settings/reports | immutable audit read, admin settings, filtered report generation/download | Admin authorization; bounded filters; export access logged; audit rows not client-editable. |

## Request/Response DTOs
Derived from `src/services/api/types.ts` (login, register patient, appointment CRUD, patient, dentist, service, waitlist, consultation, payment, notification, audit, settings, report). Pydantic schemas must validate every request and response.

## OpenAPI / contract tests
Generate OpenAPI from FastAPI and derive TypeScript client types. Contract tests must assert request/response shape, status codes, pagination, error envelope, and timezone formats against this document.

## Related records
- ADR-001 Auth/database strategy
- DC-005 Appointment workflow specification
- `src/services/api/interfaces.ts`, `src/services/api/types.ts`
