import React, { useState } from 'react';
import {
  Calendar,
  CalendarCheck2,
  CalendarPlus,
  CalendarX2,
  CalendarClock,
  Clock,
  Stethoscope,
  Download,
  Search
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoStatusPill } from '../common/NeoStatusPill';
import { Appointment } from '../../types';
import { CancellationModal } from '../exceptions/CancellationModal';
import { RescheduleModal } from '../exceptions/RescheduleModal';
import { downloadICS } from './patientUtils';

interface MyAppointmentsProps {
  onStartBooking: () => void;
  onSelectTab: (tab: string) => void;
  selectedForCancel: Appointment | null;
  setSelectedForCancel: (apt: Appointment | null) => void;
  selectedForReschedule: Appointment | null;
  setSelectedForReschedule: (apt: Appointment | null) => void;
}

export const MyAppointments: React.FC<MyAppointmentsProps> = ({
  onStartBooking,
  onSelectTab,
  selectedForCancel,
  setSelectedForCancel,
  selectedForReschedule,
  setSelectedForReschedule
}) => {
  const {
    currentPatient,
    appointments,
    dentists,
    services,
    settings
  } = useDentalStore();

  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const myAppointments = appointments
    .filter((a) => a.patientId === currentPatient.id)
    .sort((a, b) => new Date(b.date + ' ' + b.startTime).getTime() - new Date(a.date + ' ' + a.startTime).getTime());

  const upcomingAppointments = myAppointments.filter((a) =>
    ['Requested', 'Confirmed', 'Checked-In', 'Waiting', 'In-Consultation'].includes(a.status)
  );

  const pastAppointments = myAppointments.filter((a) =>
    ['Completed', 'Payment-Pending'].includes(a.status)
  );

  const cancelledAppointments = myAppointments.filter((a) =>
    ['Cancelled', 'No-Show', 'Rescheduled'].includes(a.status)
  );

  const filteredAppointments = myAppointments.filter((apt) => {
    if (appointmentFilter === 'upcoming') {
      if (!['Requested', 'Confirmed', 'Checked-In', 'Waiting', 'In-Consultation'].includes(apt.status)) return false;
    } else if (appointmentFilter === 'past') {
      if (!['Completed', 'Payment-Pending'].includes(apt.status)) return false;
    } else if (appointmentFilter === 'cancelled') {
      if (!['Cancelled', 'No-Show', 'Rescheduled'].includes(apt.status)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const srv = services.find((s) => s.id === apt.serviceId);
      const dnt = dentists.find((d) => d.id === apt.dentistId);
      const matchesService = srv?.name.toLowerCase().includes(q);
      const matchesDentist = dnt?.fullName.toLowerCase().includes(q);
      const matchesDate = apt.date.includes(q);
      const matchesRef = apt.appointmentNumber.toLowerCase().includes(q);
      if (!matchesService && !matchesDentist && !matchesDate && !matchesRef) return false;
    }

    return true;
  });

  return (
    <>
      <div className="space-y-6">
      {/* Header & Controls */}
      <div className="neo-raised p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              My Dental Appointments
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            View upcoming appointments, reschedule visits, cancel reservations, or download calendar reminders (.ics).
          </p>
        </div>

        <NeoButton
          variant="primary"
          size="md"
          onClick={onStartBooking}
          icon={<CalendarPlus className="w-4 h-4" />}
        >
          Book New Appointment
        </NeoButton>
      </div>

      {/* Filter Bar & Search */}
      <div className="neo-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 neo-inset-sm rounded-xl">
          <button
            onClick={() => setAppointmentFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              appointmentFilter === 'all'
                ? 'neo-raised bg-[#E8EEF5] text-blue-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({myAppointments.length})
          </button>
          <button
            onClick={() => setAppointmentFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              appointmentFilter === 'upcoming'
                ? 'neo-raised bg-[#E8EEF5] text-blue-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming ({upcomingAppointments.length})
          </button>
          <button
            onClick={() => setAppointmentFilter('past')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              appointmentFilter === 'past'
                ? 'neo-raised bg-[#E8EEF5] text-blue-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({pastAppointments.length})
          </button>
          <button
            onClick={() => setAppointmentFilter('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              appointmentFilter === 'cancelled'
                ? 'neo-raised bg-[#E8EEF5] text-blue-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelled ({cancelledAppointments.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dentist, service, date..."
            className="w-full pl-9 pr-3 py-1.5 text-xs neo-inset rounded-xl bg-transparent text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <NeoCard className="p-10 text-center space-y-3">
          <CalendarX2 className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No appointments found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are no appointment records matching your current filter criteria.
          </p>
          <NeoButton variant="primary" size="sm" onClick={onStartBooking}>
            Book a Visit Now
          </NeoButton>
        </NeoCard>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => {
            const srv = services.find((s) => s.id === apt.serviceId);
            const dnt = dentists.find((d) => d.id === apt.dentistId);
            const isPast = ['Completed', 'Cancelled', 'No-Show', 'Rescheduled'].includes(apt.status);

            return (
              <div
                key={apt.id}
                className="neo-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:scale-[1.005] transition-all"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-base text-slate-800">
                      {srv?.name}
                    </span>
                    <NeoStatusPill status={apt.status} size="sm" />
                    <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-md neo-inset">
                      #{apt.appointmentNumber}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{dnt?.fullName} ({dnt?.specialization})</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <strong className="text-slate-700">{apt.date}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <strong className="text-slate-700">{apt.startTime} - {apt.endTime}</strong>
                    </span>
                    <span>Duration: {srv?.durationMinutes} mins</span>
                    <span>Fee: ₱{srv?.price}</span>
                  </div>

                  {apt.cancellationReason && (
                    <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200 mt-1">
                      <strong>Cancellation Reason:</strong> {apt.cancellationReason}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {!isPast && (
                    <>
                      <NeoButton
                        size="sm"
                        variant="default"
                        onClick={() => setSelectedForReschedule(apt)}
                        icon={<CalendarClock className="w-3.5 h-3.5 text-blue-600" />}
                      >
                        Reschedule
                      </NeoButton>
                      <NeoButton
                        size="sm"
                        variant="default"
                        className="text-rose-700 hover:text-rose-900"
                        onClick={() => setSelectedForCancel(apt)}
                        icon={<CalendarX2 className="w-3.5 h-3.5" />}
                      >
                        Cancel
                      </NeoButton>
                    </>
                  )}

                  <button
                    onClick={() => downloadICS(apt, settings, services, dentists)}
                    className="neo-btn p-2 rounded-xl text-slate-600 hover:text-slate-900 cursor-pointer"
                    title="Download Calendar (.ics)"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* Exception Modals */}
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
    </>
  );
};
