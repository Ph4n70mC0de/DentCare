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

describe('Data Integrity — Unique ID Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    dentalStore.resetToSeed();
  });

  it('assigns unique IDs to appointments created in the same tick', () => {
    // Regression test: two records created within the same millisecond used to
    // receive identical `apt-${Date.now()}` IDs, which made find-by-id resolve
    // the wrong record and let conflict exclusion skip real conflicts.
    const created = [];
    for (let i = 0; i < 25; i++) {
      try {
        created.push(
          dentalStore.createAppointment({
            patientId: 'pat-001',
            dentistId: 'dentist-2',
            serviceId: 'serv-1',
            date: '2026-12-24', // Sunday; only dentist-2 works
            // Walk down the day so each slot is free
            startTime: `${String(16 - Math.floor(i * 0.75)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
          })
        );
      } catch {
        // Slot may be unavailable; skip
      }
    }

    const ids = created.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
  });

  it('gives waitlist entries unique IDs when created together', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      dentalStore.joinWaitlist({
        patientId: 'pat-001',
        serviceId: 'serv-1',
        preferredDate: '2026-12-24',
        preferredTimeRange: 'morning',
        priority: 'normal',
        notes: `entry-${i}`,
      })
    );

    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives payments unique IDs when created together', () => {
    const base = {
      patientId: 'pat-001',
      subtotal: 100,
      discount: 0,
      insuranceCoverage: 0,
      amountPaid: 100,
      balance: 0,
      paymentMethod: 'Cash' as const,
      paymentStatus: 'Paid' as const,
    };

    const payments = Array.from({ length: 10 }, (_, i) =>
      dentalStore.processPayment({
        ...base,
        appointmentId: `apt-test-${i}`,
      })
    );

    const ids = payments.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves the correct record when two appointments share a timestamp', () => {
    // Two appointments created back-to-back; each must remain individually addressable.
    const first = dentalStore.createAppointment({
      patientId: 'pat-001',
      dentistId: 'dentist-2',
      serviceId: 'serv-1',
      date: '2026-12-24',
      startTime: '09:00',
    });

    const second = dentalStore.createAppointment({
      patientId: 'pat-002',
      dentistId: 'dentist-2',
      serviceId: 'serv-1',
      date: '2026-12-24',
      startTime: '10:00',
    });

    expect(first.id).not.toBe(second.id);

    // Cancelling one must not affect the other.
    dentalStore.cancelAppointment(first.id, 'test');

    const after = dentalStore.getAppointments();
    expect(after.find((a) => a.id === first.id)?.status).toBe('Cancelled');
    expect(after.find((a) => a.id === second.id)?.status).toBe('Confirmed');
  });
});
