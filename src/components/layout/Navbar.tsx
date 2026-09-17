import React from 'react';
import {
  Activity,
  RotateCcw,
  Menu,
  X
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { UserRole } from '../../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  currentView: string;
  onSelectView: (view: string) => void;
  onRoleSwitch?: (role: UserRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  currentView,
  onSelectView,
  onRoleSwitch
}) => {
  const { activeUser, users, setActiveUser, resetToSeed } = useDentalStore();

  const handleRoleChange = (role: UserRole) => {
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      setActiveUser(targetUser.id);
      if (onRoleSwitch) {
        onRoleSwitch(role);
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all appointments, queue, and logs back to initial clean demo state?')) {
      resetToSeed();
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'patient': return 'Patient Portal';
      case 'front_desk': return 'Front Desk';
      case 'dentist': return 'Dentist Chair';
      case 'admin': return 'Clinic Admin';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#E8EEF5]/95 backdrop-blur-md border-b border-slate-300/50 shadow-xs">
      {/* Primary Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand & Sidebar Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden neo-btn p-2 rounded-xl text-slate-700 hover:text-blue-600 transition-all cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => {
              if (activeUser.role === 'patient') {
                onSelectView('patient-dashboard');
              } else if (activeUser.role === 'front_desk') {
                onSelectView('frontdesk-dashboard');
              } else if (activeUser.role === 'dentist') {
                onSelectView('dentist-dashboard');
              } else {
                onSelectView('admin-dashboard');
              }
            }}
            className="flex items-center gap-2 select-none cursor-pointer"
          >
            <div className="neo-raised w-9 h-9 rounded-xl flex items-center justify-center bg-blue-600 text-white shadow-xs">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-800">DentCare</span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                  DDS Pro
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 hidden xl:block leading-none">
                Dental Clinic Platform
              </p>
            </div>
          </div>
        </div>

        {/* Right: Role Switcher & User Meta */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Role Switcher Pill */}
          <div className="flex items-center gap-1.5 neo-inset-sm px-2.5 py-1 rounded-xl text-xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Role:
            </span>
            <select
              value={activeUser.role}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className="bg-transparent font-bold text-slate-700 text-xs outline-none cursor-pointer hover:text-blue-700"
              aria-label="Switch User Persona Role"
            >
              <option value="patient">👤 Patient</option>
              <option value="front_desk">🛎️ Front Desk</option>
              <option value="dentist">🩺 Dentist</option>
              <option value="admin">🛡️ Admin</option>
            </select>
          </div>

          <button
            onClick={handleReset}
            title="Reset to clean Demo State"
            className="neo-btn p-2 rounded-xl text-slate-500 hover:text-blue-600 transition-all cursor-pointer hidden sm:flex items-center justify-center"
            aria-label="Reset Demo State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <NotificationCenter />

          {/* User badge */}
          <div className="flex items-center gap-2 pl-0.5">
            <div className="w-8 h-8 rounded-xl neo-raised flex items-center justify-center font-bold text-xs text-blue-700 overflow-hidden bg-blue-50 shrink-0">
              {activeUser.avatarUrl ? (
                <img
                  src={activeUser.avatarUrl}
                  alt={activeUser.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                activeUser.fullName.charAt(0)
              )}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                {activeUser.fullName}
              </p>
              <span className="text-[10px] font-semibold text-blue-600 capitalize block leading-none">
                {getRoleLabel(activeUser.role)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
