import React, { useState, useEffect } from 'react';
import { useDentalServices } from './services/useDentalServices';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { BookingWizard } from './components/patient/BookingWizard';
import { FrontDeskDashboard } from './components/frontdesk/FrontDeskDashboard';
import { DentistDashboard } from './components/dentist/DentistDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PatientDirectory } from './components/patient/PatientDirectory';
import { LoginScreen } from './components/auth/LoginScreen';
import { UserRole } from './types';

export default function App() {
  const {
    activeUser,
    authStatus,
    isAuthenticated,
    login,
    logout,
    setActiveUser,
    users,
    currentPatient,
    updateAppointmentStatus,
  } = useDentalServices();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>('frontdesk-dashboard');
  const [activeConsultationAptId, setActiveConsultationAptId] = useState<string | undefined>(
    undefined
  );
  const [selectedPatientIdForBooking, setSelectedPatientIdForBooking] = useState<
    string | undefined
  >(undefined);

  // Bootstrap session: loading → authenticated / unauthenticated
  useEffect(() => {
    if (!isAuthenticated() && authStatus === 'unauthenticated') {
      setCurrentView('frontdesk-dashboard');
    }
  }, [authStatus, isAuthenticated]);

  // Synchronize current default view when active role changes
  useEffect(() => {
    if (!activeUser) return;
    switch (activeUser.role) {
      case 'patient':
        setCurrentView('patient-dashboard');
        break;
      case 'front_desk':
        setCurrentView('frontdesk-dashboard');
        break;
      case 'dentist':
        setCurrentView('dentist-dashboard');
        break;
      case 'admin':
        setCurrentView('admin-dashboard');
        break;
    }
  }, [activeUser]);

  const handleRoleSwitch = (role: UserRole, targetView?: string) => {
    // DEV ONLY: Role switching is only available in development
    if (import.meta.env.PROD) {
      throw new Error('[handleRoleSwitch] Role switching is disabled in production');
    }

    const u = users.find((user) => user.role === role);
    if (u) {
      setActiveUser(u.id);
      if (targetView) {
        setCurrentView(targetView);
      }
    }
  };

  const handleStartConsultation = (appointmentId: string) => {
    updateAppointmentStatus(appointmentId, 'In-Consultation');
    setActiveConsultationAptId(appointmentId);
    // Switch active user to dentist if not already
    const dentistUser = users.find((u) => u.role === 'dentist');
    if (dentistUser) {
      setActiveUser(dentistUser.id);
    }
    setCurrentView('dentist-consultation');
  };

  // Role-based default view guard: never land on a view the current role cannot access
  const defaultViewForRole = (role: UserRole): string => {
    switch (role) {
      case 'patient':
        return 'patient-dashboard';
      case 'front_desk':
        return 'frontdesk-dashboard';
      case 'dentist':
        return 'dentist-dashboard';
      case 'admin':
        return 'admin-dashboard';
    }
  };

  // Guard: redirect to role-default view if current view is outside the active role's scope
  useEffect(() => {
    if (!activeUser) return;
    const roleViews: Record<UserRole, string[]> = {
      patient: [
        'patient-dashboard',
        'patient-book',
        'patient-appointments',
        'patient-records',
        'patient-waitlist',
      ],
      front_desk: [
        'frontdesk-dashboard',
        'frontdesk-waiting-room',
        'frontdesk-appointments',
        'frontdesk-billing',
        'frontdesk-exceptions',
        'frontdesk-reports',
        'frontdesk-search',
        'patient-book',
      ],
      dentist: [
        'dentist-dashboard',
        'dentist-schedule',
        'dentist-consultation',
        'dentist-records',
        'patient-book',
      ],
      admin: [
        'admin-dashboard',
        'admin-users',
        'admin-services',
        'admin-schedules',
        'admin-waitlist',
        'admin-audit',
        'admin-reports',
        'admin-settings',
        'patient-book',
      ],
    };
    const allowed = roleViews[activeUser.role];
    if (allowed && !allowed.includes(currentView)) {
      setCurrentView(defaultViewForRole(activeUser.role));
    }
  }, [activeUser, currentView]);

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E8EEF5] font-sans antialiased">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Signing in…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return (
      <LoginScreen
        onLogin={login}
        onLoading={() => {
          /* loader handled by App authStatus */
        }}
        authError={null}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#E8EEF5] text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-500/20 selection:text-blue-900">
      {/* Top Navigation */}
      <Navbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        currentView={currentView}
        onSelectView={(view) => setCurrentView(view)}
        onRoleSwitch={handleRoleSwitch}
        onLogout={logout}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Role Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-5xl">
          {/* Patient Views (Portal Dashboard, Book Appointment, Appointments, Records, Waitlist) */}
          {(currentView === 'patient-dashboard' ||
            currentView === 'patient-book' ||
            currentView === 'patient-appointments' ||
            currentView === 'patient-records' ||
            currentView === 'patient-waitlist') &&
            activeUser.role === 'patient' && (
              <PatientDashboard
                onStartBooking={() => {
                  setSelectedPatientIdForBooking(currentPatient?.id);
                  setCurrentView('patient-book');
                }}
                activeTab={currentView}
                onSelectTab={(tab) => setCurrentView(tab)}
              />
            )}

          {/* Standalone Booking Wizard for Front Desk and Staff booking for patients */}
          {currentView === 'patient-book' && activeUser.role !== 'patient' && (
            <BookingWizard
              initialPatientId={selectedPatientIdForBooking}
              onCompleted={() => {
                setSelectedPatientIdForBooking(undefined);
                if (activeUser.role === 'front_desk') {
                  setCurrentView('frontdesk-dashboard');
                } else {
                  setCurrentView('dentist-dashboard');
                }
              }}
              onCancel={() => {
                setSelectedPatientIdForBooking(undefined);
                if (activeUser.role === 'front_desk') {
                  setCurrentView('frontdesk-search');
                } else {
                  setCurrentView('dentist-schedule');
                }
              }}
            />
          )}

          {/* Patient Directory (Front Desk Directory or Admin User Directory) */}
          {currentView === 'frontdesk-search' && (
            <PatientDirectory
              onStartBooking={(patientId) => {
                setSelectedPatientIdForBooking(patientId);
                setCurrentView('patient-book');
              }}
              onNavigateToWaitingRoom={() => setCurrentView('frontdesk-waiting-room')}
              onNavigateToSchedule={() => setCurrentView('frontdesk-dashboard')}
              onStartConsultation={handleStartConsultation}
            />
          )}

          {/* Front Desk Views */}
          {(currentView === 'frontdesk-dashboard' ||
            currentView === 'frontdesk-waiting-room' ||
            currentView === 'frontdesk-appointments' ||
            currentView === 'frontdesk-billing' ||
            currentView === 'frontdesk-exceptions' ||
            currentView === 'frontdesk-reports') && (
            <FrontDeskDashboard
              activeTab={currentView}
              onSelectTab={(tab) => setCurrentView(tab)}
              onStartBooking={() => {
                setSelectedPatientIdForBooking(undefined);
                setCurrentView('patient-book');
              }}
              onStartBookingWithPatientId={(patientId) => {
                setSelectedPatientIdForBooking(patientId);
                setCurrentView('patient-book');
              }}
              onNavigateToWaitingRoom={() => setCurrentView('frontdesk-waiting-room')}
              onStartConsultation={handleStartConsultation}
              onNavigateToDirectory={() => setCurrentView('frontdesk-search')}
              onNavigateToDayFlow={() => setCurrentView('frontdesk-appointments')}
              onNavigateToBilling={() => setCurrentView('frontdesk-billing')}
              onNavigateToExceptions={() => setCurrentView('frontdesk-exceptions')}
              onNavigateToReports={() => setCurrentView('frontdesk-reports')}
            />
          )}

          {/* Dentist Views */}
          {(currentView === 'dentist-dashboard' ||
            currentView === 'dentist-schedule' ||
            currentView === 'dentist-consultation' ||
            currentView === 'dentist-records') && (
            <DentistDashboard
              activeTab={currentView}
              onSelectTab={(tab) => setCurrentView(tab)}
              onStartBooking={() => {
                setSelectedPatientIdForBooking(undefined);
                setCurrentView('patient-book');
              }}
              onStartBookingWithPatientId={(patientId) => {
                setSelectedPatientIdForBooking(patientId);
                setCurrentView('patient-book');
              }}
              onNavigateToWaitingRoom={() => setCurrentView('frontdesk-waiting-room')}
              onStartConsultation={handleStartConsultation}
              onNavigateToDirectory={() => setCurrentView('frontdesk-search')}
              onNavigateToDayFlow={() => setCurrentView('frontdesk-appointments')}
              onNavigateToBilling={() => setCurrentView('frontdesk-billing')}
              onNavigateToExceptions={() => setCurrentView('frontdesk-exceptions')}
              onNavigateToReports={() => setCurrentView('frontdesk-reports')}
              activeConsultationAptId={activeConsultationAptId}
              onCompleteConsultation={() => {
                setActiveConsultationAptId(undefined);
                setCurrentView('dentist-dashboard');
              }}
            />
          )}

          {/* Admin Views */}
          {currentView.startsWith('admin-') && (
            <AdminDashboard
              currentView={currentView}
              onStartBooking={(patientId) => {
                setSelectedPatientIdForBooking(patientId);
                setCurrentView('patient-book');
              }}
              onNavigateToWaitingRoom={() => setCurrentView('frontdesk-waiting-room')}
              onStartConsultation={handleStartConsultation}
              onNavigateToDirectory={() => setCurrentView('frontdesk-search')}
              onNavigateToDayFlow={() => setCurrentView('frontdesk-appointments')}
              onNavigateToBilling={() => setCurrentView('frontdesk-billing')}
              onNavigateToExceptions={() => setCurrentView('frontdesk-exceptions')}
              onNavigateToReports={() => setCurrentView('frontdesk-reports')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
