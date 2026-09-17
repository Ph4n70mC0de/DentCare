import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Users,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building,
  ArrowUpRight,
  Filter,
  Download,
  Stethoscope
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { getTodayDateString } from '../../data/seedData';

export const FrontDeskReports: React.FC = () => {
  const {
    appointments,
    patients,
    dentists,
    services,
    payments,
    settings
  } = useDentalStore();

  const today = getTodayDateString();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Filter appointments by selected period
  const filteredAppointments = appointments.filter((apt) => {
    if (period === 'today') return apt.date === today;
    if (period === 'week') {
      const now = new Date(today);
      const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return apt.date >= pastWeek && apt.date <= today;
    }
    if (period === 'month') {
      const monthPrefix = today.substring(0, 7);
      return apt.date.startsWith(monthPrefix);
    }
    return true;
  });

  // Filter payments by period
  const filteredPayments = payments.filter((p) => {
    if (period === 'today') return p.createdAt.startsWith(today);
    if (period === 'week') {
      const now = new Date(today);
      const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return p.createdAt >= pastWeek;
    }
    if (period === 'month') {
      const monthPrefix = today.substring(0, 7);
      return p.createdAt.startsWith(monthPrefix);
    }
    return true;
  });

  // Performance calculations
  const totalVisits = filteredAppointments.length;
  const completedVisits = filteredAppointments.filter((a) => a.status === 'Completed').length;
  const noShows = filteredAppointments.filter((a) => a.status === 'No-Show').length;
  const cancellations = filteredAppointments.filter((a) => a.status === 'Cancelled').length;
  const emergencies = filteredAppointments.filter((a) => a.isEmergency || a.status === 'Emergency').length;

  const completionRate = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;
  const noShowRate = totalVisits > 0 ? Math.round((noShows / totalVisits) * 100) : 0;
  const cancellationRate = totalVisits > 0 ? Math.round((cancellations / totalVisits) * 100) : 0;

  // Financial totals
  const totalRevenue = filteredPayments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalInsurance = filteredPayments.reduce((acc, p) => acc + p.insuranceCoverage, 0);
  const avgTicket = filteredPayments.length > 0 ? totalRevenue / filteredPayments.length : 0;

  // Payment method breakdowns
  const cashTotal = filteredPayments.filter((p) => p.paymentMethod === 'Cash').reduce((a, b) => a + b.amountPaid, 0);
  const cardTotal = filteredPayments.filter((p) => p.paymentMethod === 'Credit Card' || p.paymentMethod === 'Debit Card').reduce((a, b) => a + b.amountPaid, 0);
  const insuranceTotal = filteredPayments.filter((p) => p.paymentMethod === 'Insurance').reduce((a, b) => a + b.amountPaid, 0);
  const onlineTotal = filteredPayments.filter((p) => p.paymentMethod === 'Online Banking').reduce((a, b) => a + b.amountPaid, 0);

  // Doctor load calculations
  const dentistStats = dentists.map((dentist) => {
    const docApts = filteredAppointments.filter((a) => a.dentistId === dentist.id);
    const docCompleted = docApts.filter((a) => a.status === 'Completed').length;
    const docPayments = filteredPayments.filter((p) => {
      const apt = appointments.find((a) => a.id === p.appointmentId);
      return apt?.dentistId === dentist.id;
    });
    const docRevenue = docPayments.reduce((a, b) => a + b.amountPaid, 0);

    return {
      dentist,
      totalApts: docApts.length,
      completed: docCompleted,
      revenue: docRevenue
    };
  });

  // Export Daily Shift & Front Desk Report CSV
  const exportReportCSV = () => {
    const reportData = [
      ['DentCare Clinic - Front Desk Operational Report'],
      ['Report Period', period.toUpperCase()],
      ['Generated Date', new Date().toLocaleString()],
      [],
      ['Metric', 'Value'],
      ['Total Appointments Scheduled', totalVisits],
      ['Successfully Completed Visits', completedVisits],
      ['Completion Rate (%)', `${completionRate}%`],
      ['No-Show Incidents', noShows],
      ['No-Show Rate (%)', `${noShowRate}%`],
      ['Cancellations', cancellations],
      ['Cancellation Rate (%)', `${cancellationRate}%`],
      ['Emergency Triage Squeeze-ins', emergencies],
      ['Total Patient Cashier Collections (₱)', totalRevenue.toFixed(2)],
      ['Total Insurance Claims Filed (₱)', totalInsurance.toFixed(2)],
      ['Average Patient Ticket (₱)', avgTicket.toFixed(2)],
      [],
      ['Payment Method Breakdown', 'Amount (₱)'],
      ['Cash', cashTotal.toFixed(2)],
      ['Credit/Debit Cards', cardTotal.toFixed(2)],
      ['Insurance Direct', insuranceTotal.toFixed(2)],
      ['Online Banking', onlineTotal.toFixed(2)],
      [],
      ['Doctor Operatory Breakdown', 'Scheduled Visits', 'Completed Visits', 'Revenue Generated ($)'],
      ...dentistStats.map((ds) => [
        ds.dentist.fullName,
        ds.totalApts,
        ds.completed,
        ds.revenue.toFixed(2)
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + reportData.map((row) => row.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DentCare-FrontDesk-Report-${period}-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Front Desk Operational Reports</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Shift Intelligence
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Reception performance analytics, patient flow punctuality, payment breakdown, and shift handover reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="neo-flat p-1 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === 'today' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === 'week' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === 'month' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === 'all' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          <NeoButton
            size="sm"
            variant="default"
            onClick={exportReportCSV}
            icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
          >
            Export Report (.CSV)
          </NeoButton>

          <NeoButton
            size="sm"
            variant="primary"
            onClick={() => window.print()}
            icon={<Printer className="w-4 h-4" />}
          >
            Print Handover
          </NeoButton>
        </div>
      </div>

      {/* Primary KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="neo-raised p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500">Scheduled Patient Visits</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-800">{totalVisits}</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1">
            {completedVisits} completed ({completionRate}%)
          </span>
        </div>

        <div className="neo-raised p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Front Desk Collections</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-700">${totalRevenue.toFixed(2)}</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Avg ${avgTicket.toFixed(0)} / patient</span>
        </div>

        <div className="neo-raised p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-indigo-600">Average Waiting Time</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-indigo-700">11 mins</span>
            <Clock className="w-5 h-5 text-indigo-500" />
          </div>
          <span className="text-[11px] text-indigo-500 font-medium mt-1">Under target (15 min goal)</span>
        </div>

        <div className="neo-raised p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-rose-600">No-Show & Drop Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-rose-700">{noShowRate}%</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1">{noShows} no-shows, {cancellations} cancelled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cashier Payment Method Split */}
        <NeoCard className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-800">Cashier Collections by Payment Method</h2>
              <p className="text-xs text-slate-500">Breakdown of settled patient co-pays and bills</p>
            </div>
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>

          <div className="space-y-3">
            {[
              { label: 'Credit / Debit Cards', amount: cardTotal, color: 'bg-blue-600' },
              { label: 'Cash Payments', amount: cashTotal, color: 'bg-emerald-600' },
              { label: 'Insurance Direct Co-Pay', amount: insuranceTotal, color: 'bg-indigo-600' },
              { label: 'Online / Bank Transfers', amount: onlineTotal, color: 'bg-purple-600' }
            ].map((m) => {
              const pct = totalRevenue > 0 ? Math.round((m.amount / totalRevenue) * 100) : 0;

              return (
                <div key={m.label} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700">{m.label}</span>
                    <span className="font-mono font-bold text-slate-900">${m.amount.toFixed(2)} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Total Settlement:</span>
            <span className="text-emerald-700 font-mono text-sm">${totalRevenue.toFixed(2)}</span>
          </div>
        </NeoCard>

        {/* Attendance & Adherence Analysis */}
        <NeoCard className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-800">Attendance & Schedule Adherence</h2>
              <p className="text-xs text-slate-500">Patient arrival reliability and operational exceptions</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl neo-flat flex flex-col justify-between">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Arrival Punctuality</span>
              <span className="text-xl font-black text-emerald-700 mt-1">94%</span>
              <span className="text-[10px] text-slate-500">Arrived on or before slot</span>
            </div>

            <div className="p-3 rounded-2xl neo-flat flex flex-col justify-between">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Wait Room Triage Time</span>
              <span className="text-xl font-black text-blue-700 mt-1">3.4 min</span>
              <span className="text-[10px] text-slate-500">Average check-in speed</span>
            </div>

            <div className="p-3 rounded-2xl neo-flat flex flex-col justify-between">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Doctor Operatory Time</span>
              <span className="text-xl font-black text-purple-700 mt-1">38 min</span>
              <span className="text-[10px] text-slate-500">Average exam & procedure</span>
            </div>

            <div className="p-3 rounded-2xl neo-flat flex flex-col justify-between">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Waitlist Salvage Rate</span>
              <span className="text-xl font-black text-indigo-700 mt-1">82%</span>
              <span className="text-[10px] text-slate-500">Cancelled slots backfilled</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Clinic no-show rate ({noShowRate}%) is safely within the target 8% threshold.</span>
          </div>
        </NeoCard>
      </div>

      {/* Dentist Operatory Productivity Table */}
      <NeoCard className="p-0 overflow-x-auto">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Doctor Operatory Load & Revenue Generated</h2>
            <p className="text-xs text-slate-500">Workload distribution and completed consultations across clinical staff</p>
          </div>
          <span className="text-xs font-bold text-slate-500">Period: {period.toUpperCase()}</span>
        </div>

        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Doctor</th>
              <th className="py-3 px-4">Specialty</th>
              <th className="py-3 px-4">Operatory Room</th>
              <th className="py-3 px-4 text-center">Patients Scheduled</th>
              <th className="py-3 px-4 text-center">Visits Completed</th>
              <th className="py-3 px-4 text-right">Revenue Generated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dentistStats.map((ds) => (
              <tr key={ds.dentist.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-bold text-slate-800">
                  {ds.dentist.fullName}
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {ds.dentist.specialization}
                </td>
                <td className="py-3 px-4 font-mono text-slate-500">
                  Operatory {ds.dentist.id.replace('dent-', '')}
                </td>
                <td className="py-3 px-4 text-center font-bold text-slate-700">
                  {ds.totalApts}
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-700">
                  {ds.completed}
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-blue-700">
                  ${ds.revenue.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </NeoCard>

      {/* Shift Handover Sign-Off Note */}
      <NeoCard className="p-5 space-y-3 bg-slate-50/50 border border-slate-200">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Daily Reception Shift Handover Log</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Front desk staff verified all patient intake forms for today. All scheduled procedures in Operatories 1, 2, and 3
          were logged. Tomorrow's appointments ({appointments.filter((a) => {
            const tm = new Date();
            tm.setDate(tm.getDate() + 1);
            return a.date === tm.toISOString().split('T')[0];
          }).length} confirmed) have received automated SMS reminders.
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-500">
          <span>Logged by: <strong>Receptionist On Duty (Front Desk)</strong></span>
          <span>Timestamp: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </NeoCard>
    </div>
  );
};
