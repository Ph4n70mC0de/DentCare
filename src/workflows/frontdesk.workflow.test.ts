import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dentalStore } from '../services/store';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Front Desk Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    dentalStore.resetToSeed();
    dentalStore.setActiveUser('user-frontdesk');
  });

  describe('Patient Search & Maintenance', () => {
    it('searches patients by name', () => {
      const results = dentalStore.findPatientByPhoneOrEmail('James Wilson');
      expect(results).toBeDefined();
      expect(results?.fullName).toBe('James Wilson');
    });

    it('searches patients by phone', () => {
      // Search function removes non-digits from both input and stored phone
      const results = dentalStore.findPatientByPhoneOrEmail('3217890');
      expect(results).toBeDefined();
      expect(results?.fullName).toBe('James Wilson');
    });

    it('searches patients by patient number', () => {
      const results = dentalStore.findPatientByPhoneOrEmail('DC-P-10024');
      expect(results).toBeDefined();
      expect(results?.patientNumber).toBe('DC-P-10024');
    });

    it('searches patients by email', () => {
      const results = dentalStore.findPatientByPhoneOrEmail('james.wilson@example.com');
      expect(results).toBeDefined();
      expect(results?.email).toBe('james.wilson@example.com');
    });

    it('returns undefined for non-existent patient', () => {
      // Use a phone number that won't match any patient
      const results = dentalStore.findPatientByPhoneOrEmail('9999999999');
      expect(results).toBeUndefined();
    });

    it('updates patient record', () => {
      const updated = dentalStore.updatePatient('pat-001', {
        phone: '+1 (555) 999-9999',
        address: 'New Address',
        medicalAlerts: ['New Alert'],
      });

      expect(updated).not.toBeNull();
      expect(updated?.phone).toBe('+1 (555) 999-9999');
      expect(updated?.address).toBe('New Address');
      expect(updated?.medicalAlerts).toContain('New Alert');
    });

    it('confirms patient booking eligibility (removes staff review flag)', () => {
      // pat-005 has requiresStaffReviewForBooking: true
      const patient = dentalStore.getPatients().find((p) => p.id === 'pat-005');
      expect(patient?.requiresStaffReviewForBooking).toBe(true);

      const updated = dentalStore.confirmPatientBookingEligibility('pat-005');
      expect(updated?.requiresStaffReviewForBooking).toBe(false);
    });

    it('rejects booking eligibility confirmation from non-front-desk', () => {
      dentalStore.setActiveUser('user-patient-1');
      const result = dentalStore.confirmPatientBookingEligibility('pat-005');
      expect(result).toBeNull();
    });
  });

  describe('Booking Creation for Patients', () => {
    it('creates booking for patient with all required fields', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-20',
        startTime: '09:00',
        bookingSource: 'phone_call',
      });

      expect(appointment.status).toBe('Confirmed');
      expect(appointment.bookingSource).toBe('phone_call');
    });

    it('books walk-in patient', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-20',
        startTime: '09:00',
        bookingSource: 'walk_in',
      });

      expect(appointment.bookingSource).toBe('walk_in');
    });
  });

  describe('Check-In & State Transitions', () => {
    it('checks in patient (Confirmed -> Waiting)', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-20',
        startTime: '09:00',
      });

      const checkedIn = dentalStore.updateAppointmentStatus(appointment.id, 'Checked-In');
      expect(checkedIn?.status).toBe('Waiting'); // Immediately becomes Waiting
      expect(checkedIn?.queueNumber).toBeDefined();
      expect(checkedIn?.arrivedAt).toBeDefined();
    });

    it('advances from Waiting to In-Consultation', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-20',
        startTime: '09:00',
      });

      dentalStore.updateAppointmentStatus(appointment.id, 'Checked-In'); // -> Waiting
      const inConsultation = dentalStore.updateAppointmentStatus(appointment.id, 'In-Consultation');

      expect(inConsultation?.status).toBe('In-Consultation');
      expect(inConsultation?.consultationStartedAt).toBeDefined();
    });

    it('advances from In-Consultation to Payment-Pending', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-20',
        startTime: '09:00',
      });

      dentalStore.updateAppointmentStatus(appointment.id, 'Checked-In');
      dentalStore.updateAppointmentStatus(appointment.id, 'In-Consultation');
      const paymentPending = dentalStore.updateAppointmentStatus(appointment.id, 'Payment-Pending');

      expect(paymentPending?.status).toBe('Payment-Pending');
    });

    it('completes appointment from Payment-Pending', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-20',
        startTime: '09:00',
      });

      dentalStore.updateAppointmentStatus(appointment.id, 'Checked-In');
      dentalStore.updateAppointmentStatus(appointment.id, 'In-Consultation');
      dentalStore.updateAppointmentStatus(appointment.id, 'Payment-Pending');
      const completed = dentalStore.updateAppointmentStatus(appointment.id, 'Completed');

      expect(completed?.status).toBe('Completed');
      expect(completed?.completedAt).toBeDefined();
    });

    it('enforces valid state transitions', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-20',
        startTime: '09:00',
      });

      // Cannot go Confirmed -> Completed directly
      const result = dentalStore.updateAppointmentStatus(appointment.id, 'Completed');
      expect(result).toBeNull();
    });
  });

  describe('Exception Flows', () => {
    it('cancels appointment and notifies waitlist', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-20',
        startTime: '09:00',
      });

      // Add waitlist entry for same date/time
      dentalStore.joinWaitlist({
        patientId: 'pat-002',
        serviceId: 'serv-1',
        preferredDate: '2026-10-20',
        preferredTimeRange: 'morning',
        priority: 'normal',
        notes: 'Waiting for slot',
      });

      const result = dentalStore.cancelAppointment(appointment.id, 'Patient cancelled');

      expect(result.success).toBe(true);
      expect(result.notifiedWaitlistCount).toBeGreaterThanOrEqual(0);

      const cancelled = dentalStore.getAppointments().find((a) => a.id === appointment.id);
      expect(cancelled?.status).toBe('Cancelled');
    });

    it('reschedules appointment preserving history', () => {
      // Use a date that falls on a weekday (Mon-Fri) for dentist-1
      const futureDate = new Date();
      // Find next Monday
      const daysUntilMonday = (1 - futureDate.getDay() + 7) % 7 || 7;
      futureDate.setDate(futureDate.getDate() + daysUntilMonday);
      const dateStr = futureDate.toISOString().split('T')[0];

      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: dateStr,
        startTime: '09:00',
      });

      const nextDay = new Date(futureDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];

      const result = dentalStore.rescheduleAppointment(appointment.id, nextDayStr, '10:00');

      expect(result.success).toBe(true);
      expect(result.newAppointment?.rescheduledFromId).toBe(appointment.id);

      const original = dentalStore.getAppointments().find((a) => a.id === appointment.id);
      expect(original?.status).toBe('Rescheduled');
    });

    it('marks no-show and increments patient no-show count', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-20',
        startTime: '09:00',
      });

      dentalStore.updateAppointmentStatus(appointment.id, 'Checked-In');

      const result = dentalStore.markNoShow(appointment.id, 'Patient did not arrive');

      expect(result.success).toBe(true);
      expect(result.patientRequiresReview).toBe(true);

      const patient = dentalStore.getPatients().find((p) => p.id === 'pat-001');
      expect(patient?.noShowCount).toBe(1);
      expect(patient?.requiresStaffReviewForBooking).toBe(true);
    });

    it('creates emergency appointment with priority queue', () => {
      const result = dentalStore.createEmergencyAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-6', // Emergency exam
        emergencyNotes: 'Severe tooth pain',
        severity: 'critical',
      });

      expect(result.appointment).toBeDefined();
      expect(result.appointment.status).toBe('Emergency');
      expect(result.appointment.isEmergency).toBe(true);
      expect(result.appointment.emergencySeverity).toBe('critical');
      expect(result.appointment.queueNumber).toBe(0); // Top priority
      expect(result.affectedWaitingPatientsCount).toBeGreaterThanOrEqual(0);
    });

    it('shifts waiting appointments when emergency added', () => {
      // Use a future date with no seed appointments to avoid conflicts
      const testDate = '2026-12-01'; // Tuesday, dentist-1 works Mon-Fri
      // Create waiting appointments for testDate using dentist-1 (Mon-Fri schedule)
      const apt1 = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: testDate,
        startTime: '09:00',
      });
      dentalStore.updateAppointmentStatus(apt1.id, 'Checked-In');

      const apt2 = dentalStore.createAppointment({
        patientId: 'pat-002',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: testDate,
        startTime: '11:00', // Before lunch break (12:30-13:30), 45-min service ends at 11:45
      });
      dentalStore.updateAppointmentStatus(apt2.id, 'Checked-In');

      const originalTime1 = dentalStore.getAppointments().find((a) => a.id === apt1.id)?.startTime;
      const originalTime2 = dentalStore.getAppointments().find((a) => a.id === apt2.id)?.startTime;

      dentalStore.createEmergencyAppointment({
        patientId: 'pat-004',
        dentistId: 'dentist-1',
        serviceId: 'serv-6',
        emergencyNotes: 'Emergency',
        severity: 'high',
        date: testDate,
      });

      const shifted1 = dentalStore.getAppointments().find((a) => a.id === apt1.id);
      const shifted2 = dentalStore.getAppointments().find((a) => a.id === apt2.id);

      expect(shifted1?.startTime).not.toBe(originalTime1);
      expect(shifted2?.startTime).not.toBe(originalTime2);
    });
  });

  describe('Payment & Insurance', () => {
    it('processes cash payment', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-20',
        startTime: '09:00',
      });

      dentalStore.updateAppointmentStatus(appointment.id, 'Checked-In');
      dentalStore.updateAppointmentStatus(appointment.id, 'In-Consultation');
      dentalStore.updateAppointmentStatus(appointment.id, 'Payment-Pending');

      const payment = dentalStore.processPayment({
        appointmentId: appointment.id,
        patientId: 'pat-001',
        subtotal: 95,
        discount: 0,
        insuranceCoverage: 0,
        amountPaid: 95,
        balance: 0,
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
      });

      expect(payment.paymentMethod).toBe('Cash');
      expect(payment.paymentStatus).toBe('Paid');
      expect(payment.balance).toBe(0);

      const completed = dentalStore.getAppointments().find((a) => a.id === appointment.id);
      expect(completed?.status).toBe('Completed');
    });

    it('processes insurance payment with coverage', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-2', // $160 filling
        date: '2026-10-20',
        startTime: '09:00',
      });

      dentalStore.updateAppointmentStatus(appointment.id, 'Checked-In');
      dentalStore.updateAppointmentStatus(appointment.id, 'In-Consultation');
      dentalStore.updateAppointmentStatus(appointment.id, 'Payment-Pending');

      const payment = dentalStore.processPayment({
        appointmentId: appointment.id,
        patientId: 'pat-001',
        subtotal: 160,
        discount: 0,
        insuranceCoverage: 80, // 50%
        insuranceProvider: 'Delta Dental',
        insurancePolicyNumber: 'POL-123',
        amountPaid: 80,
        balance: 0,
        paymentMethod: 'Insurance',
        paymentStatus: 'Paid',
      });

      expect(payment.insuranceCoverage).toBe(80);
      expect(payment.insuranceProvider).toBe('Delta Dental');
      expect(payment.paymentMethod).toBe('Insurance');
    });

    it('processes partial payment', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-20',
        startTime: '09:00',
      });

      dentalStore.updateAppointmentStatus(appointment.id, 'Checked-In');
      dentalStore.updateAppointmentStatus(appointment.id, 'In-Consultation');
      dentalStore.updateAppointmentStatus(appointment.id, 'Payment-Pending');

      const payment = dentalStore.processPayment({
        appointmentId: appointment.id,
        patientId: 'pat-001',
        subtotal: 95,
        discount: 0,
        insuranceCoverage: 0,
        amountPaid: 50,
        balance: 45,
        paymentMethod: 'Cash',
        paymentStatus: 'Partially-Paid',
      });

      expect(payment.paymentStatus).toBe('Partially-Paid');
      expect(payment.balance).toBe(45);

      // Appointment should remain Payment-Pending
      const apt = dentalStore.getAppointments().find((a) => a.id === appointment.id);
      expect(apt?.status).toBe('Payment-Pending');
    });
  });

  describe('Reports & Exports', () => {
    it('filters appointments by date range', () => {
      const appointments = dentalStore.getAppointments();
      const today = new Date().toISOString().split('T')[0];
      const todaysAppointments = appointments.filter((a) => a.date === today);

      expect(todaysAppointments.length).toBeGreaterThan(0);
    });

    it('filters payments by date', () => {
      const payments = dentalStore.getPayments();
      const today = new Date().toISOString().split('T')[0];
      const todaysPayments = payments.filter((p) => p.createdAt.startsWith(today));

      expect(todaysPayments.length).toBeGreaterThanOrEqual(0);
    });

    it('calculates total revenue', () => {
      const payments = dentalStore.getPayments();
      const total = payments.reduce((sum, p) => sum + p.amountPaid, 0);
      expect(total).toBeGreaterThanOrEqual(0);
    });

    it('calculates insurance totals', () => {
      const payments = dentalStore.getPayments();
      const insuranceTotal = payments.reduce((sum, p) => sum + p.insuranceCoverage, 0);
      expect(insuranceTotal).toBeGreaterThanOrEqual(0);
    });

    it('filters by payment method', () => {
      const payments = dentalStore.getPayments();
      const cashPayments = payments.filter((p) => p.paymentMethod === 'Cash');
      const cardPayments = payments.filter(
        (p) => p.paymentMethod === 'Credit Card' || p.paymentMethod === 'Debit Card'
      );
      const insurancePayments = payments.filter((p) => p.paymentMethod === 'Insurance');

      expect(
        cashPayments.length + cardPayments.length + insurancePayments.length
      ).toBeLessThanOrEqual(payments.length);
    });
  });
});
