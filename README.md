# DentCare — Dentist Appointment & Patient Management System

DentCare is a React/TypeScript dental clinic management UI with patient booking and appointment views, front-desk workflows, dentist consultation and clinical-history views, admin tools, exception flows, a local business-logic store, typed API-client scaffolding, and automated unit/workflow tests.

**Current status:** Functional prototype. The active data path is local-first (browser `localStorage` via `src/services/store.ts`) and is not yet connected to a production backend. Backend design, Supabase schema/RLS, and the Python/FastAPI API may proceed in parallel against agreed domain contracts, but full frontend-to-backend integration should wait for the frontend readiness gate (Phase 0) to pass.

See `IMPLEMENTATION_PLAN.md` (if present) or the project documentation for the phased rollout: frontend baseline → contracts → database/RLS → backend → vertical-slice integration → deployment gates.

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
- Lucide React (icons)

## Run Locally

**Prerequisites:** Node.js (>=24.15.0), npm

1. Install dependencies:
   ```bash
   npm ci
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

## Verification

```bash
npm ci          # clean, reproducible install
npm run lint    # TypeScript type check
npm run format  # Prettier check
npm test        # unit/workflow tests (Vitest)
npm run test:coverage
npm run build   # production Vite build
npm run preview # serve production bundle
npm run test:e2e # Playwright end-to-end tests
```

## Build

```bash
npm run build
npm run preview
```

## Flowchart Compliance

The DentCare appointment flowchart is treated as the business-process source of truth. The implementation enforces the primary patient journey and the four exception flows through the booking wizard, appointment lifecycle state machine, notification dispatcher, waitlist logic, no-show booking gate, emergency scheduler, and follow-up reminder scheduler.
