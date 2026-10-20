# DC-005: Appointment Workflow Specification

## Source of truth
The DentCare appointment flowchart (`DentCare appointment flowchart.png`) is the business-process source of truth. This specification encodes the primary patient journey and the four exception flows.

## Appointment state machine
Permitted server-side transitions:

| From | To |
|---|---|
| Requested | Confirmed, Cancelled, Rescheduled, No-Show |
| Pending | Confirmed, Cancelled, Rescheduled, No-Show |
| Confirmed | Checked-In, Cancelled, Rescheduled, No-Show |
| Waitlisted | Confirmed, Cancelled |
| Checked-In | Waiting |
| Waiting | In-Consultation |
| In-Consultation | Payment-Pending |
| Payment-Pending | Completed |

Illegal transitions are rejected server-side (e.g. Requested -> Completed, duplicate Completion, cancellation after a status where clinic policy disallows it). Every transition is recorded in `appointment_status_history` with actor, reason, and timestamp.

## Primary patient journey
1. Patient lookup/registration (booking eligibility check).
2. Service and dentist selection.
3. Live slot availability (database-backed, transactional re-check at booking time).
4. Appointment create (Confirmed) with idempotency key.
5. Check-in (Waiting -> In-Consultation).
6. Consultation (diagnosis, treatment plan, prescriptions).
7. Payment record; appointment -> Completed.
8. Follow-up reminder scheduled (24h pre-appointment by default).

## Exception flows
### A. Cancellation
- Front desk or patient cancels with reason; status -> Cancelled.
- Slot freed; waitlist matching triggered if `autoNotifyWaitlistOnCancel`.
- Waitlist entries notified by priority (urgent > high > normal) then timestamp; deterministic ordering.

### B. Rescheduling
- Availability re-checked for new slot (excluding the original appointment).
- Original -> Rescheduled; new appointment -> Confirmed; `rescheduledFromId` link preserved.
- Patient and dentist notified.

### C. No-Show
- Appointment -> No-Show with reason, actor, timestamp.
- Patient `noShowCount` incremented; after `maxNoShowsBeforeLock`, `requiresStaffReviewForBooking = true`.
- Patient notified; staff confirmation required before next booking.

### D. Emergency scheduling
- Emergency appointment created at clinic open / earliest slot, top queue priority (`queueNumber = 0`).
- Waiting/checked-in appointments for the same dentist shifted by `emergencyBufferShiftMinutes`.
- Affected patients notified; audit recorded.

## Availability and concurrency
- Availability must not be decided by the browser. Booking re-checks eligibility, schedules, and blocked times inside a transaction.
- PostgreSQL exclusion constraints (or equivalent locked transaction) enforce no overlapping active appointments for a dentist/operatory under concurrent requests.
- Two users booking the same overlapping slot: only one succeeds.
- Idempotency key prevents duplicate records on ambiguous retry.

## Timezone
- Clinic IANA timezone configured in `clinic_settings` (confirm actual clinic location; do not infer from developer location).
- Event instants stored as `timestamptz`; recurring local clinic hours and DST transitions handled explicitly.

## Related records
- ADR-001 Auth/database strategy
- DC-004 API contract freeze
- `src/services/store.ts` (existing local reference implementation)
