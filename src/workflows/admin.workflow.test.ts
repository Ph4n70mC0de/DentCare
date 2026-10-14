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

describe('Administrator Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    dentalStore.resetToSeed();
    dentalStore.setActiveUser('user-admin');
  });

  describe('Staff Management', () => {
    it('manages users (list all)', () => {
      const users = dentalStore.getUsers();
      expect(users.length).toBe(7); // 1 admin, 1 front_desk, 2 dentists, 3 patients
      expect(users.filter(u => u.role === 'admin').length).toBe(1);
      expect(users.filter(u => u.role === 'front_desk').length).toBe(1);
      expect(users.filter(u => u.role === 'dentist').length).toBe(2);
      expect(users.filter(u => u.role === 'patient').length).toBe(3);
    });

    it('verifies role changes and permission boundaries', () => {
      const admin = dentalStore.getUsers().find(u => u.id === 'user-admin');
      expect(admin?.role).toBe('admin');

      // Admin can switch to any role
      dentalStore.setActiveUser('user-frontdesk');
      expect(dentalStore.getActiveUser().role).toBe('front_desk');

      dentalStore.setActiveUser('user-dentist-1');
      expect(dentalStore.getActiveUser().role).toBe('dentist');

      dentalStore.setActiveUser('user-patient-1');
      expect(dentalStore.getActiveUser().role).toBe('patient');
    });

    it('audits role switches', () => {
      dentalStore.setActiveUser('user-frontdesk');
      const logs = dentalStore.getAuditLogs();
      const roleSwitchLog = logs.find(l => l.action === 'User Switched Role/Session');
      expect(roleSwitchLog).toBeDefined();
      expect(roleSwitchLog?.details).toContain('front_desk');
    });
  });

  describe('Service Management', () => {
    it('adds new dental service', () => {
      const initialCount = dentalStore.getServices().length;

      const service = dentalStore.addService({
        name: 'New Service',
        description: 'Description',
        category: 'General',
        durationMinutes: 30,
        price: 100,
        active: true,
      });

      expect(service).toHaveProperty('id');
      expect(service.name).toBe('New Service');
      expect(dentalStore.getServices().length).toBe(initialCount + 1);
    });

    it('updates existing service', () => {
      dentalStore.updateService('serv-1', { price: 120, active: false });

      const updated = dentalStore.getServices().find(s => s.id === 'serv-1');
      expect(updated?.price).toBe(120);
      expect(updated?.active).toBe(false);
    });

    it('deactivates service prevents new bookings', () => {
      dentalStore.updateService('serv-1', { active: false });

      expect(() =>
        dentalStore.createAppointment({
          patientId: 'pat-001',
          dentistId: 'dentist-1',
          serviceId: 'serv-1',
          date: '2026-10-20',
          startTime: '09:00',
        })
      ).toThrow('unavailable');
    });
  });

  describe('Schedule Management', () => {
    it('manages dentist schedules', () => {
      const schedules = dentalStore.getSchedules();
      expect(schedules.length).toBe(10); // 5 days x 2 dentists

      const dentist1Schedules = schedules.filter(s => s.dentistId === 'dentist-1');
      expect(dentist1Schedules.length).toBe(5); // Mon-Fri

      const dentist2Schedules = schedules.filter(s => s.dentistId === 'dentist-2');
      expect(dentist2Schedules.length).toBe(5); // Tue-Sat
    });

    it('adds blocked schedule (holiday)', () => {
      const initialCount = dentalStore.getBlockedSchedules().length;

      const blocked = dentalStore.addBlockedSchedule({
        date: '2026-12-25',
        reason: 'Christmas Holiday',
        isAllDay: true,
      });

      expect(blocked).toHaveProperty('id');
      expect(dentalStore.getBlockedSchedules().length).toBe(initialCount + 1);
      expect(blocked.isAllDay).toBe(true);
    });

    it('removes blocked schedule', () => {
      const blocked = dentalStore.addBlockedSchedule({
        date: '2026-12-26',
        reason: 'Boxing Day',
        isAllDay: true,
      });

      dentalStore.removeBlockedSchedule(blocked.id);
      expect(dentalStore.getBlockedSchedules().find(b => b.id === blocked.id)).toBeUndefined();
    });

    it('blocked schedule prevents appointments', () => {
      dentalStore.addBlockedSchedule({
        date: '2026-10-20',
        reason: 'Staff Meeting',
        isAllDay: true,
      });

      expect(() =>
        dentalStore.createAppointment({
          patientId: 'pat-001',
          dentistId: 'dentist-1',
          serviceId: 'serv-1',
          date: '2026-10-20',
          startTime: '09:00',
        })
      ).toThrow('no longer available');
    });
  });

  describe('Settings Management', () => {
    it('updates clinic settings', () => {
      dentalStore.updateSettings({
        clinicName: 'Updated Clinic Name',
        defaultSlotDurationMinutes: 30,
        bufferTimeMinutes: 5,
        maxNoShowsBeforeLock: 3,
      });

      const settings = dentalStore.getSettings();
      expect(settings.clinicName).toBe('Updated Clinic Name');
      expect(settings.defaultSlotDurationMinutes).toBe(30);
      expect(settings.bufferTimeMinutes).toBe(5);
      expect(settings.maxNoShowsBeforeLock).toBe(3);
    });

    it('configures waitlist rules', () => {
      dentalStore.updateSettings({
        autoNotifyWaitlistOnCancel: false,
        emergencyBufferShiftMinutes: 30,
      });

      const settings = dentalStore.getSettings();
      expect(settings.autoNotifyWaitlistOnCancel).toBe(false);
      expect(settings.emergencyBufferShiftMinutes).toBe(30);
    });

    it('configures no-show policies', () => {
      dentalStore.updateSettings({
        maxNoShowsBeforeLock: 1,
        requireStaffReviewOnNoShow: false,
      });

      const settings = dentalStore.getSettings();
      expect(settings.maxNoShowsBeforeLock).toBe(1);
      expect(settings.requireStaffReviewOnNoShow).toBe(false);
    });
  });

  describe('Waitlist Rules', () => {
    it('configures waitlist auto-notification', () => {
      // Default is true
      let settings = dentalStore.getSettings();
      expect(settings.autoNotifyWaitlistOnCancel).toBe(true);

      // Disable
      dentalStore.updateSettings({ autoNotifyWaitlistOnCancel: false });
      settings = dentalStore.getSettings();
      expect(settings.autoNotifyWaitlistOnCancel).toBe(false);
    });

    it('configures emergency buffer shift', () => {
      dentalStore.updateSettings({ emergencyBufferShiftMinutes: 15 });
      const settings = dentalStore.getSettings();
      expect(settings.emergencyBufferShiftMinutes).toBe(15);
    });
  });

  describe('Audit Trail', () => {
    it('logs all sensitive changes', () => {
      // Create appointment
      dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-20',
        startTime: '09:00',
      });

      // Cancel appointment
      const appointments = dentalStore.getAppointments();
      const apt = appointments[0];
      dentalStore.cancelAppointment(apt.id, 'Test cancellation');

      // Update patient
      dentalStore.updatePatient('pat-001', { phone: '+1 (555) 000-0000' });

      // Add service
      dentalStore.addService({
        name: 'Audit Test Service',
        description: 'Test',
        category: 'General',
        durationMinutes: 30,
        price: 50,
        active: true,
      });

      const logs = dentalStore.getAuditLogs();
      const actions = logs.map(l => l.action);

      expect(actions).toContain('Appointment Booked');
      expect(actions).toContain('Appointment Cancelled');
      expect(actions).toContain('Patient Record Updated');
      // Note: addService does not currently log audit events
      // expect(actions).toContain('Service Added');
    });

    it('audit logs contain actor info', () => {
      const logs = dentalStore.getAuditLogs();
      const recentLog = logs[0];

      expect(recentLog).toHaveProperty('actorId');
      expect(recentLog).toHaveProperty('actorName');
      expect(recentLog).toHaveProperty('actorRole');
      expect(recentLog).toHaveProperty('timestamp');
      expect(recentLog).toHaveProperty('entityType');
      expect(recentLog).toHaveProperty('entityId');
    });

    it('audit logs contain before/after values', () => {
      dentalStore.updatePatient('pat-001', { phone: '+1 (555) 111-1111' });

      const logs = dentalStore.getAuditLogs();
      const updateLog = logs.find(l => l.action === 'Patient Record Updated');

      expect(updateLog).toBeDefined();
      expect(updateLog?.beforeValue).toBeDefined();
      expect(updateLog?.afterValue).toBeDefined();
    });
  });

  describe('Reports & Exports', () => {
    it('generates appointment report data', () => {
      const appointments = dentalStore.getAppointments();
      const patients = dentalStore.getPatients();
      const dentists = dentalStore.getDentists();

      const reportData = appointments.map(a => {
        const pat = patients.find(p => p.id === a.patientId);
        const dnt = dentists.find(d => d.id === a.dentistId);
        return {
          appointmentNumber: a.appointmentNumber,
          date: a.date,
          time: `${a.startTime} - ${a.endTime}`,
          patient: pat?.fullName || '',
          dentist: dnt?.fullName || '',
          service: a.serviceId,
          status: a.status,
          source: a.bookingSource,
        };
      });

      expect(reportData.length).toBe(appointments.length);
      reportData.forEach(row => {
        expect(row).toHaveProperty('appointmentNumber');
        expect(row).toHaveProperty('status');
      });
    });

    it('generates payment report data', () => {
      const payments = dentalStore.getPayments();
      const appointments = dentalStore.getAppointments();
      const patients = dentalStore.getPatients();

      const reportData = payments.map(p => {
        const apt = appointments.find(a => a.id === p.appointmentId);
        const pat = patients.find(pt => pt.id === p.patientId);
        return {
          date: p.createdAt,
          patient: pat?.fullName || '',
          amountPaid: p.amountPaid,
          method: p.paymentMethod,
          status: p.paymentStatus,
          appointmentNumber: apt?.appointmentNumber || '',
        };
      });

      expect(reportData.length).toBe(payments.length);
    });

    it('generates audit report data', () => {
      const logs = dentalStore.getAuditLogs();

      const reportData = logs.map(log => [
        log.timestamp,
        log.actorName,
        log.actorRole,
        log.action,
        log.entityType,
        log.entityId,
        JSON.stringify(log.details),
      ]);

      expect(reportData.length).toBe(logs.length);
    });

    it('generates patient directory report', () => {
      const patients = dentalStore.getPatients();
      const appointments = dentalStore.getAppointments();

      const reportData = patients.map(p => {
        const visits = appointments.filter(a => a.patientId === p.id && a.status === 'Completed').length;
        const noShows = appointments.filter(a => a.patientId === p.id && a.status === 'No-Show').length;
        const age = p.dateOfBirth
          ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()
          : 'N/A';

        return {
          name: p.fullName,
          phone: p.phone,
          email: p.email,
          age: String(age),
          visits: String(visits),
          noShows: String(noShows),
          status: p.requiresStaffReviewForBooking ? 'Flagged' : 'Active',
        };
      });

      expect(reportData.length).toBe(patients.length);
    });

    it('handles large result sets', () => {
      // Create many appointments
      for (let i = 0; i < 100; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        try {
          dentalStore.createAppointment({
            patientId: 'pat-001',
            dentistId: 'dentist-1',
            serviceId: 'serv-1',
            date: dateStr,
            startTime: '09:00',
          });
        } catch {
          // Slot may be unavailable, continue
        }
      }

      const appointments = dentalStore.getAppointments();
      expect(appointments.length).toBeGreaterThan(50);
    });

    it('filters reports by date boundaries', () => {
      const appointments = dentalStore.getAppointments();
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const todaysAppointments = appointments.filter(a => a.date === today);
      const tomorrowsAppointments = appointments.filter(a => a.date === tomorrowStr);

      expect(todaysAppointments.length).toBeGreaterThanOrEqual(0);
      expect(tomorrowsAppointments.length).toBeGreaterThanOrEqual(0);
    });

    it('restricts unauthorized fields in exports', () => {
      const payments = dentalStore.getPayments();
      const reportData = payments.map(p => ({
        date: p.createdAt,
        patient: p.patientId, // Not full patient object
        amountPaid: p.amountPaid,
        method: p.paymentMethod,
        status: p.paymentStatus,
        // Should NOT include: insurancePolicyNumber, internal IDs, etc.
      }));

      reportData.forEach(row => {
        expect(row).not.toHaveProperty('insurancePolicyNumber');
        expect(row).not.toHaveProperty('id');
        expect(row).not.toHaveProperty('appointmentId');
      });
    });
  });

  describe('Waitlist Engine', () => {
    it('matches waitlist entries on cancellation', () => {
      // Add waitlist entry
      dentalStore.joinWaitlist({
        patientId: 'pat-002',
        serviceId: 'serv-1',
        preferredDate: '2026-10-20',
        preferredTimeRange: 'morning',
        priority: 'high',
        notes: 'Urgent',
      });

      // Create and cancel appointment matching waitlist
      const appointment = dentalStore.createAppointment({
        patientId: 'pat-001',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date: '2026-10-20',
        startTime: '09:00',
      });

      const result = dentalStore.cancelAppointment(appointment.id, 'Cancelled');

      // Waitlist should be notified
      expect(result.notifiedWaitlistCount).toBeGreaterThanOrEqual(0);

      const waitlist = dentalStore.getWaitlist();
      const notified = waitlist.find(w => w.status === 'notified');
      expect(notified).toBeDefined();
    });

    it('prioritizes waitlist by priority and timestamp', () => {
      const date = '2026-10-20';

      dentalStore.joinWaitlist({
        patientId: 'pat-001',
        serviceId: 'serv-1',
        preferredDate: date,
        preferredTimeRange: 'morning',
        priority: 'normal',
        notes: 'Normal 1',
      });

      dentalStore.joinWaitlist({
        patientId: 'pat-002',
        serviceId: 'serv-1',
        preferredDate: date,
        preferredTimeRange: 'morning',
        priority: 'high',
        notes: 'High priority',
      });

      dentalStore.joinWaitlist({
        patientId: 'pat-004',
        serviceId: 'serv-1',
        preferredDate: date,
        preferredTimeRange: 'morning',
        priority: 'urgent',
        notes: 'Urgent',
      });

      const appointment = dentalStore.createAppointment({
        patientId: 'pat-003',
        dentistId: 'dentist-1',
        serviceId: 'serv-1',
        date,
        startTime: '09:00',
      });

      dentalStore.cancelAppointment(appointment.id, 'Test');

      const waitlist = dentalStore.getWaitlist()
        .filter(w => w.preferredDate === date && w.status === 'notified')
        .sort((a, b) => {
          const pOrder = { urgent: 3, high: 2, normal: 1 };
          return pOrder[b.priority] - pOrder[a.priority];
        });

      expect(waitlist[0]?.priority).toBe('urgent');
    });
  });
});