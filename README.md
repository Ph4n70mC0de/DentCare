# DentCare — Dentist Appointment & Patient Management System

Production-ready dentist appointment and patient management system with Neumorphic UI, complete appointment lifecycle, real-time availability, exception flows, and role-based portals.

## Features

- **Booking Wizard** — Multi-step appointment booking with patient lookup/registration, service selection, and live slot availability.
- **Appointment Lifecycle** — Full state machine covering check-in, consultation, payment, and follow-up.
- **Real-Time Availability** — Live slot checking with waitlist entry when no slots are available.
- **Exception Flows** — Cancellation, rescheduling, no-show gating, and emergency priority scheduling.
- **Notification Dispatcher** — Simulated in-app, SMS, and email notification records for confirmations, delays, and follow-ups.
- **Follow-Up Reminders** — Automatic 24-hour pre-appointment reminders.
- **Role-Based Portals** — Separate experiences for patients, front desk, and dentist/staff.

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Express (API server)
- Lucide React (icons)
- Motion (animations)

## Run Locally

**Prerequisites:** Node.js (v18+), npm or bun

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and configure:
   ```bash
   cp .env.example .env.local
   ```
3. Run the app:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
npm run preview
```

## Lint

```bash
npm run lint
```

## Flowchart Compliance

The DentCare appointment flowchart is treated as the business-process source of truth. The implementation enforces the primary patient journey and the four exception flows through the booking wizard, appointment lifecycle state machine, notification dispatcher, waitlist logic, no-show booking gate, emergency scheduler, and follow-up reminder scheduler.

See [`FLOWCHART_TRACEABILITY.md`](./FLOWCHART_TRACEABILITY.md) for the step-by-step traceability map and implementation controls.
