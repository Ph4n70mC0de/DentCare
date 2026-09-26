import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  UserCheck,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Siren,
  ChevronLeft,
  ChevronRight,
  Filter,
  Columns,
  CalendarDays,
  ArrowRight,
  Sparkles,
  Stethoscope,
  RefreshCw,
  Search,
  UserX,
  CalendarClock,
  CalendarX2,
  PhoneCall,
  User
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { NeoSelect } from '../common/NeoSelect';
import { NeoStatusPill } from '../common/NeoStatusPill';
import { NeoBadge } from '../common/NeoBadge';
import { Appointment, AppointmentStatus } from '../../types';
import { getTodayDateString } from '../../data/seedData';
import { CheckInModal } from './CheckInModal';
import { PaymentModal } from './PaymentModal';
import { FollowUpModal } from './FollowUpModal';
import { CancellationModal } from '../exceptions/CancellationModal';
import { RescheduleModal } from '../exceptions/RescheduleModal';
import { NoShowModal } from '../exceptions/NoShowModal';
import { EmergencyModal } from '../exceptions/EmergencyModal';

interface AppointmentDayFlowProps {
  onStartBooking?: () => void;
  onNavigateToWaitingRoom?: () => void;
  onStartConsultation?: (appointmentId: string) => void;
  onNavigateToBilling?: () => void;
}

export const AppointmentDayFlow: React.FC<AppointmentDayFlowProps> = ({
  onStartBooking,
  onNavigateToWaitingRoom,
  onStartConsultation,
  onNavigateToBilling
}) => {
  const {
    appointments,
    patients,
    dentists,
    services,
    updateAppointmentStatus
  } = useDentalStore();

  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [dentistFilter, setDentistFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'pipeline' | 'timeline'>('pipeline');

  // Modals state
  const [checkInAptId, setCheckInAptId] = useState<string | null>(null);
  const [isCheckInOpen, setIsCheckInOpen] = useState<boolean>(false);
  const [paymentApt, setPaymentApt] = useState<Appointment | null>(null);
  const [followUpApt, setFollowUpApt] = useState<Appointment | null>(null);
  const [cancelApt, setCancelApt] = useState<Appointment | null>(null);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [noShowApt, setNoShowApt] = useState<Appointment | null>(null);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState<boolean>(false);

  // Date navigation helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(today);
  };

  // Filter appointments for the selected date
  const dayAppointments = appointments.filter((apt) => {
    if (apt.date !== selectedDate) return false;
    if (dentistFilter !== 'all' && apt.dentistId !== dentistFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const patient = patients.find((p) => p.id === apt.patientId);
      return (
        apt.appointmentNumber.toLowerCase().includes(q) ||
        patient?.fullName.toLowerCase().includes(q) ||
        patient?.phone.includes(q) ||
        patient?.patientNumber.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Partition into Day Flow Pipeline Stages
  const stage1Scheduled = dayAppointments.filter((a) =>
    ['Confirmed', 'Requested'].includes(a.status)
  );
  const stage2Waiting = dayAppointments.filter((a) =>
    ['Checked-In', 'Waiting'].includes(a.status)
  );
  const stage3InChair = dayAppointments.filter((a) =>
    a.status === 'In-Consultation'
  );
  const stage4PaymentPending = dayAppointments.filter((a) =>
    a.status === 'Payment-Pending'
  );
  const stage5Completed = dayAppointments.filter((a) =>
    a.status === 'Completed'
  );
  const stageExceptions = dayAppointments.filter((a) =>
    ['Emergency', 'Cancelled', 'No-Show'].includes(a.status)
  );

  // Time slots for timeline view (08:00 to 18:00)
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30'
  ];

  const handleAdvanceStage = (apt: Appointment) => {
    if (['Confirmed', 'Requested'].includes(apt.status)) {
      // Advance to check-in
      setCheckInAptId(apt.id);
      setIsCheckInOpen(true);
    } else if (['Checked-In', 'Waiting'].includes(apt.status)) {
      // Call to operatory chair
      updateAppointmentStatus(apt.id, 'In-Consultation', {
        consultationStartedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } else if (apt.status === 'In-Consultation') {
      // Finish exam -> send to checkout
      updateAppointmentStatus(apt.id, 'Payment-Pending');
    } else if (apt.status === 'Payment-Pending') {
      // Open Payment Modal
      setPaymentApt(apt);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Appointment Day Flow</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Live Flow Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time patient journey from morning check-in to operatory chair, checkout, and follow-up.
          </p>
        </div>

        {/* Date Navigator Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="neo-flat flex items-center p-1 rounded-2xl">
            <button
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className={`px-3 py-1 text-xs font-bold rounded-xl cursor-pointer transition-colors ${
                selectedDate === today ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 px-2 py-1 outline-hidden cursor-pointer"
            />
            <button
              onClick={handleNextDay}
              className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center neo-flat p-1 rounded-2xl gap-1">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'pipeline' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Flow Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'timeline' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Operatory Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stage Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="neo-raised p-3.5 rounded-2xl border-t-4 border-slate-400">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Scheduled</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{stage1Scheduled.length}</p>
          <p className="text-[11px] text-slate-400 font-medium">Awaiting arrival</p>
        </div>

        <div className="neo-raised p-3.5 rounded-2xl border-t-4 border-indigo-500">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
            <span>Waiting Room</span>
            <Clock className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-2">{stage2Waiting.length}</p>
          <p className="text-[11px] text-indigo-500 font-medium">Checked in & triaged</p>
        </div>

        <div className="neo-raised p-3.5 rounded-2xl border-t-4 border-purple-500">
          <div className="flex items-center justify-between text-xs font-bold text-purple-700">
            <span>In Operatory</span>
            <Stethoscope className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">{stage3InChair.length}</p>
          <p className="text-[11px] text-purple-500 font-medium">Under dental care</p>
        </div>

        <div className="neo-raised p-3.5 rounded-2xl border-t-4 border-amber-500">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700">
            <span>Checkout Pending</span>
            <CreditCard className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{stage4PaymentPending.length}</p>
          <p className="text-[11px] text-amber-500 font-medium">Billing & Co-pay</p>
        </div>

        <div className="neo-raised p-3.5 rounded-2xl border-t-4 border-emerald-500">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
            <span>Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{stage5Completed.length}</p>
          <p className="text-[11px] text-emerald-500 font-medium">Finished visits</p>
        </div>

        <div className="neo-raised p-3.5 rounded-2xl border-t-4 border-rose-500">
          <div className="flex items-center justify-between text-xs font-bold text-rose-700">
            <span>Exceptions</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{stageExceptions.length}</p>
          <p className="text-[11px] text-rose-500 font-medium">Cancel / No-show / Emer</p>
        </div>
      </div>

      {/* Control & Quick Filter Bar */}
      <div className="neo-raised p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patient, ID, or appointment #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full neo-flat pl-9 pr-3 py-1.5 text-xs rounded-xl focus:outline-blue-500 text-slate-800"
            />
          </div>

          <select
            value={dentistFilter}
            onChange={(e) => setDentistFilter(e.target.value)}
            className="neo-flat text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-700 cursor-pointer"
          >
            <option value="all">All Doctors</option>
            {dentists.map((d) => (
              <option key={d.id} value={d.id}>{d.fullName} ({d.specialization})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {onStartBooking && (
            <NeoButton
              size="sm"
              variant="default"
              onClick={onStartBooking}
              icon={<Calendar className="w-3.5 h-3.5 text-blue-600" />}
            >
              Add Booking
            </NeoButton>
          )}

          <NeoButton
            size="sm"
            variant="danger"
            onClick={() => setIsEmergencyOpen(true)}
            icon={<Siren className="w-3.5 h-3.5" />}
          >
            Priority Emergency
          </NeoButton>

          <NeoButton
            size="sm"
            variant="primary"
            onClick={() => {
              setCheckInAptId(null);
              setIsCheckInOpen(true);
            }}
            icon={<UserCheck className="w-3.5 h-3.5" />}
          >
            Express Check-In
          </NeoButton>
        </div>
      </div>

      {/* PIPELINE VIEW */}
      {viewMode === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Stage 1: Scheduled */}
          <div className="neo-flat p-3.5 rounded-3xl space-y-3 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Scheduled</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {stage1Scheduled.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[700px] pr-1">
              {stage1Scheduled.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No upcoming scheduled patients
                </div>
              ) : (
                stage1Scheduled.map((apt) => renderFlowCard(apt))
              )}
            </div>
          </div>

          {/* Stage 2: Waiting Room */}
          <div className="neo-flat p-3.5 rounded-3xl space-y-3 flex flex-col bg-indigo-50/20 border border-indigo-100/50">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <h3 className="font-bold text-xs text-indigo-900 uppercase tracking-wider">In Waiting Room</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800">
                {stage2Waiting.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[700px] pr-1">
              {stage2Waiting.length === 0 ? (
                <div className="text-center py-8 text-indigo-400 text-xs">
                  Waiting room is clear
                </div>
              ) : (
                stage2Waiting.map((apt) => renderFlowCard(apt))
              )}
            </div>
          </div>

          {/* Stage 3: In Operatory */}
          <div className="neo-flat p-3.5 rounded-3xl space-y-3 flex flex-col bg-purple-50/20 border border-purple-100/50">
            <div className="flex items-center justify-between pb-2 border-b border-purple-200/60">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <h3 className="font-bold text-xs text-purple-900 uppercase tracking-wider">In Operatory Chair</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                {stage3InChair.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[700px] pr-1">
              {stage3InChair.length === 0 ? (
                <div className="text-center py-8 text-purple-400 text-xs">
                  All dental chairs available
                </div>
              ) : (
                stage3InChair.map((apt) => renderFlowCard(apt))
              )}
            </div>
          </div>

          {/* Stage 4: Checkout Pending */}
          <div className="neo-flat p-3.5 rounded-3xl space-y-3 flex flex-col bg-amber-50/20 border border-amber-100/50">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="font-bold text-xs text-amber-900 uppercase tracking-wider">Payment & Checkout</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                {stage4PaymentPending.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[700px] pr-1">
              {stage4PaymentPending.length === 0 ? (
                <div className="text-center py-8 text-amber-400 text-xs">
                  No pending checkouts
                </div>
              ) : (
                stage4PaymentPending.map((apt) => renderFlowCard(apt))
              )}
            </div>
          </div>

          {/* Stage 5: Completed */}
          <div className="neo-flat p-3.5 rounded-3xl space-y-3 flex flex-col bg-emerald-50/20 border border-emerald-100/50">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-xs text-emerald-900 uppercase tracking-wider">Completed</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                {stage5Completed.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[700px] pr-1">
              {stage5Completed.length === 0 ? (
                <div className="text-center py-8 text-emerald-400 text-xs">
                  Completed visits appear here
                </div>
              ) : (
                stage5Completed.map((apt) => renderFlowCard(apt))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TIMELINE / OPERATORY GRID VIEW */}
      {viewMode === 'timeline' && (
        <NeoCard className="p-4 overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Header row with dentists */}
            <div className="grid grid-cols-[100px_repeat(3,_1fr)] gap-3 pb-3 border-b border-slate-200 font-bold text-xs text-slate-600">
              <div>Time Slot</div>
              {dentists.map((d) => (
                <div key={d.id} className="text-left bg-slate-100 p-2.5 rounded-xl">
                  <p className="text-slate-800 font-bold">{d.fullName}</p>
                  <p className="text-[11px] text-slate-500 font-normal">{d.specialization}</p>
                </div>
              ))}
            </div>

            {/* Time rows */}
            <div className="space-y-1.5 mt-2">
              {timeSlots.map((time) => {
                return (
                  <div key={time} className="grid grid-cols-[100px_repeat(3,_1fr)] gap-3 items-center min-h-[48px] py-1 border-b border-slate-100">
                    <span className="text-xs font-mono font-bold text-slate-400 pl-1">{time}</span>
                    {dentists.map((dentist) => {
                      const apt = dayAppointments.find(
                        (a) => a.dentistId === dentist.id && a.startTime <= time && a.endTime > time
                      );
                      const isStart = apt && apt.startTime === time;

                      if (!apt) {
                        return (
                          <div
                            key={dentist.id}
                            className="h-10 rounded-xl bg-slate-50/50 hover:bg-blue-50/40 border border-dashed border-slate-200 transition-colors flex items-center justify-center text-[11px] text-slate-400 cursor-pointer"
                            onClick={onStartBooking}
                            title="Click to schedule open slot"
                          >
                            + Available
                          </div>
                        );
                      }

                      if (!isStart) {
                        return (
                          <div key={dentist.id} className="h-10 rounded-xl bg-blue-50/20 border border-blue-100 flex items-center px-2 text-[10px] text-slate-400">
                            ↳ In progress
                          </div>
                        );
                      }

                      const patient = patients.find((p) => p.id === apt.patientId);
                      const service = services.find((s) => s.id === apt.serviceId);

                      return (
                        <div
                          key={dentist.id}
                          onClick={() => handleAdvanceStage(apt)}
                          className="p-2.5 rounded-xl neo-raised hover:border-blue-300 border border-transparent transition-all cursor-pointer bg-white"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-800 truncate">{patient?.fullName}</span>
                            <NeoStatusPill status={apt.status} />
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                            <span className="truncate">{service?.name}</span>
                            <span className="font-mono text-[10px] font-semibold">{apt.startTime}-{apt.endTime}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </NeoCard>
      )}

      {/* Exception Disruption Tray at bottom if any exist */}
      {stageExceptions.length > 0 && (
        <div className="neo-raised p-4 rounded-3xl bg-rose-50/30 border border-rose-200/70">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-sm text-rose-900">Today's Schedule Disruptions & Exceptions ({stageExceptions.length})</h3>
            </div>
            <span className="text-xs text-rose-600 font-semibold">Cancelled, No-Shows & Emergency Additions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stageExceptions.map((apt) => {
              const pat = patients.find((p) => p.id === apt.patientId);
              const dent = dentists.find((d) => d.id === apt.dentistId);
              const srv = services.find((s) => s.id === apt.serviceId);

              return (
                <div key={apt.id} className="neo-card p-3 rounded-2xl bg-white border border-rose-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{pat?.fullName}</span>
                      <NeoStatusPill status={apt.status} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">{apt.startTime} with {dent?.fullName}</p>
                    <p className="text-[11px] text-slate-600 font-medium">{srv?.name}</p>
                    {apt.cancellationReason && (
                      <p className="text-[10px] text-rose-600 mt-1 italic">Reason: "{apt.cancellationReason}"</p>
                    )}
                    {apt.noShowReason && (
                      <p className="text-[10px] text-rose-600 mt-1 italic">No-Show: "{apt.noShowReason}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setRescheduleApt(apt)}
                      className="px-2 py-1 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer flex-1"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Helper to render appointment cards in flow pipeline */}
      {renderModals()}
    </div>
  );

  function renderFlowCard(apt: Appointment) {
    const patient = patients.find((p) => p.id === apt.patientId);
    const dentist = dentists.find((d) => d.id === apt.dentistId);
    const service = services.find((s) => s.id === apt.serviceId);

    const hasAlerts = patient?.medicalAlerts && patient.medicalAlerts.length > 0 && !patient.medicalAlerts.includes('None declared');
    const hasAllergies = patient?.allergies && patient.allergies.length > 0 && !patient.allergies.includes('None declared') && !patient.allergies.includes('None');

    return (
      <div
        key={apt.id}
        className="neo-raised p-3 rounded-2xl bg-white hover:border-blue-300 border border-transparent transition-all space-y-2.5 text-left"
      >
        <div className="flex items-start justify-between gap-1.5">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 block">{apt.appointmentNumber}</span>
            <p className="font-bold text-xs text-slate-900 leading-snug">{patient?.fullName}</p>
            <span className="text-[10px] text-slate-500 font-mono">{patient?.patientNumber}</span>
          </div>
          {apt.queueNumber && (
            <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 text-[10px] font-black">
              Q-{apt.queueNumber}
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-600 space-y-0.5 bg-slate-50 p-2 rounded-xl">
          <div className="flex items-center justify-between font-medium">
            <span className="text-slate-800 font-semibold">{service?.name}</span>
            <span className="text-blue-700 font-mono font-bold">₱{service?.price}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500 text-[10px]">
            <span>{dentist?.fullName}</span>
            <span className="font-mono font-bold">{apt.startTime} - {apt.endTime}</span>
          </div>
        </div>

        {/* Warning Badges if present */}
        {(hasAlerts || hasAllergies) && (
          <div className="flex flex-wrap gap-1">
            {hasAlerts && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800">
                Med Alert
              </span>
            )}
            {hasAllergies && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-100 text-rose-800">
                Allergy
              </span>
            )}
          </div>
        )}

        {/* Action button tailored to current flow stage */}
        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
          {['Confirmed', 'Requested'].includes(apt.status) && (
            <>
              <button
                onClick={() => {
                  setCheckInAptId(apt.id);
                  setIsCheckInOpen(true);
                }}
                className="neo-btn-sm flex-1 py-1 px-2 rounded-xl text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-1 cursor-pointer"
              >
                <UserCheck className="w-3 h-3" />
                <span>Check In</span>
              </button>
              <button
                onClick={() => setNoShowApt(apt)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                title="Mark No-Show"
              >
                <UserX className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {['Checked-In', 'Waiting'].includes(apt.status) && (
            <>
              <button
                onClick={() => handleAdvanceStage(apt)}
                className="neo-btn-sm flex-1 py-1 px-2 rounded-xl text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Stethoscope className="w-3 h-3" />
                <span>Call to Chair</span>
              </button>
              {onStartConsultation && (
                <button
                  onClick={() => onStartConsultation(apt.id)}
                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer text-[10px] font-bold"
                  title="Open Clinical Exam"
                >
                  Exam
                </button>
              )}
            </>
          )}

          {apt.status === 'In-Consultation' && (
            <button
              onClick={() => handleAdvanceStage(apt)}
              className="neo-btn-sm flex-1 py-1 px-2 rounded-xl text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-1 cursor-pointer"
            >
              <CreditCard className="w-3 h-3" />
              <span>Send to Checkout</span>
            </button>
          )}

          {apt.status === 'Payment-Pending' && (
            <button
              onClick={() => setPaymentApt(apt)}
              className="neo-btn-sm flex-1 py-1 px-2 rounded-xl text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 flex items-center justify-center gap-1 cursor-pointer"
            >
              <CreditCard className="w-3 h-3" />
              <span>Collect Payment</span>
            </button>
          )}

          {apt.status === 'Completed' && (
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Settled
              </span>
              <button
                onClick={() => setFollowUpApt(apt)}
                className="text-[10px] font-bold text-blue-700 hover:underline cursor-pointer"
              >
                Follow-up
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderModals() {
    return (
      <>
        <CheckInModal
          isOpen={isCheckInOpen}
          onClose={() => setIsCheckInOpen(false)}
          preselectedAppointmentId={checkInAptId || undefined}
        />

        <PaymentModal
          isOpen={Boolean(paymentApt)}
          onClose={() => setPaymentApt(null)}
          appointment={paymentApt}
          onScheduleFollowUp={(apt) => {
            setPaymentApt(null);
            setFollowUpApt(apt);
          }}
        />

        <FollowUpModal
          isOpen={Boolean(followUpApt)}
          onClose={() => setFollowUpApt(null)}
          previousAppointment={followUpApt}
        />

        <CancellationModal
          isOpen={Boolean(cancelApt)}
          onClose={() => setCancelApt(null)}
          appointment={cancelApt}
        />

        <RescheduleModal
          isOpen={Boolean(rescheduleApt)}
          onClose={() => setRescheduleApt(null)}
          appointment={rescheduleApt}
        />

        <NoShowModal
          isOpen={Boolean(noShowApt)}
          onClose={() => setNoShowApt(null)}
          appointment={noShowApt}
        />

        <EmergencyModal
          isOpen={isEmergencyOpen}
          onClose={() => setIsEmergencyOpen(false)}
        />
      </>
    );
  }
};
