import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  CreditCard,
  AlertTriangle,
  Siren,
  Search,
  Filter,
  CheckCircle2,
  CalendarPlus,
  ArrowRight,
  UserX,
  FileSpreadsheet,
  CalendarClock,
  CalendarX2,
  Stethoscope,
  Users
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

interface ReceptionOverviewProps {
  onStartBooking: () => void;
  onNavigateToWaitingRoom: () => void;
  onStartConsultation: (appointmentId: string) => void;
  onNavigateToDirectory?: () => void;
  onNavigateToDayFlow?: () => void;
  onNavigateToBilling?: () => void;
  onNavigateToExceptions?: () => void;
  onNavigateToReports?: () => void;
}

export const ReceptionOverview: React.FC<ReceptionOverviewProps> = ({
  onStartBooking,
  onNavigateToWaitingRoom,
  onStartConsultation,
  onNavigateToDirectory,
  onNavigateToDayFlow,
  onNavigateToBilling,
  onNavigateToExceptions,
  onNavigateToReports
}) => {
  const {
    appointments,
    patients,
    dentists,
    services,
    updateAppointmentStatus
  } = useDentalStore();

  const today = getTodayDateString();

  const [dateFilter, setDateFilter] = useState<string>(today);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dentistFilter, setDentistFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [checkInAptId, setCheckInAptId] = useState<string | null>(null);
  const [isCheckInOpen, setIsCheckInOpen] = useState<boolean>(false);

  const [paymentApt, setPaymentApt] = useState<Appointment | null>(null);
  const [followUpApt, setFollowUpApt] = useState<Appointment | null>(null);

  const [cancelApt, setCancelApt] = useState<Appointment | null>(null);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [noShowApt, setNoShowApt] = useState<Appointment | null>(null);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState<boolean>(false);

  const filteredAppointments = appointments.filter((apt) => {
    if (dateFilter && apt.date !== dateFilter) return false;
    if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
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

  const todayApts = appointments.filter((a) => a.date === today);
  const totalToday = todayApts.length;
  const inWaiting = todayApts.filter((a) => a.status === 'Waiting' || a.status === 'Checked-In').length;
  const inChair = todayApts.filter((a) => a.status === 'In-Consultation').length;
  const pendingPayment = todayApts.filter((a) => a.status === 'Payment-Pending').length;
  const completedToday = todayApts.filter((a) => a.status === 'Completed').length;
  const exceptionsToday = todayApts.filter((a) => ['Cancelled', 'No-Show', 'Emergency'].includes(a.status)).length;

  const exportScheduleCSV = () => {
    const headers = ['Appointment #', 'Date', 'Time', 'Patient', 'Patient ID', 'Dentist', 'Service', 'Status'];
    const rows = filteredAppointments.map((apt) => {
      const p = patients.find((pat) => pat.id === apt.patientId);
      const d = dentists.find((dnt) => dnt.id === apt.dentistId);
      const s = services.find((srv) => srv.id === apt.serviceId);
      return [
        apt.appointmentNumber,
        apt.date,
        `${apt.startTime}-${apt.endTime}`,
        p?.fullName || '',
        p?.patientNumber || '',
        d?.fullName || '',
        s?.name || '',
        apt.status
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DentCare-Schedule-${dateFilter || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={onNavigateToDayFlow}
          className={`neo-raised p-4 rounded-2xl flex flex-col justify-between ${onNavigateToDayFlow ? 'cursor-pointer hover:bg-blue-50/30 transition-all' : ''}`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Today</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-800">{totalToday}</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        <div
          onClick={onNavigateToWaitingRoom}
          className="neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-indigo-50/30 transition-all"
        >
          <span className="text-[10px] uppercase font-bold text-indigo-700">Waiting Room</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-indigo-700">{inWaiting}</span>
            <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
          </div>
        </div>

        <div
          onClick={onNavigateToDayFlow}
          className={`neo-raised p-4 rounded-2xl flex flex-col justify-between ${onNavigateToDayFlow ? 'cursor-pointer hover:bg-purple-50/30 transition-all' : ''}`}
        >
          <span className="text-[10px] uppercase font-bold text-purple-700">In Operatory</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-purple-700">{inChair}</span>
            <Stethoscope className="w-4 h-4 text-purple-600" />
          </div>
        </div>

        <div
          onClick={onNavigateToBilling}
          className={`neo-raised p-4 rounded-2xl flex flex-col justify-between ${onNavigateToBilling ? 'cursor-pointer hover:bg-orange-50/30 transition-all' : ''}`}
        >
          <span className="text-[10px] uppercase font-bold text-orange-700">Pending Pay</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-orange-700">{pendingPayment}</span>
            <CreditCard className="w-4 h-4 text-orange-600" />
          </div>
        </div>

        <div
          onClick={onNavigateToReports}
          className={`neo-raised p-4 rounded-2xl flex flex-col justify-between ${onNavigateToReports ? 'cursor-pointer hover:bg-emerald-50/30 transition-all' : ''}`}
        >
          <span className="text-[10px] uppercase font-bold text-emerald-700">Completed</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-700">{completedToday}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        <div
          onClick={onNavigateToExceptions}
          className={`neo-raised p-4 rounded-2xl flex flex-col justify-between ${onNavigateToExceptions ? 'cursor-pointer hover:bg-rose-50/30 transition-all' : ''}`}
        >
          <span className="text-[10px] uppercase font-bold text-rose-700">Exceptions</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-rose-700">{exceptionsToday}</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
        </div>
      </div>

      <div className="neo-raised p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <NeoButton
            variant="primary"
            onClick={() => {
              setCheckInAptId(null);
              setIsCheckInOpen(true);
            }}
            icon={<UserCheck className="w-4 h-4" />}
          >
            Check In Patient
          </NeoButton>

          <NeoButton
            variant="default"
            onClick={onStartBooking}
            icon={<CalendarPlus className="w-4 h-4 text-blue-600" />}
          >
            Walk-in / Phone Booking
          </NeoButton>

          <NeoButton
            variant="danger"
            onClick={() => setIsEmergencyOpen(true)}
            icon={<Siren className="w-4 h-4" />}
          >
            Priority Emergency
          </NeoButton>

          {onNavigateToDirectory && (
            <NeoButton
              variant="default"
              onClick={onNavigateToDirectory}
              icon={<Users className="w-4 h-4 text-blue-600" />}
            >
              Patient Directory ({patients.length})
            </NeoButton>
          )}
        </div>

        <div className="flex items-center gap-2">
          <NeoButton
            size="sm"
            variant="default"
            onClick={exportScheduleCSV}
            icon={<FileSpreadsheet className="w-4 h-4 text-emerald-700" />}
          >
            Export Schedule (.CSV)
          </NeoButton>
        </div>
      </div>

      <NeoCard className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <NeoInput
            placeholder="Search patient name, ID, phone, #"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />

          <NeoInput
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          <NeoSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Requested">Requested</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked-In">Checked-In</option>
            <option value="Waiting">Waiting in Queue</option>
            <option value="In-Consultation">In-Consultation</option>
            <option value="Payment-Pending">Payment-Pending</option>
            <option value="Completed">Completed</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No-Show">No-Show</option>
            <option value="Emergency">Emergency</option>
          </NeoSelect>

          <NeoSelect
            value={dentistFilter}
            onChange={(e) => setDentistFilter(e.target.value)}
          >
            <option value="all">All Dentists</option>
            {dentists.map((d) => (
              <option key={d.id} value={d.id}>{d.fullName}</option>
            ))}
          </NeoSelect>
        </div>
      </NeoCard>

      <NeoCard className="p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-300/40 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Appointments for {dateFilter || 'All Dates'} ({filteredAppointments.length})
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            Flowchart State Machine: Request → Check-In → Consult → Billing
          </span>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No appointments match the current filter selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-300/40 bg-slate-100/40 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-3.5 pl-5">Time & Queue</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Service & Dentist</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300/30 text-slate-700">
                {filteredAppointments.map((apt) => {
                  const patient = patients.find((p) => p.id === apt.patientId);
                  const dentist = dentists.find((d) => d.id === apt.dentistId);
                  const service = services.find((s) => s.id === apt.serviceId);

                  return (
                    <tr key={apt.id} className="hover:bg-slate-100/50 transition-all">
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">{apt.startTime}</span>
                          <span className="text-slate-400 text-[11px]">- {apt.endTime}</span>
                        </div>
                        {apt.queueNumber !== undefined && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-md">
                            Queue #{apt.queueNumber}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{patient?.fullName}</div>
                        <div className="text-[11px] text-slate-500">
                          {patient?.phone} • {patient?.patientNumber}
                        </div>
                        {patient?.requiresStaffReviewForBooking && (
                          <span className="text-[10px] text-amber-700 font-bold">
                            ⚠️ {patient.noShowCount} No-Shows (Flagged)
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{service?.name}</div>
                        <div className="text-[11px] text-slate-500">Dr. {dentist?.fullName}</div>
                      </td>

                      <td className="p-3.5">
                        <NeoStatusPill status={apt.status} size="sm" />
                      </td>

                      <td className="p-3.5 pr-5 text-right space-x-1.5">
                        {(apt.status === 'Confirmed' || apt.status === 'Requested') && (
                          <button
                            onClick={() => {
                              setCheckInAptId(apt.id);
                              setIsCheckInOpen(true);
                            }}
                            className="neo-btn px-2.5 py-1 rounded-xl text-blue-700 font-bold hover:bg-blue-50 text-[11px] cursor-pointer"
                          >
                            Check In
                          </button>
                        )}

                        {apt.status === 'Waiting' && (
                          <button
                            onClick={() => onStartConsultation(apt.id)}
                            className="neo-btn px-2.5 py-1 rounded-xl text-purple-700 font-bold hover:bg-purple-50 text-[11px] cursor-pointer"
                          >
                            To Chair
                          </button>
                        )}

                        {apt.status === 'Payment-Pending' && (
                          <button
                            onClick={() => setPaymentApt(apt)}
                            className="neo-btn-primary px-3 py-1 rounded-xl font-bold text-[11px] cursor-pointer"
                          >
                            Process Payment
                          </button>
                        )}

                        {apt.status === 'Completed' && (
                          <button
                            onClick={() => setFollowUpApt(apt)}
                            className="neo-btn px-2.5 py-1 rounded-xl text-emerald-700 font-semibold text-[11px] cursor-pointer"
                          >
                            Schedule Follow-Up
                          </button>
                        )}

                        {!['Completed', 'Cancelled', 'No-Show', 'Rescheduled'].includes(apt.status) && (
                          <>
                            <button
                              onClick={() => setRescheduleApt(apt)}
                              className="neo-btn p-1.5 rounded-xl text-slate-500 hover:text-blue-600 cursor-pointer"
                              title="Reschedule"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setNoShowApt(apt)}
                              className="neo-btn p-1.5 rounded-xl text-slate-500 hover:text-amber-600 cursor-pointer"
                              title="Record No-Show"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setCancelApt(apt)}
                              className="neo-btn p-1.5 rounded-xl text-slate-500 hover:text-rose-600 cursor-pointer"
                              title="Cancel Appointment"
                            >
                              <CalendarX2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </NeoCard>

      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => {
          setIsCheckInOpen(false);
          setCheckInAptId(null);
        }}
        preselectedAppointmentId={checkInAptId || undefined}
      />

      <PaymentModal
        isOpen={!!paymentApt}
        onClose={() => setPaymentApt(null)}
        appointment={paymentApt}
        onScheduleFollowUp={(apt) => {
          setPaymentApt(null);
          setFollowUpApt(apt);
        }}
      />

      <FollowUpModal
        isOpen={!!followUpApt}
        onClose={() => setFollowUpApt(null)}
        originalAppointment={followUpApt}
      />

      <CancellationModal
        isOpen={!!cancelApt}
        onClose={() => setCancelApt(null)}
        appointment={cancelApt}
      />

      <RescheduleModal
        isOpen={!!rescheduleApt}
        onClose={() => setRescheduleApt(null)}
        appointment={rescheduleApt}
      />

      <NoShowModal
        isOpen={!!noShowApt}
        onClose={() => setNoShowApt(null)}
        appointment={noShowApt}
      />

      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
    </div>
  );
};
