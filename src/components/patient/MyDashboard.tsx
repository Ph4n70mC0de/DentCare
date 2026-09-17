import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CalendarPlus,
  FileText,
  AlertCircle,
  CheckCircle2,
  CalendarX2,
  CalendarClock,
  Sparkles,
  Pill,
  Download,
  Stethoscope,
  ChevronRight,
  ShieldAlert,
  Search,
  Filter,
  Printer,
  BellRing,
  Check,
  Info,
  User,
  HeartPulse,
  CalendarCheck2,
  Plus,
  Phone,
  MapPin,
  CreditCard,
  ShieldCheck,
  Smile,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  FileSpreadsheet,
  Activity,
  UserCheck
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { NeoSelect } from '../common/NeoSelect';
import { NeoStatusPill } from '../common/NeoStatusPill';
import { NeoBadge } from '../common/NeoBadge';
import { Appointment, Consultation, WaitlistEntry } from '../../types';
import { CancellationModal } from '../exceptions/CancellationModal';
import { RescheduleModal } from '../exceptions/RescheduleModal';
import { BookingWizard } from './BookingWizard';
import { getTodayDateString } from '../../data/seedData';
import { getRelativeDay, getPatientAge, downloadICS, exportVisitsCSV, getTomorrowDate } from './patientUtils';
import { JoinWaitlistModal } from './JoinWaitlistModal';

interface MyDashboardProps {
  onStartBooking: () => void;
  onSelectTab: (tab: string) => void;
  selectedForCancel: Appointment | null;
  setSelectedForCancel: (apt: Appointment | null) => void;
  selectedForReschedule: Appointment | null;
  setSelectedForReschedule: (apt: Appointment | null) => void;
  isWaitlistModalOpen: boolean;
  setIsWaitlistModalOpen: (open: boolean) => void;
  onJoinWaitlist: (entry: Omit<WaitlistEntry, 'id' | 'createdAt'>) => void;
}

export const MyDashboard: React.FC<MyDashboardProps> = ({ onStartBooking, onSelectTab, selectedForCancel, setSelectedForCancel, selectedForReschedule, setSelectedForReschedule, isWaitlistModalOpen, setIsWaitlistModalOpen, onJoinWaitlist }) => {
  const {
    currentPatient,
    appointments,
    dentists,
    services,
    consultations,
    waitlist,
    cancelWaitlistEntry,
    sendNotification,
    activeUser,
    settings,
    payments,
    updateAppointmentStatus
  } = useDentalStore();

  const [selectedTooth, setSelectedTooth] = useState<number>(14);
  const [dashboardVisitsFilter, setDashboardVisitsFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  const [fastTrackSuccessMsg, setFastTrackSuccessMsg] = useState('');
  const [simulatedMatchMsg, setSimulatedMatchMsg] = useState('');

  const myAppointments = appointments
    .filter((a) => a.patientId === currentPatient.id)
    .sort((a, b) => new Date(b.date + ' ' + b.startTime).getTime() - new Date(a.date + ' ' + a.startTime).getTime());

  const upcomingAppointments = myAppointments.filter((a) =>
    ['Requested', 'Confirmed', 'Checked-In', 'Waiting', 'In-Consultation'].includes(a.status)
  );

  const pastAppointments = myAppointments.filter((a) =>
    ['Completed', 'Payment-Pending'].includes(a.status)
  );

  const myConsultations = consultations.filter((c) => c.patientId === currentPatient.id);
  const myWaitlist = waitlist.filter((w) => w.patientId === currentPatient.id);

  const nextAppointment = upcomingAppointments[0] || null;
  const nextDentist = nextAppointment ? dentists.find((d) => d.id === nextAppointment.dentistId) : null;
  const nextService = nextAppointment ? services.find((s) => s.id === nextAppointment.serviceId) : null;

  const handleSimulateWaitlistMatch = (entry: WaitlistEntry) => {
    const srv = services.find((s) => s.id === entry.serviceId);
    const dnt = dentists.find((d) => d.id === entry.preferredDentistId) || dentists[0];

    sendNotification({
      userId: activeUser.id,
      patientId: currentPatient.id,
      type: 'waitlist_slot_available',
      title: '🎉 Early Cancellation Opening Found!',
      message: `Great news! An earlier slot opened for ${srv?.name || 'Dental Treatment'} with ${dnt?.fullName || 'Dentist'} on ${entry.preferredDate} at 2:00 PM. Claim your seat now!`,
      channel: 'in_app'
    });

    setSimulatedMatchMsg(`Match simulated! An alert has been dispatched to your notification center for ${srv?.name}.`);
    setTimeout(() => setSimulatedMatchMsg(''), 4000);
  };

  const myPayments = payments ? payments.filter((p) => p.patientId === currentPatient.id) : [];
  const outstandingBalance = myPayments.reduce(
    (sum, p) => sum + (p.paymentStatus !== 'Paid' ? p.balance : 0),
    0
  );

  const handleFastTrackCheckIn = (apt: Appointment) => {
    updateAppointmentStatus(apt.id, 'Checked-In');
    const srv = services.find((s) => s.id === apt.serviceId);
    const dnt = dentists.find((d) => d.id === apt.dentistId);

    sendNotification({
      userId: activeUser.id,
      patientId: currentPatient.id,
      type: 'appointment_confirmed',
      title: 'Fast-Track Check-In Confirmed',
      message: `You are officially checked in for ${srv?.name || 'your treatment'} with ${dnt?.fullName || 'the dentist'}. Operatory chair and front reception have been notified!`,
      channel: 'in_app'
    });

    setFastTrackSuccessMsg('Check-In confirmed! Operatory room and reception have received your arrival alert.');
    setTimeout(() => setFastTrackSuccessMsg(''), 5000);
  };

  return (
    <div className="space-y-6">
      {currentPatient.requiresStaffReviewForBooking && (
        <div className="neo-inset p-4 rounded-2xl border-l-4 border-amber-500 bg-amber-50/60 flex items-start gap-3 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Clinic Policy Notice:</span> You have{' '}
            <strong>{currentPatient.noShowCount} recorded missed visits</strong>. Online bookings will be flagged for reception verification before confirmation.
          </div>
        </div>
      )}

      <div className="space-y-6">
        {fastTrackSuccessMsg && (
          <div className="neo-inset p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <strong className="block font-bold">Fast-Track Check-In Active:</strong>
                <span>{fastTrackSuccessMsg}</span>
              </div>
            </div>
            <button
              onClick={() => setFastTrackSuccessMsg('')}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="neo-raised p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl neo-raised overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center font-black text-blue-700 text-xl shadow-xs">
              {currentPatient.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                  {currentPatient.fullName}
                </h2>
                <NeoBadge variant="primary">ID: {currentPatient.patientNumber}</NeoBadge>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Active Patient
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>DOB: <strong className="text-slate-700">{currentPatient.dateOfBirth}</strong> ({getPatientAge(currentPatient.dateOfBirth)})</span>
                <span>•</span>
                <span>Phone: <strong className="text-slate-700">{currentPatient.phone}</strong></span>
                <span>•</span>
                <span>Sex: <strong className="text-slate-700">{currentPatient.sex}</strong></span>
                {currentPatient.emergencyContact && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500">Emergency: {currentPatient.emergencyContact.name} ({currentPatient.emergencyContact.phone})</span>
                  </>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {currentPatient.allergies &&
                currentPatient.allergies.length > 0 &&
                !currentPatient.allergies.includes('None declared') ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-100/90 text-rose-800 border border-rose-200 text-[11px] font-bold">
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                    Allergies: {currentPatient.allergies.join(', ')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-100/80 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    No Known Drug Allergies
                  </span>
                )}

                {currentPatient.medicalAlerts && currentPatient.medicalAlerts.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-100/90 text-amber-900 border border-amber-200 text-[11px] font-bold">
                    <HeartPulse className="w-3 h-3 text-amber-700" />
                    {currentPatient.medicalAlerts.join(' • ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <div className="neo-inset px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Clinic Open Today ({settings.clinicOpenTime || '08:00'} - {settings.clinicCloseTime || '18:00'})</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => onSelectTab && onSelectTab('patient-appointments')}
            className="neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-blue-50/30 transition-all group"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400">Next Visit</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-black text-slate-800 truncate">
                {nextAppointment ? nextAppointment.date : 'None'}
              </span>
              <Calendar className="w-4 h-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] text-blue-600 font-semibold mt-1 truncate">
              {nextAppointment ? getRelativeDay(nextAppointment.date, getTodayDateString(), getTomorrowDate()) : 'Book checkup'}
            </span>
          </div>

          <div
            onClick={() => onSelectTab && onSelectTab('patient-appointments')}
            className="neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-indigo-50/30 transition-all group"
          >
            <span className="text-[10px] uppercase font-bold text-indigo-700">Upcoming</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-indigo-700">{upcomingAppointments.length}</span>
              <Clock className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] text-indigo-600 font-semibold mt-1">Confirmed visits</span>
          </div>

          <div
            onClick={() => onSelectTab && onSelectTab('patient-appointments')}
            className="neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-emerald-50/30 transition-all group"
          >
            <span className="text-[10px] uppercase font-bold text-emerald-700">Completed</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-emerald-700">{pastAppointments.length}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1">Past treatments</span>
          </div>

          <div
            onClick={() => onSelectTab && onSelectTab('patient-records')}
            className="neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-purple-50/30 transition-all group"
          >
            <span className="text-[10px] uppercase font-bold text-purple-700">Hygiene Recall</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-purple-700">6-Mo</span>
              <Smile className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] text-purple-600 font-semibold mt-1">Prophylaxis cycle</span>
          </div>

          <div
            onClick={() => onSelectTab && onSelectTab('patient-records')}
            className="neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-blue-50/30 transition-all group"
          >
            <span className="text-[10px] uppercase font-bold text-blue-700">Active Rx</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-blue-700">
                {myConsultations.reduce((acc, c) => acc + (c.prescriptions?.length || 0), 0)}
              </span>
              <Pill className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] text-blue-600 font-semibold mt-1">Medications on file</span>
          </div>

          <div
            onClick={() => onSelectTab && onSelectTab('patient-appointments')}
            className="neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-orange-50/30 transition-all group"
          >
            <span className="text-[10px] uppercase font-bold text-orange-700">Co-Pay Balance</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-orange-700">
                {outstandingBalance > 0 ? `₱${outstandingBalance.toFixed(2)}` : '₱0.00'}
              </span>
              <CreditCard className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] text-orange-600 font-semibold mt-1 truncate">
              {outstandingBalance > 0 ? 'Pending Co-pay' : 'All clear & verified'}
            </span>
          </div>
        </div>

        <div className="neo-raised p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <NeoButton
              variant="primary"
              onClick={onStartBooking}
              icon={<CalendarPlus className="w-4 h-4" />}
            >
              Book Appointment
            </NeoButton>

            <NeoButton
              variant="default"
              onClick={() => onSelectTab && onSelectTab('patient-appointments')}
              icon={<Calendar className="w-4 h-4 text-blue-600" />}
            >
              My Visits ({myAppointments.length})
            </NeoButton>

            <NeoButton
              variant="default"
              onClick={() => onSelectTab && onSelectTab('patient-records')}
              icon={<Stethoscope className="w-4 h-4 text-blue-600" />}
            >
              Odontogram & Records
            </NeoButton>

            <NeoButton
              variant="default"
              onClick={() => onSelectTab && onSelectTab('patient-waitlist')}
              icon={<Sparkles className="w-4 h-4 text-blue-600" />}
            >
              Waitlist Requests ({myWaitlist.length})
            </NeoButton>
          </div>

          <div className="flex items-center gap-2">
            <NeoButton
              size="sm"
              variant="default"
              onClick={() => exportVisitsCSV(myAppointments, services, dentists, currentPatient)}
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-700" />}
            >
              Export Records (.CSV)
            </NeoButton>
          </div>
        </div>

        {nextAppointment ? (
          <NeoCard className="p-6 border-2 border-blue-500/40 relative overflow-hidden bg-[#EFF3F9]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                    Imminent Scheduled Visit • {getRelativeDay(nextAppointment.date, getTodayDateString(), getTomorrowDate())}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-800 mt-1">
                    {nextService?.name}
                  </h3>
                  <p className="text-xs text-slate-600">
                    with Dr. {nextDentist?.fullName} ({nextDentist?.specialization}) • Ref #{nextAppointment.appointmentNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <NeoStatusPill status={nextAppointment.status} size="md" />
                {['Requested', 'Confirmed'].includes(nextAppointment.status) && (
                  <NeoButton
                    variant="primary"
                    size="md"
                    onClick={() => handleFastTrackCheckIn(nextAppointment)}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Fast-Track Self Check-In
                  </NeoButton>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
              <div className="p-3.5 rounded-2xl neo-inset flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Appointment Window</span>
                  <span className="font-extrabold text-slate-800 text-sm block">{nextAppointment.date}</span>
                  <span className="text-[11px] text-blue-600 font-semibold">{nextAppointment.startTime} - {nextAppointment.endTime}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl neo-inset flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Provider & Operatory</span>
                  <span className="font-extrabold text-slate-800 text-sm block">Dr. {nextDentist?.fullName}</span>
                  <span className="text-[11px] text-slate-500">Operatory Chair 1 • {nextDentist?.specialization}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl neo-inset flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Treatment Fee & Time</span>
                  <span className="font-extrabold text-slate-800 text-sm block">₱{nextService?.price} Est.</span>
                  <span className="text-[11px] text-slate-500">{nextService?.durationMinutes} mins scheduled duration</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl neo-inset bg-[#EFF4FA] my-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Pre-Visit Clinical Preparation & Guidance:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                <div className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Arrive 10 minutes prior for digital intake verification.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Bring current Dental Insurance card & photo ID.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Avoid caffeine 2 hrs prior if local anesthesia is indicated.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {nextAppointment.status === 'Checked-In' && (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Checked In — Waiting Room Alert Dispatched
                  </span>
                )}

                {nextAppointment.status === 'Waiting' && (
                  <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    In Waiting Room — Dentist Preparing Operatory
                  </span>
                )}

                <NeoButton
                  size="sm"
                  variant="default"
                  onClick={() => setSelectedForReschedule(nextAppointment)}
                  icon={<CalendarClock className="w-4 h-4 text-blue-600" />}
                >
                  Reschedule
                </NeoButton>
                <NeoButton
                  size="sm"
                  variant="default"
                  className="text-rose-700 hover:text-rose-900"
                  onClick={() => setSelectedForCancel(nextAppointment)}
                  icon={<CalendarX2 className="w-4 h-4" />}
                >
                  Cancel Visit
                </NeoButton>
              </div>

              <NeoButton
                size="sm"
                variant="default"
                onClick={() => downloadICS(nextAppointment, settings, services, dentists)}
                icon={<Download className="w-4 h-4 text-slate-500" />}
              >
                Add to Calendar (.ics)
              </NeoButton>
            </div>
          </NeoCard>
        ) : (
          <NeoCard className="p-6 neo-raised border border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
                  Preventive Oral Health Reminder
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">
                Ready for your 6-month checkup & professional cleaning?
              </h3>
              <p className="text-xs text-slate-500 max-w-xl">
                Routine preventive visits catch early dental issues before they develop. Schedule your visit with our clinical team today.
              </p>
            </div>

            <NeoButton
              variant="primary"
              size="md"
              onClick={onStartBooking}
              icon={<CalendarPlus className="w-4 h-4" />}
              className="shrink-0"
            >
              Book Routine Visit
            </NeoButton>
          </NeoCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <NeoCard className="p-0 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-300/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#EFF3F9]/60">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Appointment Schedule & Treatment History
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Manage upcoming appointments and review completed dental procedures
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-44 sm:w-52">
                    <NeoInput
                      placeholder="Search service, doctor, date..."
                      value={dashboardSearchQuery}
                      onChange={(e) => setDashboardSearchQuery(e.target.value)}
                      icon={<Search className="w-3.5 h-3.5 text-slate-400" />}
                    />
                  </div>

                  <div className="flex items-center gap-1 p-1 neo-inset-sm rounded-xl">
                    <button
                      onClick={() => setDashboardVisitsFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        dashboardVisitsFilter === 'all'
                          ? 'neo-raised bg-[#E8EEF5] text-blue-700'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({myAppointments.length})
                    </button>
                    <button
                      onClick={() => setDashboardVisitsFilter('upcoming')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        dashboardVisitsFilter === 'upcoming'
                          ? 'neo-raised bg-[#E8EEF5] text-blue-700'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Upcoming ({upcomingAppointments.length})
                    </button>
                    <button
                      onClick={() => setDashboardVisitsFilter('past')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        dashboardVisitsFilter === 'past'
                          ? 'neo-raised bg-[#E8EEF5] text-blue-700'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Completed ({pastAppointments.length})
                    </button>
                  </div>
                </div>
              </div>

              {myAppointments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <p>You have no scheduled or past appointments on file.</p>
                  <NeoButton variant="primary" size="sm" onClick={onStartBooking}>
                    Book an Appointment Now
                  </NeoButton>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-300/40 bg-slate-100/40 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        <th className="p-3.5 pl-5">Date & Time</th>
                        <th className="p-3.5">Service & Treatment</th>
                        <th className="p-3.5">Dentist & Clinic</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300/30 text-slate-700">
                      {myAppointments
                        .filter((apt) => {
                          if (dashboardVisitsFilter === 'upcoming') {
                            if (!['Requested', 'Confirmed', 'Checked-In', 'Waiting', 'In-Consultation'].includes(apt.status)) return false;
                          } else if (dashboardVisitsFilter === 'past') {
                            if (!['Completed', 'Payment-Pending'].includes(apt.status)) return false;
                          }

                          if (dashboardSearchQuery.trim()) {
                            const q = dashboardSearchQuery.toLowerCase();
                            const srv = services.find((s) => s.id === apt.serviceId);
                            const dnt = dentists.find((d) => d.id === apt.dentistId);
                            if (
                              !srv?.name.toLowerCase().includes(q) &&
                              !dnt?.fullName.toLowerCase().includes(q) &&
                              !apt.date.includes(q) &&
                              !apt.appointmentNumber.toLowerCase().includes(q)
                            ) {
                              return false;
                            }
                          }
                          return true;
                        })
                        .slice(0, 5)
                        .map((apt) => {
                          const srv = services.find((s) => s.id === apt.serviceId);
                          const dnt = dentists.find((d) => d.id === apt.dentistId);
                          const isPast = ['Completed', 'Cancelled', 'No-Show', 'Rescheduled'].includes(apt.status);

                          return (
                            <tr key={apt.id} className="hover:bg-slate-100/50 transition-all">
                              <td className="p-3.5 pl-5">
                                <div className="font-extrabold text-slate-900">{apt.date}</div>
                                <div className="text-[11px] text-slate-500">
                                  {apt.startTime} - {apt.endTime}
                                </div>
                                <span className="text-[10px] text-blue-600 font-medium">
                                  #{apt.appointmentNumber}
                                </span>
                              </td>

                              <td className="p-3.5">
                                <div className="font-bold text-slate-900">{srv?.name || 'Dental Consultation'}</div>
                                <div className="text-[11px] text-slate-500">
                                  Duration: {srv?.durationMinutes} mins • Est. ₱{srv?.price}
                                </div>
                              </td>

                              <td className="p-3.5">
                                <div className="font-semibold text-slate-800">Dr. {dnt?.fullName}</div>
                                <div className="text-[11px] text-slate-500">{dnt?.specialization}</div>
                              </td>

                              <td className="p-3.5">
                                <NeoStatusPill status={apt.status} size="sm" />
                              </td>

                              <td className="p-3.5 pr-5 text-right space-x-1.5 whitespace-nowrap">
                                {!isPast && (
                                  <>
                                    {['Requested', 'Confirmed'].includes(apt.status) && (
                                      <button
                                        onClick={() => handleFastTrackCheckIn(apt)}
                                        className="neo-btn px-2.5 py-1 rounded-xl text-emerald-700 font-bold hover:bg-emerald-50 text-[11px] cursor-pointer inline-flex items-center gap-1"
                                        title="Digital Self Check-In"
                                      >
                                        <CheckCircle className="w-3 h-3" />
                                        <span>Check In</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setSelectedForReschedule(apt)}
                                      className="neo-btn px-2.5 py-1 rounded-xl text-slate-600 hover:text-blue-600 text-[11px] font-semibold cursor-pointer"
                                    >
                                      Reschedule
                                    </button>
                                    <button
                                      onClick={() => setSelectedForCancel(apt)}
                                      className="neo-btn px-2 py-1 rounded-xl text-rose-600 hover:text-rose-800 text-[11px] font-semibold cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => downloadICS(apt, settings, services, dentists)}
                                  className="neo-btn p-1.5 rounded-xl text-slate-500 hover:text-slate-800 cursor-pointer inline-flex items-center"
                                  title="Add to Calendar (.ics)"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="p-3 bg-slate-50/50 border-t border-slate-200/50 text-center">
                <button
                  onClick={() => onSelectTab && onSelectTab('patient-appointments')}
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  View All Appointments in Full Schedule ({myAppointments.length}) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </NeoCard>

            <NeoCard className="space-y-3 p-5">
              <div className="flex items-center justify-between border-b border-slate-300/40 pb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-emerald-600" /> Active Prescriptions & Post-Care Directions
                </h4>
                <button
                  onClick={() => onSelectTab && onSelectTab('patient-records')}
                  className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Full History ({myConsultations.reduce((a, c) => a + (c.prescriptions?.length || 0), 0)})
                </button>
              </div>

              {myConsultations.length === 0 ? (
                <div className="p-4 rounded-xl neo-inset text-center text-xs text-slate-400">
                  No active prescriptions recorded on your profile.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {myConsultations.flatMap((c) => c.prescriptions || []).slice(0, 4).map((rx, idx) => (
                    <div key={idx} className="p-3 rounded-2xl neo-inset bg-[#EFF4FA] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-blue-700 block">
                          {rx.medication}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800">
                          {rx.dosage}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <strong>Frequency:</strong> {rx.frequency}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        <strong>Course:</strong> {rx.duration}
                        {rx.instructions && ` • ${rx.instructions}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </NeoCard>

            <NeoCard className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300/40 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-blue-600" /> Oral Health Snapshot & Clinical Odontogram
                  </h3>
                  <p className="text-xs text-slate-500">
                    Universal Tooth Numbering System (#1-32) clinical status & restorations summary.
                  </p>
                </div>

                <button
                  onClick={() => onSelectTab && onSelectTab('patient-records')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  Open Full Interactive Odontogram <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-2xl neo-inset bg-[#EFF4FA] space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tooth Restorations On Record
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                      #14
                    </span>
                    <div>
                      <span className="font-extrabold text-slate-800 block text-xs">
                        Maxillary 1st Molar (Tooth #14)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Class I Occlusal Composite Resin Restoration • Stable
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl neo-inset bg-[#EFF4FA] space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Periodontal & Gingival Status
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                      ✓
                    </span>
                    <div>
                      <span className="font-extrabold text-slate-800 block text-xs">
                        Physiological Probing (2-3mm)
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        No active gingivitis or deep pockets detected
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl neo-inset bg-[#EFF4FA] space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Recent Clinical Notes
                  </span>
                  <p className="text-[11px] text-slate-600 italic line-clamp-2">
                    &ldquo;{myConsultations[0]?.treatmentPlan || 'Routine dental checkup completed. Oral hygiene excellent, keep up daily flossing routine.'}&rdquo;
                  </p>
                </div>
              </div>
            </NeoCard>
          </div>

          <div className="space-y-6">
            <NeoCard className="space-y-3 p-5">
              <div className="flex items-center justify-between border-b border-slate-300/40 pb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Cancellation Waitlist
                </h4>
                <button
                  onClick={() => {
                    if (onSelectTab) onSelectTab('patient-waitlist');
                    else setIsWaitlistModalOpen(true);
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Manage ({myWaitlist.length})
                </button>
              </div>

              {simulatedMatchMsg && (
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-800 font-medium">
                  {simulatedMatchMsg}
                </div>
              )}

              {myWaitlist.length === 0 ? (
                <div className="p-4 rounded-xl neo-inset text-center text-xs text-slate-400 space-y-2">
                  <p>No active cancellation waitlists. Need an earlier slot?</p>
                  <button
                    onClick={() => {
                      if (onSelectTab) onSelectTab('patient-waitlist');
                      else setIsWaitlistModalOpen(true);
                    }}
                    className="block mx-auto text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    + Join cancellation waitlist
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myWaitlist.slice(0, 2).map((w) => {
                    const srv = services.find((s) => s.id === w.serviceId);
                    return (
                      <div key={w.id} className="p-3 rounded-2xl neo-inset space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{srv?.name}</span>
                          <NeoBadge variant={w.status === 'notified' ? 'warning' : 'info'} size="sm">
                            {w.status.toUpperCase()}
                          </NeoBadge>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Target: <strong>{w.preferredDate}</strong> ({w.preferredTimeRange})
                        </p>

                        <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-200/50">
                          <button
                            onClick={() => handleSimulateWaitlistMatch(w)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            ⚡ Simulate Early Opening
                          </button>
                          <button
                            onClick={() => cancelWaitlistEntry(w.id)}
                            className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                          >
                            Leave
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </NeoCard>

            <NeoCard className="space-y-3 p-5">
              <div className="flex items-center justify-between border-b border-slate-300/40 pb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-blue-600" /> Daily Oral Health Routine
                </h4>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="p-2.5 rounded-xl neo-inset bg-[#EFF4FA] space-y-0.5">
                  <span className="font-bold text-slate-800 block text-[11px]">
                    The 2x2 Brushing Rule
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Brush twice daily for 2 minutes using a soft-bristle brush and fluoride toothpaste at a 45-degree angle.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl neo-inset bg-[#EFF4FA] space-y-0.5">
                  <span className="font-bold text-slate-800 block text-[11px]">
                    Interdental Flossing
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Floss daily before bedtime to remove interproximal plaque that toothbrushes miss (approximately 35% of tooth area).
                  </p>
                </div>

                <div className="p-2.5 rounded-xl neo-inset bg-[#EFF4FA] space-y-0.5">
                  <span className="font-bold text-slate-800 block text-[11px]">
                    Fluoride & Enamel Protection
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Avoid rinsing with plain water immediately after brushing to let active fluoride remineralize enamel surfaces.
                  </p>
                </div>
              </div>
            </NeoCard>

            <NeoCard className="space-y-3 p-5">
              <div className="flex items-center justify-between border-b border-slate-300/40 pb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> Practice & Emergency Support
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{settings.clinicAddress}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Main Desk: <strong className="text-slate-800">{settings.clinicPhone}</strong></span>
                </div>

                <div className="p-3 rounded-2xl neo-inset bg-rose-50/80 border border-rose-200 text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>24/7 Dental Emergency Line</span>
                  </div>
                  <p className="text-[10px] text-rose-800 leading-relaxed">
                    If experiencing severe dental trauma, hemorrhage, or acute swelling: call{' '}
                    <strong>+1 (555) 911-DENT</strong> immediately.
                  </p>
                </div>
              </div>
            </NeoCard>
          </div>
        </div>
      </div>

      <JoinWaitlistModal
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
        services={services}
        dentists={dentists}
        currentPatientId={currentPatient.id}
        onJoinWaitlist={onJoinWaitlist}
      />

      <CancellationModal
        isOpen={!!selectedForCancel}
        onClose={() => setSelectedForCancel(null)}
        appointment={selectedForCancel}
      />

      <RescheduleModal
        isOpen={!!selectedForReschedule}
        onClose={() => setSelectedForReschedule(null)}
        appointment={selectedForReschedule}
      />
    </div>
  );
};
