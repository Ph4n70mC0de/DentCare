import { useState, useEffect } from 'react';
import { dentalStore } from './store';

export function useDentalStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    dentalStore.processScheduledReminders();
    const unsubscribe = dentalStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    const intervalId = setInterval(() => {
      dentalStore.processScheduledReminders();
    }, 60000);
    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  const activeUser = dentalStore.getActiveUser();
  const users = dentalStore.getUsers();
  const patients = dentalStore.getPatients();
  const dentists = dentalStore.getDentists();
  const services = dentalStore.getServices();
  const schedules = dentalStore.getSchedules();
  const blockedSchedules = dentalStore.getBlockedSchedules();
  const appointments = dentalStore.getAppointments();
  const waitlist = dentalStore.getWaitlist();
  const consultations = dentalStore.getConsultations();
  const payments = dentalStore.getPayments();
  const notifications = dentalStore.getNotifications();
  const auditLogs = dentalStore.getAuditLogs();
  const settings = dentalStore.getSettings();

  // Active patient if current activeUser is a patient
  const currentPatient = patients.find((p) => p.userId === activeUser.id) || patients[0];
  // Active dentist if current activeUser is a dentist
  const currentDentist = dentists.find((d) => d.userId === activeUser.id) || dentists[0];

  return {
    activeUser,
    currentPatient,
    currentDentist,
    users,
    patients,
    dentists,
    services,
    schedules,
    blockedSchedules,
    appointments,
    waitlist,
    consultations,
    payments,
    notifications,
    auditLogs,
    settings,
    // Actions
    setActiveUser: (userId: string) => dentalStore.setActiveUser(userId),
    registerPatient: (data: Parameters<typeof dentalStore.registerPatient>[0]) => dentalStore.registerPatient(data),
    confirmPatientBookingEligibility: (patientId: string) => dentalStore.confirmPatientBookingEligibility(patientId),
    updatePatient: (id: string, updates: Parameters<typeof dentalStore.updatePatient>[1]) => dentalStore.updatePatient(id, updates),
    findPatient: (term: string) => dentalStore.findPatientByPhoneOrEmail(term),
    createAppointment: (data: Parameters<typeof dentalStore.createAppointment>[0]) => dentalStore.createAppointment(data),
    updateAppointmentStatus: (id: string, status: Parameters<typeof dentalStore.updateAppointmentStatus>[1], meta?: Record<string, unknown>) =>
      dentalStore.updateAppointmentStatus(id, status, meta),
    cancelAppointment: (id: string, reason: string) => dentalStore.cancelAppointment(id, reason),
    rescheduleAppointment: (id: string, newDate: string, newStartTime: string) => dentalStore.rescheduleAppointment(id, newDate, newStartTime),
    markNoShow: (id: string, reason: string) => dentalStore.markNoShow(id, reason),
    createEmergencyAppointment: (data: Parameters<typeof dentalStore.createEmergencyAppointment>[0]) => dentalStore.createEmergencyAppointment(data),
    joinWaitlist: (data: Parameters<typeof dentalStore.joinWaitlist>[0]) => dentalStore.joinWaitlist(data),
    leaveWaitlist: (id: string) => dentalStore.leaveWaitlist(id),
    cancelWaitlistEntry: (id: string) => dentalStore.leaveWaitlist(id),
    scheduleFollowUpReminder: (appointmentId: string) => dentalStore.scheduleFollowUpReminder(appointmentId),
    processScheduledReminders: () => dentalStore.processScheduledReminders(),
    sendNotification: (notif: Parameters<typeof dentalStore.sendNotification>[0]) => dentalStore.sendNotification(notif),
    saveConsultation: (data: Parameters<typeof dentalStore.saveConsultation>[0]) => dentalStore.saveConsultation(data),
    processPayment: (data: Parameters<typeof dentalStore.processPayment>[0]) => dentalStore.processPayment(data),
    markNotificationAsRead: (id: string) => dentalStore.markNotificationAsRead(id),
    markAllNotificationsAsRead: (userId?: string) => dentalStore.markAllNotificationsAsRead(userId),
    updateSettings: (updates: Parameters<typeof dentalStore.updateSettings>[0]) => dentalStore.updateSettings(updates),
    addService: (serv: Parameters<typeof dentalStore.addService>[0]) => dentalStore.addService(serv),
    updateService: (id: string, updates: Parameters<typeof dentalStore.updateService>[1]) => dentalStore.updateService(id, updates),
    addBlockedSchedule: (b: Parameters<typeof dentalStore.addBlockedSchedule>[0]) => dentalStore.addBlockedSchedule(b),
    removeBlockedSchedule: (id: string) => dentalStore.removeBlockedSchedule(id),
    getAvailableSlotsForDate: (dentistId: string, date: string, duration: number) => dentalStore.getAvailableSlotsForDate(dentistId, date, duration),
    getAlternativeDates: (dentistId: string, date: string, duration: number, count?: number) => dentalStore.getAlternativeDates(dentistId, date, duration, count),
    resetToSeed: () => dentalStore.resetToSeed()
  };
}
