import React, { useState, useMemo } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoSelect } from '../common/NeoSelect';
import { Appointment, Patient, Dentist, Payment, AuditLog, WaitlistEntry } from '../../types';

interface ReportsExportProps {
  appointments: Appointment[];
  patients: Patient[];
  dentists: Dentist[];
  payments: Payment[];
  auditLogs: AuditLog[];
  waitlist: WaitlistEntry[];
}

type ReportType = 'appointments' | 'payments' | 'audit' | 'patients' | 'waitlist';

export const ReportsExport: React.FC<ReportsExportProps> = ({
  appointments,
  patients,
  dentists,
  payments,
  auditLogs,
  waitlist
}) => {
  const [reportType, setReportType] = useState<ReportType>('appointments');

  const exportCSV = (headers: string[], rows: string[][], filename: string) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAppointmentsCSV = () => {
    const headers = ['Appointment #', 'Date', 'Time', 'Patient', 'Dentist', 'Service', 'Status', 'Source'];
    const rows = appointments.map((a) => {
      const pat = patients.find((p) => p.id === a.patientId);
      const dnt = dentists.find((d) => d.id === a.dentistId);
      return [
        a.appointmentNumber,
        a.date,
        `${a.startTime} - ${a.endTime}`,
        pat?.fullName || '',
        dnt?.fullName || '',
        a.serviceId,
        a.status,
        a.bookingSource
      ];
    });
    exportCSV(headers, rows, `DentCare-Appointments-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportPaymentsCSV = () => {
    const headers = ['Date', 'Patient', 'Amount Paid', 'Method', 'Status', 'Appointment #'];
    const rows = payments.map((p) => {
      const apt = appointments.find((a) => a.id === p.appointmentId);
      const pat = patients.find((pt) => pt.id === p.patientId);
      return [
        p.createdAt,
        pat?.fullName || '',
        String(p.amountPaid),
        p.paymentMethod,
        p.status,
        apt?.appointmentNumber || ''
      ];
    });
    exportCSV(headers, rows, `DentCare-Payments-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Entity', 'Entity ID', 'Details'];
    const rows = auditLogs.map((log) => [
      log.timestamp,
      log.actorName,
      log.actorRole,
      log.action,
      log.entityType,
      log.entityId,
      JSON.stringify(log.details)
    ]);
    exportCSV(headers, rows, `DentCare-AuditLog-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportPatientsCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Age', 'Total Visits', 'No-Shows', 'Status'];
    const rows = patients.map((p) => {
      const visits = appointments.filter((a) => a.patientId === p.id && a.status === 'Completed').length;
      const noShows = appointments.filter((a) => a.patientId === p.id && a.status === 'No-Show').length;
      return [
        p.fullName,
        p.phone,
        p.email,
        String(p.age),
        String(visits),
        String(noShows),
        p.requiresStaffReviewForBooking ? 'Flagged' : 'Active'
      ];
    });
    exportCSV(headers, rows, `DentCare-Patients-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const reportStats = useMemo(() => {
    const totalRevenue = payments.reduce((acc, p) => acc + p.amountPaid, 0);
    const totalAppointments = appointments.length;
    const completed = appointments.filter((a) => a.status === 'Completed').length;
    const cancelled = appointments.filter((a) => a.status === 'Cancelled').length;
    const noShow = appointments.filter((a) => a.status === 'No-Show').length;
    const activeWaitlist = waitlist.filter((w) => w.status === 'active').length;
    return { totalRevenue, totalAppointments, completed, cancelled, noShow, activeWaitlist };
  }, [appointments, payments, waitlist]);

  return (
    <div className="space-y-6">
      <NeoCard className="space-y-4">
        <div className="border-b border-slate-300/40 pb-3">
          <h3 className="text-sm font-bold text-slate-800">Reports & Data Export</h3>
          <p className="text-xs text-slate-500">Generate CSV exports for clinic operations, financials, and compliance.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NeoCard className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-700">₱{reportStats.totalRevenue.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-slate-500">{payments.length} receipts</p>
          </NeoCard>
          <NeoCard className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Appointments</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-blue-700">{reportStats.totalAppointments}</span>
            </div>
            <p className="text-[11px] text-slate-500">{reportStats.completed} completed</p>
          </NeoCard>
          <NeoCard className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Cancellations</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-700">{reportStats.cancelled}</span>
            </div>
            <p className="text-[11px] text-slate-500">{reportStats.noShow} no-shows</p>
          </NeoCard>
          <NeoCard className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Active Waitlist</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-700">{reportStats.activeWaitlist}</span>
            </div>
            <p className="text-[11px] text-slate-500">Pending notifications</p>
          </NeoCard>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NeoButton variant="default" onClick={exportAppointmentsCSV} icon={<FileText className="w-4 h-4" />}>
            Export Appointments (CSV)
          </NeoButton>
          <NeoButton variant="default" onClick={exportPaymentsCSV} icon={<FileSpreadsheet className="w-4 h-4" />}>
            Export Payments (CSV)
          </NeoButton>
          <NeoButton variant="default" onClick={exportAuditCSV} icon={<Download className="w-4 h-4" />}>
            Export Audit Trail (CSV)
          </NeoButton>
          <NeoButton variant="default" onClick={exportPatientsCSV} icon={<FileText className="w-4 h-4" />}>
            Export Patient Directory (CSV)
          </NeoButton>
        </div>
      </NeoCard>
    </div>
  );
};
