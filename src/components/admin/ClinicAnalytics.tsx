import React from 'react';
import { DollarSign, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { NeoCard } from '../common/NeoCard';
import { Appointment, Patient, Dentist, Payment, WaitlistEntry, SystemSettings } from '../../types';

interface ClinicAnalyticsProps {
  appointments: Appointment[];
  patients: Patient[];
  dentists: Dentist[];
  payments: Payment[];
  waitlist: WaitlistEntry[];
  settings: SystemSettings;
}

export const ClinicAnalytics: React.FC<ClinicAnalyticsProps> = ({
  appointments,
  patients,
  dentists,
  payments,
  waitlist,
  settings
}) => {
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter((a) => a.status === 'Completed');
  const cancelledAppointments = appointments.filter((a) => a.status === 'Cancelled');
  const noShowAppointments = appointments.filter((a) => a.status === 'No-Show');

  const cancellationRate = totalAppointments > 0
    ? ((cancelledAppointments.length / totalAppointments) * 100).toFixed(1)
    : '0';

  const noShowRate = totalAppointments > 0
    ? ((noShowAppointments.length / totalAppointments) * 100).toFixed(1)
    : '0';

  const totalRevenue = payments.reduce((acc, p) => acc + p.amountPaid, 0);
  const activeWaitlistCount = waitlist.filter((w) => w.status === 'active').length;
  const notifiedWaitlistCount = waitlist.filter((w) => w.status === 'notified').length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NeoCard className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Gross Clinic Revenue
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">${totalRevenue.toFixed(2)}</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500">From {payments.length} settled patient receipts</p>
        </NeoCard>

        <NeoCard className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Completed Treatments
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700">{completedAppointments.length}</span>
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500">Total appointments: {totalAppointments}</p>
        </NeoCard>

        <NeoCard className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Cancellation Rate
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-700">{cancellationRate}%</span>
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-[11px] text-slate-500">{cancelledAppointments.length} cancelled bookings</p>
        </NeoCard>

        <NeoCard className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            No-Show Rate
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-700">{noShowRate}%</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-[11px] text-slate-500">{noShowAppointments.length} unexcused no-shows</p>
        </NeoCard>
      </div>

      {/* Operational Flow Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NeoCard className="space-y-4">
          <h4 className="text-sm font-bold text-slate-800 border-b border-slate-300/40 pb-2">
            Flowchart Exception Handling Performance
          </h4>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-xl neo-inset">
              <span className="text-slate-600">Total Patients Enrolled in Waitlists:</span>
              <span className="font-bold text-slate-800">{waitlist.length}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl neo-inset">
              <span className="text-slate-600">Waitlist Notification Dispatches (Slot Openings):</span>
              <span className="font-bold text-blue-700">{notifiedWaitlistCount} notifications</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl neo-inset">
              <span className="text-slate-600">Flagged Restricted Accounts (≥ {settings.maxNoShowsBeforeLock} No-Shows):</span>
              <span className="font-bold text-rose-700">
                {patients.filter((p) => p.requiresStaffReviewForBooking).length} patients
              </span>
            </div>
          </div>
        </NeoCard>

        <NeoCard className="space-y-4">
          <h4 className="text-sm font-bold text-slate-800 border-b border-slate-300/40 pb-2">
            Practitioner Workload Distribution
          </h4>
          <div className="space-y-3">
            {dentists.map((d) => {
              const dntApts = appointments.filter((a) => a.dentistId === d.id);
              const completed = dntApts.filter((a) => a.status === 'Completed').length;
              return (
                <div key={d.id} className="p-3 rounded-xl neo-raised bg-[#E8EEF5] text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 block">{d.fullName}</span>
                    <span className="text-slate-500 text-[11px]">{d.specialization}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-blue-700 text-sm">{completed} visits</span>
                    <span className="text-[10px] text-slate-400 block">{dntApts.length} total scheduled</span>
                  </div>
                </div>
              );
            })}
          </div>
        </NeoCard>
      </div>
    </div>
  );
};
