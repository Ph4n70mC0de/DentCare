import React from 'react';
import { useDentalStore } from '../../services/useDentalStore';
import { ClinicAnalytics } from './ClinicAnalytics';
import { UserDirectory } from './UserDirectory';
import { DentalServices } from './DentalServices';
import { DentistSchedules } from './DentistSchedules';
import { WaitlistEngine } from './WaitlistEngine';
import { AuditTrail } from './AuditTrail';
import { ReportsExport } from './ReportsExport';
import { ClinicSettings } from './ClinicSettings';

interface AdminDashboardProps {
  currentView?: string;
  onStartBooking?: (patientId?: string) => void;
  onNavigateToWaitingRoom?: () => void;
  onStartConsultation?: (appointmentId: string) => void;
  onNavigateToDirectory?: () => void;
  onNavigateToDayFlow?: () => void;
  onNavigateToBilling?: () => void;
  onNavigateToExceptions?: () => void;
  onNavigateToReports?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentView, onStartBooking, onNavigateToWaitingRoom, onStartConsultation }) => {
  const {
    appointments,
    patients,
    dentists,
    services,
    payments,
    auditLogs,
    waitlist,
    settings,
    addService,
    updateService,
    addBlockedSchedule,
    removeBlockedSchedule,
    updateSettings,
    schedules,
    blockedSchedules
  } = useDentalStore();

  const [activeTab, setActiveTab] = React.useState<string>(() => {
    if (!currentView) return 'analytics';
    switch (currentView) {
      case 'admin-dashboard':
        return 'analytics';
      case 'admin-reports':
        return 'reports';
      case 'admin-audit':
        return 'audit';
      case 'admin-services':
        return 'services';
      case 'admin-waitlist':
        return 'waitlist';
      case 'admin-settings':
        return 'settings';
      case 'admin-users':
        return 'users';
      case 'admin-schedules':
        return 'schedules';
      default:
        return 'analytics';
    }
  });

  React.useEffect(() => {
    if (!currentView) return;
    switch (currentView) {
      case 'admin-dashboard':
        setActiveTab('analytics');
        break;
      case 'admin-reports':
        setActiveTab('reports');
        break;
      case 'admin-audit':
        setActiveTab('audit');
        break;
      case 'admin-services':
        setActiveTab('services');
        break;
      case 'admin-waitlist':
        setActiveTab('waitlist');
        break;
      case 'admin-settings':
        setActiveTab('settings');
        break;
      case 'admin-users':
        setActiveTab('users');
        break;
      case 'admin-schedules':
        setActiveTab('schedules');
        break;
    }
  }, [currentView]);

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Entity', 'Entity ID', 'Details'];
    const rows = auditLogs.map((log) => [
      log.timestamp,
      `"${log.actorName}"`,
      log.actorRole,
      log.action,
      log.entityType,
      log.entityId,
      `"${JSON.stringify(log.details).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DentCare-AuditLog-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'analytics', label: '1. Clinic Analytics', shortLabel: 'Analytics', title: 'Clinic Analytics', description: 'Operational KPIs, revenue, cancellation rates, and practitioner workload.' },
    { id: 'users', label: '2. User Directory', shortLabel: 'Users', title: 'User Directory', description: 'System-wide user accounts across all roles: Admin, Front Desk, Dentists, and Patients.' },
    { id: 'services', label: '3. Dental Services', shortLabel: 'Services', title: 'Dental Services', description: 'Manage dental catalog, procedure duration, and fees.' },
    { id: 'schedules', label: '4. Dentist Schedules', shortLabel: 'Schedules', title: 'Dentist Schedules', description: 'Weekly operating hours and blocked exceptions per practitioner.' },
    { id: 'waitlist', label: '5. Waitlist Engine', shortLabel: 'Waitlist', title: 'Waitlist Engine', description: 'Cancellation priority waitlist and automatic notification matching.' },
    { id: 'audit', label: '6. Audit Trail', shortLabel: 'Audit', title: 'Audit Trail', description: 'Immutable audit logging for all state changes, cancellations, and payments.' },
    { id: 'reports', label: '7. Reports & Export', shortLabel: 'Reports', title: 'Reports & Export', description: 'Generate CSV exports for clinic operations, financials, and compliance.' },
    { id: 'settings', label: '8. Clinic Settings', shortLabel: 'Settings', title: 'Clinic Settings', description: 'Clinic operational rules, reminder timings, no-show thresholds, and automation buffers.' }
  ];

  const activeTabMeta = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="neo-raised p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {activeTabMeta.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {activeTabMeta.description}
          </p>
        </div>
      </div>

      {/* Content rendered directly from currentView via activeTab */}
      {activeTab === 'analytics' && (
        <ClinicAnalytics
          appointments={appointments}
          patients={patients}
          dentists={dentists}
          payments={payments}
          waitlist={waitlist}
          settings={settings}
        />
      )}

      {activeTab === 'users' && (
        <UserDirectory />
      )}

      {activeTab === 'services' && (
        <DentalServices
          services={services}
          onAddService={addService}
          onUpdateService={updateService}
        />
      )}

      {activeTab === 'schedules' && (
        <DentistSchedules
          schedules={schedules}
          blockedSchedules={blockedSchedules}
          dentists={dentists}
          onAddBlockedSchedule={addBlockedSchedule}
          onRemoveBlockedSchedule={removeBlockedSchedule}
        />
      )}

      {activeTab === 'waitlist' && (
        <WaitlistEngine
          waitlist={waitlist}
          patients={patients}
          services={services}
          dentists={dentists}
        />
      )}

      {activeTab === 'audit' && (
        <AuditTrail
          auditLogs={auditLogs}
          onExportCSV={exportAuditCSV}
        />
      )}

      {activeTab === 'reports' && (
        <ReportsExport
          appointments={appointments}
          patients={patients}
          dentists={dentists}
          payments={payments}
          auditLogs={auditLogs}
          waitlist={waitlist}
        />
      )}

      {activeTab === 'settings' && (
        <ClinicSettings
          settings={settings}
          onSaveSettings={updateSettings}
        />
      )}
    </div>
  );
};
