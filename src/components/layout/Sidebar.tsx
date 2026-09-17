import React from 'react';
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarCheck2,
  FileText,
  Clock,
  Users,
  CreditCard,
  AlertTriangle,
  Stethoscope,
  BarChart3,
  ShieldCheck,
  Settings,
  Sparkles,
  ClipboardList,
  UserPlus
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { UserRole } from '../../types';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isOpen,
  onClose
}) => {
  const { activeUser, appointments, waitlist, currentPatient } = useDentalStore();

  const getNavItems = (role: UserRole) => {
    switch (role) {
      case 'patient': {
        const patientAptCount = currentPatient
          ? appointments.filter(
              (a) =>
                a.patientId === currentPatient.id &&
                ['Requested', 'Confirmed', 'Checked-In', 'Waiting', 'In-Consultation'].includes(a.status)
            ).length
          : 0;
        const patientWaitlistCount = currentPatient
          ? waitlist.filter((w) => w.patientId === currentPatient.id && w.status === 'active').length
          : 0;

        return [
          { id: 'patient-dashboard', label: 'My Dashboard', icon: LayoutDashboard },
          { id: 'patient-book', label: 'Book Appointment', icon: CalendarPlus },
          { id: 'patient-appointments', label: 'My Appointments', icon: CalendarCheck2, badge: patientAptCount || undefined },
          { id: 'patient-records', label: 'Dental History & Rx', icon: FileText },
          { id: 'patient-waitlist', label: 'My Waitlist', icon: Clock, badge: patientWaitlistCount || undefined }
        ];
      }

      case 'front_desk': {
        const waitingCount = appointments.filter(
          (a) => a.status === 'Waiting' || a.status === 'Checked-In'
        ).length;

        return [
          { id: 'frontdesk-dashboard', label: 'Reception Overview', icon: LayoutDashboard },
          { id: 'frontdesk-waiting-room', label: 'Waiting Room Queue', icon: Clock, badge: waitingCount || undefined },
          { id: 'frontdesk-appointments', label: 'Appointment Day Flow', icon: CalendarCheck2 },
          { id: 'frontdesk-search', label: 'Patient Directory', icon: Users },
          { id: 'frontdesk-billing', label: 'Payments & Insurance', icon: CreditCard },
          { id: 'frontdesk-exceptions', label: 'Exception Flows', icon: AlertTriangle },
          { id: 'frontdesk-reports', label: 'Front Desk Reports', icon: BarChart3 }
        ];
      }

      case 'dentist':
        return [
          { id: 'dentist-dashboard', label: 'Operatory & Schedule', icon: LayoutDashboard },
          { id: 'dentist-consultation', label: 'Consultation & Exam', icon: Stethoscope },
          { id: 'dentist-records', label: 'Clinical Histories', icon: ClipboardList },
          { id: 'dentist-schedule', label: 'My Clinic Hours', icon: Clock }
        ];

      case 'admin':
        return [
          { id: 'admin-dashboard', label: 'Clinic Analytics', icon: LayoutDashboard },
          { id: 'admin-users', label: 'User Directory', icon: Users },
          { id: 'admin-services', label: 'Dental Services', icon: Sparkles },
          { id: 'admin-schedules', label: 'Dentist Schedules', icon: Clock },
          { id: 'admin-waitlist', label: 'Waitlist Engine', icon: CalendarPlus, badge: waitlist.filter((w) => w.status === 'active').length || undefined },
          { id: 'admin-audit', label: 'Audit Trail', icon: ShieldCheck },
          { id: 'admin-reports', label: 'Reports & Export', icon: BarChart3 },
          { id: 'admin-settings', label: 'Clinic Settings', icon: Settings }
        ];
    }
  };

  const navItems = getNavItems(activeUser.role);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:sticky top-[61px] left-0 h-[calc(100vh-61px)] w-64 neo-raised bg-[#E8EEF5] p-4 flex flex-col z-30 transition-transform duration-300 md:translate-x-0 overflow-y-auto ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          {activeUser.role === 'patient'
            ? 'Patient Services'
            : activeUser.role === 'front_desk'
            ? 'Reception Desk'
            : activeUser.role === 'dentist'
            ? 'Clinical Workspace'
            : 'Administration'}
        </div>

        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none ${
                  isActive
                    ? 'neo-inset text-blue-700 bg-[#E8EEF5]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
