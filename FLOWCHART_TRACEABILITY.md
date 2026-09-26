# DentCare Flowchart Traceability

The attached dental appointment flowchart is the business-process source of truth. The implementation has been aligned so the application enforces the same primary path and exception paths.

## Primary Flow

| Flowchart step | Implementation |
|---|---|
| Patient requests appointment (Online Form / Call / App) | `BookingWizard` exposes an explicit Appointment Request Channel and stores it as `bookingSource`. |
| System checks: registered + new/returning | Step 1 searches the patient record or opens new-patient registration. |
| Registered patient -> pull existing record | Returning-patient lookup selects the existing patient record. |
| New patient -> register name, contact, history, ID | Registration captures identity, contact, emergency contact, allergies/alerts, and ID reference. |
| Patient selects service | Booking Step 3. |
| System checks dentist schedule + real-time availability | Booking reads live slot availability; `createAppointment()` re-validates the slot server-side before confirming. |
| Slots available -> select date/time | Booking Step 5 only permits available slots to proceed. |
| No slots -> alternative dates / waitlist | Booking shows alternatives and waitlist entry when the selected date has no open slot. |
| System sends confirmation (SMS / Email / App) | Appointment creation dispatches in-app, SMS, and email notifications. |
| Appointment day | Front Desk appointment-day flow and check-in. |
| Arrive -> verify ID / update info / confirm appointment | Check-in requires ID verification and updates patient details before entering the waiting queue. |
| Waiting room | Checked-in appointments move into the waiting queue. |
| Dentist calls patient -> history / exam / diagnosis / treatment / prescriptions | Consultation flow opens from the waiting queue and stores clinical findings, diagnosis, treatment plan, prescriptions, and aftercare. |
| Front desk -> payment / insurance / follow-up / aftercare | Payment and follow-up modules complete the post-consultation handoff. |
| System updates patient record + appointment history | Consultation, payment, status, and audit records are persisted. |
| Send follow-up reminder 24h before next visit | Follow-up booking schedules a reminder for exactly 24 hours before the next appointment; the store processes due reminders across in-app, SMS, and email channels. |
| End | Completed appointment flow terminates after payment and follow-up handling. |

## Exception Flows

### Patient Cancels
Cancellation marks the appointment as cancelled, releases the slot, notifies the dentist, and then matches eligible waitlist entries by date, dentist preference, service, and preferred time range before sending opening notifications.

### Patient Reschedules
Rescheduling re-runs the same live availability engine first. The original appointment is preserved as `Rescheduled` and a new confirmed appointment is created only after the selected slot passes the availability check.

### No-Show
A no-show is recorded in the appointment and patient record. A notification is dispatched, and the patient is flagged so the **next booking requires front-desk/admin confirmation**. Staff can explicitly clear that booking gate before the next appointment is finalized.

### Emergency
Emergency appointments are inserted with priority queue number `0`. The schedule-adjustment logic shifts patients who are already checked-in/waiting, without altering unrelated future confirmed appointments, and sends delay notifications to the affected waiting patients.

## Integrity Controls

- Appointment creation cannot bypass the live availability engine.
- Booking restrictions from the no-show exception cannot be silently bypassed by a patient account.
- Follow-up reminder scheduling is persisted on the appointment record.
- Notification channels represented by the flowchart are implemented as distinct in-app, SMS, and email notification records. Real external delivery requires backend integration with an SMS/email provider.
- Audit entries are created for booking, cancellation, rescheduling, no-show, emergency scheduling, staff booking confirmation, and reminder scheduling.
