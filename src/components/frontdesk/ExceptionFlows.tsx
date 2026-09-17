import React, { useState } from 'react';
import {
  AlertTriangle,
  Siren,
  UserX,
  CalendarX2,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Search,
  UserCheck,
  RefreshCw,
  Bell,
  Sparkles,
  PhoneCall,
  Mail,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoBadge } from '../common/NeoBadge';
import { NeoStatusPill } from '../common/NeoStatusPill';
import { Appointment, Patient, WaitlistEntry } from '../../types';
import { getTodayDateString } from '../../data/seedData';
import { EmergencyModal } from '../exceptions/EmergencyModal';
import { NoShowModal } from '../exceptions/NoShowModal';
import { CancellationModal } from '../exceptions/CancellationModal';
import { RescheduleModal } from '../exceptions/RescheduleModal';

interface ExceptionFlowsProps {
  onStartBooking?: (patientId?: string) => void;
}

export const ExceptionFlows: React.FC<ExceptionFlowsProps> = ({
  onStartBooking
}) => {
  const {
    appointments,
    patients,
    dentists,
    services,
    waitlist,
    settings,
    updatePatient,
    updateAppointmentStatus,
    sendNotification,
    createAppointment
  } = useDentalStore();

  const today = getTodayDateString();
  const [activeTab, setActiveTab] = useState<'emergencies' | 'noshows' | 'cancellations' | 'waitlist'>('emergencies');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isEmergencyOpen, setIsEmergencyOpen] = useState<boolean>(false);
  const [selectedNoShowApt, setSelectedNoShowApt] = useState<Appointment | null>(null);
  const [selectedCancelApt, setSelectedCancelApt] = useState<Appointment | null>(null);
  const [selectedRescheduleApt, setSelectedRescheduleApt] = useState<Appointment | null>(null);

  // Selected cancelled slot for waitlist matching
  const [slotToBackfill, setSlotToBackfill] = useState<Appointment | null>(null);

  // Filtered queries
  const emergencyAppointments = appointments.filter(
    (a) => a.isEmergency || a.status === 'Emergency'
  ).sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));

  const noShowAppointments = appointments.filter(
    (a) => a.status === 'No-Show'
  ).sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));

  const cancelledAppointments = appointments.filter(
    (a) => a.status === 'Cancelled'
  ).sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));

  // Candidates for no-show today (scheduled appointments whose start time passed without check-in)
  const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const potentialNoShows = appointments.filter(
    (a) => a.date === today && ['Confirmed', 'Requested'].includes(a.status)
  );

  // Patients with active no-show strikes
  const patientsWithStrikes = patients.filter((p) => p.noShowCount > 0 || p.requiresStaffReviewForBooking);

  // Active waitlist entries
  const activeWaitlist = waitlist.filter((w) => w.status === 'active');

  const handleForgiveStrike = (patient: Patient) => {
    const newCount = Math.max(0, patient.noShowCount - 1);
    updatePatient(patient.id, {
      noShowCount: newCount,
      requiresStaffReviewForBooking: newCount >= settings.maxNoShowsBeforeLock
    });
  };

  const handleToggleLock = (patient: Patient) => {
    updatePatient(patient.id, {
      requiresStaffReviewForBooking: !patient.requiresStaffReviewForBooking
    });
  };

  const handleBackfillSlotWithWaitlist = (slot: Appointment, waitlistEntry: WaitlistEntry) => {
    // 1. Book the waitlist candidate into this slot
    createAppointment({
      patientId: waitlistEntry.patientId,
      dentistId: slot.dentistId,
      serviceId: waitlistEntry.serviceId || slot.serviceId,
      date: slot.date,
      startTime: slot.startTime,
      bookingSource: 'phone_call',
      notes: `Backfilled from Waitlist into cancelled slot ${slot.appointmentNumber}`
    });

    // 2. Send notification to patient
    sendNotification({
      userId: waitlistEntry.patientId,
      patientId: waitlistEntry.patientId,
      type: 'waitlist_slot_available',
      title: 'Slot Confirmed from Waitlist!',
      message: `Great news! You have been scheduled for ${slot.date} at ${slot.startTime}.`,
      channel: 'in_app'
    });

    // 3. Clear modal
    setSlotToBackfill(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Exception & Disruption Flows</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              Disruption Guard Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Emergency triage dispatch, attendance strike enforcement, late cancellation recovery, and waitlist auto-fill.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NeoButton
            size="sm"
            variant="danger"
            onClick={() => setIsEmergencyOpen(true)}
            icon={<Siren className="w-4 h-4 animate-pulse" />}
          >
            Priority Emergency Intake
          </NeoButton>
        </div>
      </div>

      {/* Exception Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab('emergencies')}
          className={`neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all ${
            activeTab === 'emergencies' ? 'border-2 border-rose-400 bg-rose-50/20' : ''
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-rose-600">Emergencies Handled</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-rose-700">{emergencyAppointments.length}</span>
            <Siren className="w-5 h-5 text-rose-500" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Urgent triage & pain relief</span>
        </div>

        <div
          onClick={() => setActiveTab('noshows')}
          className={`neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all ${
            activeTab === 'noshows' ? 'border-2 border-amber-400 bg-amber-50/20' : ''
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-amber-600">No-Show Incidents</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-700">{noShowAppointments.length}</span>
            <UserX className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1">{patientsWithStrikes.length} patients with strikes</span>
        </div>

        <div
          onClick={() => setActiveTab('cancellations')}
          className={`neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all ${
            activeTab === 'cancellations' ? 'border-2 border-slate-400 bg-slate-50/50' : ''
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-600">Cancellations</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-800">{cancelledAppointments.length}</span>
            <CalendarX2 className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Available for chair backfill</span>
        </div>

        <div
          onClick={() => setActiveTab('waitlist')}
          className={`neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all ${
            activeTab === 'waitlist' ? 'border-2 border-blue-400 bg-blue-50/20' : ''
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-blue-600">Active Waitlist Backfill</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-blue-700">{activeWaitlist.length}</span>
            <Sparkles className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Patients ready for open slots</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="neo-flat p-1 rounded-2xl flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('emergencies')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'emergencies' ? 'bg-white shadow-xs text-rose-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Siren className="w-3.5 h-3.5" />
          <span>Emergency Triage Queue ({emergencyAppointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('noshows')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'noshows' ? 'bg-white shadow-xs text-amber-800' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserX className="w-3.5 h-3.5" />
          <span>No-Show Tracker & Strike Policy</span>
          {patientsWithStrikes.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
              {patientsWithStrikes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cancellations')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'cancellations' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarX2 className="w-3.5 h-3.5" />
          <span>Cancellation Slot Recovery</span>
        </button>

        <button
          onClick={() => setActiveTab('waitlist')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'waitlist' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Waitlist Auto-Fill Engine ({activeWaitlist.length})</span>
        </button>
      </div>

      {/* TAB 1: EMERGENCY TRIAGE QUEUE */}
      {activeTab === 'emergencies' && (
        <div className="space-y-4">
          <div className="neo-raised p-4 rounded-3xl bg-rose-50/40 border border-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-rose-900">Priority Dental Emergency Intake Protocol</h2>
              <p className="text-xs text-rose-700 mt-0.5">
                Acute toothache, dental abscess, traumatic tooth displacement, facial swelling, or severe bleeding.
                Emergencies bypass standard queue position and are assigned immediate operatory chairs.
              </p>
            </div>
            <NeoButton
              variant="danger"
              onClick={() => setIsEmergencyOpen(true)}
              icon={<Siren className="w-4 h-4" />}
            >
              Dispatch Emergency Patient
            </NeoButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emergencyAppointments.length === 0 ? (
              <div className="col-span-full neo-card p-8 text-center text-slate-400">
                No active dental emergencies recorded.
              </div>
            ) : (
              emergencyAppointments.map((apt) => {
                const pat = patients.find((p) => p.id === apt.patientId);
                const dent = dentists.find((d) => d.id === apt.dentistId);
                const srv = services.find((s) => s.id === apt.serviceId);

                return (
                  <div
                    key={apt.id}
                    className="neo-raised p-4 rounded-3xl bg-white border-2 border-rose-300 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white flex items-center gap-1">
                          <Siren className="w-3 h-3" /> EMERGENCY
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-600">{apt.date}</span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 mt-2">{pat?.fullName}</h3>
                      <p className="text-xs text-slate-500 font-mono">{pat?.patientNumber} • {pat?.phone}</p>

                      <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-xs space-y-1">
                        <p className="text-rose-900 font-bold">Severity: {apt.emergencySeverity?.toUpperCase() || 'CRITICAL'}</p>
                        {apt.emergencyNotes && (
                          <p className="text-rose-700 italic">"{apt.emergencyNotes}"</p>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-slate-600 flex justify-between">
                        <span>Assigned Doctor:</span>
                        <span className="font-bold text-slate-800">{dent?.fullName}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <NeoStatusPill status={apt.status} />
                      {apt.status === 'Emergency' && (
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'In-Consultation')}
                          className="px-3 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl cursor-pointer"
                        >
                          Seat in Chair
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: NO-SHOW TRACKER & STRIKE POLICY */}
      {activeTab === 'noshows' && (
        <div className="space-y-4">
          <div className="neo-raised p-4 rounded-3xl bg-amber-50/40 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-amber-900">No-Show Strike Tracker & Booking Lock Policy</h2>
              <p className="text-xs text-amber-700 mt-0.5">
                Clinic policy: {settings.maxNoShowsBeforeLock} strikes trigger automatic online booking lock requiring staff review.
                Grace period before marking no-show is {settings.pendingHoldMinutes || 15} minutes.
              </p>
            </div>
          </div>

          {/* Unattended Today alert */}
          {potentialNoShows.length > 0 && (
            <NeoCard className="p-4 bg-amber-50/60 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-xs text-amber-900 uppercase">
                  Patients Scheduled Today Not Yet Checked In ({potentialNoShows.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {potentialNoShows.map((apt) => {
                  const pat = patients.find((p) => p.id === apt.patientId);
                  return (
                    <div key={apt.id} className="p-2.5 rounded-xl bg-white border border-amber-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{pat?.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Slot: {apt.startTime} ({apt.appointmentNumber})</p>
                      </div>
                      <button
                        onClick={() => setSelectedNoShowApt(apt)}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 cursor-pointer"
                      >
                        Mark No-Show
                      </button>
                    </div>
                  );
                })}
              </div>
            </NeoCard>
          )}

          {/* Patients with active strikes list */}
          <NeoCard className="p-0 overflow-x-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Patients with Attendance Infractions & Strikes</h3>
              <span className="text-xs text-slate-500">Total: {patientsWithStrikes.length}</span>
            </div>
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Phone / Contact</th>
                  <th className="py-3 px-4 text-center">Strike Count</th>
                  <th className="py-3 px-4 text-center">Booking Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patientsWithStrikes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Great news! No patients currently have active attendance strikes.
                    </td>
                  </tr>
                ) : (
                  patientsWithStrikes.map((patient) => {
                    const isLocked = patient.noShowCount >= settings.maxNoShowsBeforeLock || patient.requiresStaffReviewForBooking;

                    return (
                      <tr key={patient.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{patient.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{patient.patientNumber}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {patient.phone}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                            patient.noShowCount >= 3 ? 'bg-rose-100 text-rose-800' :
                            patient.noShowCount >= 2 ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {patient.noShowCount} / {settings.maxNoShowsBeforeLock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isLocked ? (
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                              LOCKED (Staff Review)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Active / Warning
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleForgiveStrike(patient)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer"
                          >
                            Forgive Strike (-1)
                          </button>
                          <button
                            onClick={() => handleToggleLock(patient)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                              isLocked ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            {isLocked ? 'Unlock Patient' : 'Lock Booking'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </NeoCard>
        </div>
      )}

      {/* TAB 3: CANCELLATIONS & SLOT RECOVERY */}
      {activeTab === 'cancellations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Cancelled Appointments & Chair Salvage</h2>
              <p className="text-xs text-slate-500">
                Instantly match vacated chair slots with waitlisted patients to prevent lost clinic revenue.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cancelledAppointments.length === 0 ? (
              <div className="col-span-full neo-card p-8 text-center text-slate-400">
                No cancelled appointments recorded.
              </div>
            ) : (
              cancelledAppointments.map((apt) => {
                const pat = patients.find((p) => p.id === apt.patientId);
                const dent = dentists.find((d) => d.id === apt.dentistId);
                const srv = services.find((s) => s.id === apt.serviceId);

                return (
                  <div
                    key={apt.id}
                    className="neo-raised p-4 rounded-3xl bg-white border border-slate-200 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-400">{apt.date}</span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                          Slot: {apt.startTime} - {apt.endTime}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mt-2">{pat?.fullName}</h3>
                      <p className="text-xs text-slate-500 font-mono">{dent?.fullName} • {srv?.name}</p>

                      {apt.cancellationReason && (
                        <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic">
                          "{apt.cancellationReason}"
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => setSlotToBackfill(apt)}
                        className="neo-btn-primary flex-1 py-1.5 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Backfill with Waitlist</span>
                      </button>
                      <button
                        onClick={() => setSelectedRescheduleApt(apt)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: WAITLIST AUTO-FILL ENGINE */}
      {activeTab === 'waitlist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Patients on Active Waitlist</h2>
              <p className="text-xs text-slate-500">
                Patients seeking earlier openings or specific doctor slots.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl">
              {activeWaitlist.length} active candidates
            </span>
          </div>

          <NeoCard className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Service Needed</th>
                  <th className="py-3 px-4">Preferred Date / Time</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeWaitlist.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No active waitlist entries.
                    </td>
                  </tr>
                ) : (
                  activeWaitlist.map((entry) => {
                    const pat = patients.find((p) => p.id === entry.patientId);
                    const srv = services.find((s) => s.id === entry.serviceId);
                    const dent = dentists.find((d) => d.id === entry.preferredDentistId);

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{pat?.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{pat?.phone}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {srv?.name}
                          {dent && <span className="block text-[10px] text-slate-400">Prefers: {dent.fullName}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-mono text-slate-700">{entry.preferredDate}</p>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {entry.preferredTimeRange}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            entry.priority === 'urgent' ? 'bg-rose-100 text-rose-800' :
                            entry.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {entry.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              if (onStartBooking) onStartBooking(entry.patientId);
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer"
                          >
                            Book Now
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </NeoCard>
        </div>
      )}

      {/* Backfill Modal */}
      {slotToBackfill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="neo-raised p-6 rounded-3xl bg-white max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-800">Backfill Vacated Slot</h3>
                <p className="text-xs text-slate-500">
                  {slotToBackfill.date} at {slotToBackfill.startTime} with{' '}
                  {dentists.find((d) => d.id === slotToBackfill.dentistId)?.fullName}
                </p>
              </div>
              <button
                onClick={() => setSlotToBackfill(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Matching Waitlist Candidate:
              </h4>

              {activeWaitlist.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No patients currently on the waitlist.
                </p>
              ) : (
                activeWaitlist.map((w) => {
                  const pat = patients.find((p) => p.id === w.patientId);
                  const srv = services.find((s) => s.id === w.serviceId);

                  return (
                    <div
                      key={w.id}
                      className="p-3 rounded-2xl neo-flat hover:border-blue-300 border border-transparent flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{pat?.fullName}</p>
                        <p className="text-[11px] text-slate-500">{srv?.name} • Priority: {w.priority}</p>
                      </div>
                      <button
                        onClick={() => handleBackfillSlotWithWaitlist(slotToBackfill, w)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                      >
                        Assign Slot
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <NeoButton
                variant="default"
                onClick={() => setSlotToBackfill(null)}
              >
                Cancel
              </NeoButton>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      <NoShowModal
        isOpen={Boolean(selectedNoShowApt)}
        onClose={() => setSelectedNoShowApt(null)}
        appointment={selectedNoShowApt}
      />

      <CancellationModal
        isOpen={Boolean(selectedCancelApt)}
        onClose={() => setSelectedCancelApt(null)}
        appointment={selectedCancelApt}
      />

      <RescheduleModal
        isOpen={Boolean(selectedRescheduleApt)}
        onClose={() => setSelectedRescheduleApt(null)}
        appointment={selectedRescheduleApt}
      />
    </div>
  );
};
