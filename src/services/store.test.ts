import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dentalStore } from './store';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('DentalDataStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    // Reset store by creating new instance
    dentalStore.resetToSeed();
  });

  describe('getters', () => {
    it('returns initial users', () => {
      const users = dentalStore.getUsers();
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('role');
      expect(users[0]).toHaveProperty('fullName');
    });

    it('returns initial patients', () => {
      const patients = dentalStore.getPatients();
      expect(patients.length).toBeGreaterThan(0);
      expect(patients[0]).toHaveProperty('patientNumber');
    });

    it('returns initial dentists', () => {
      const dentists = dentalStore.getDentists();
      expect(dentists.length).toBe(2);
    });

    it('returns initial services', () => {
      const services = dentalStore.getServices();
      expect(services.length).toBe(7);
    });

    it('returns initial appointments', () => {
      const appointments = dentalStore.getAppointments();
      expect(appointments.length).toBeGreaterThan(0);
    });

    it('returns active user', () => {
      const user = dentalStore.getActiveUser();
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('role');
    });
  });

  describe('appointment lifecycle', () => {
    it('creates appointment with valid data', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-15',
        startTime: '09:00',
        bookingSource: 'online_form',
      });

      expect(appointment).toHaveProperty('id');
      expect(appointment.status).toBe('Confirmed');
      expect(appointment.appointmentNumber).toMatch(/^DC-\d{4}-\d{4}$/);
    });

    it('rejects appointment for non-existent patient', () => {
      expect(() =>
        dentalStore.createAppointment({
          patientId: 'non-existent',
          dentistId: 'dentist-1',
          serviceId: 'serv-1',
          date: '2026-10-15',
          startTime: '09:00',
        })
      ).toThrow('Patient record not found');
    });

    it('rejects appointment for inactive service', () => {
      // First deactivate a service
      dentalStore.updateService('serv-1', { active: false });

      expect(() =>
        dentalStore.createAppointment({
          patientId: 'pat-001',
          dentistId: 'dentist-1',
          serviceId: 'serv-1',
          date: '2026-10-15',
          startTime: '09:00',
        })
      ).toThrow('Selected dental service is unavailable');
    });

    it('updates appointment status through valid transitions', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-15',
        startTime: '09:00',
      });

      // Confirmed -> Checked-In
      const checkedIn = dentalStore.updateAppointmentStatus(appointment.id, 'Checked-In');
      expect(checkedIn?.status).toBe('Waiting'); // Immediately becomes Waiting

      // Waiting -> In-Consultation
      const inConsultation = dentalStore.updateAppointmentStatus(checkedIn!.id, 'In-Consultation');
      expect(inConsultation?.status).toBe('In-Consultation');

      // In-Consultation -> Payment-Pending
      const paymentPending = dentalStore.updateAppointmentStatus(inConsultation!.id, 'Payment-Pending');
      expect(paymentPending?.status).toBe('Payment-Pending');

      // Payment-Pending -> Completed
      const completed = dentalStore.updateAppointmentStatus(paymentPending!.id, 'Completed');
      expect(completed?.status).toBe('Completed');
    });

    it('rejects invalid status transitions', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-15',
        startTime: '09:00',
      });

      // Cannot go from Confirmed directly to Completed
      const result = dentalStore.updateAppointmentStatus(appointment.id, 'Completed');
      expect(result).toBeNull();
    });
  });

  describe('waitlist', () => {
    it('adds waitlist entry with required fields', () => {
      const entry = dentalStore.joinWaitlist({
        patientId: 'pat-001',
        serviceId: 'serv-1',
        preferredDate: '2026-10-15',
        preferredTimeRange: 'morning',
        priority: 'normal',
        notes: 'Test waitlist entry',
      });

      expect(entry).toHaveProperty('id');
      expect(entry.status).toBe('active');
      expect(entry.priority).toBe('normal');
    });
  });

  describe('payments', () => {
    it('processes payment and marks appointment completed when paid', () => {
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-15',
        startTime: '09:00',
      });

      // Move through valid transitions: Confirmed -> Checked-In -> Waiting -> In-Consultation -> Payment-Pending
      dentalStore.updateAppointmentStatus(appointment.id, 'Checked-In'); // becomes Waiting
      dentalStore.updateAppointmentStatus(appointment.id, 'In-Consultation');
      const paymentPendingApt = dentalStore.updateAppointmentStatus(appointment.id, 'Payment-Pending');
      expect(paymentPendingApt?.status).toBe('Payment-Pending');

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

      expect(payment.paymentStatus).toBe('Paid');
      expect(payment.balance).toBe(0);

      // Verify appointment is now Completed
      const updatedApt = dentalStore.getAppointments().find(a => a.id === appointment.id);
      expect(updatedApt?.status).toBe('Completed');
    });
  });
});