import React from 'react';
import { ReceptionOverview } from './ReceptionOverview';
import { WaitingRoom } from './WaitingRoom';
import { AppointmentDayFlow } from './AppointmentDayFlow';
import { PatientDirectory } from '../patient/PatientDirectory';
import { PaymentAndInsurance } from './PaymentAndInsurance';
import { ExceptionFlows } from './ExceptionFlows';
import { FrontDeskReports } from './FrontDeskReports';

interface FrontDeskDashboardProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onStartBooking: () => void;
  onStartBookingWithPatientId: (patientId: string) => void;
  onNavigateToWaitingRoom: () => void;
  onStartConsultation: (appointmentId: string) => void;
  onNavigateToDirectory?: () => void;
  onNavigateToDayFlow?: () => void;
  onNavigateToBilling?: () => void;
  onNavigateToExceptions?: () => void;
  onNavigateToReports?: () => void;
}

export const FrontDeskDashboard: React.FC<FrontDeskDashboardProps> = ({
  activeTab,
  onSelectTab,
  onStartBooking,
  onStartBookingWithPatientId,
  onNavigateToWaitingRoom,
  onStartConsultation,
  onNavigateToDirectory,
  onNavigateToDayFlow,
  onNavigateToBilling,
  onNavigateToExceptions,
  onNavigateToReports
}) => {
  const currentView =
    activeTab === 'frontdesk-waiting-room'
      ? 'waiting-room'
      : activeTab === 'frontdesk-appointments'
        ? 'appointment-day-flow'
        : activeTab === 'frontdesk-search'
          ? 'patient-directory'
          : activeTab === 'frontdesk-billing'
            ? 'payments-insurance'
            : activeTab === 'frontdesk-exceptions'
              ? 'exception-flows'
              : activeTab === 'frontdesk-reports'
                ? 'reports'
                : 'reception-overview';

  if (currentView === 'waiting-room') {
    return (
      <WaitingRoom
        onStartConsultation={onStartConsultation}
        onOpenCheckIn={() => onSelectTab('frontdesk-dashboard')}
      />
    );
  }

  if (currentView === 'appointment-day-flow') {
    return (
      <AppointmentDayFlow
        onStartBooking={onStartBooking}
        onNavigateToWaitingRoom={onNavigateToWaitingRoom}
        onStartConsultation={onStartConsultation}
        onNavigateToBilling={onNavigateToBilling}
      />
    );
  }

  if (currentView === 'patient-directory') {
    return (
      <PatientDirectory
        onStartBooking={onStartBookingWithPatientId}
        onNavigateToWaitingRoom={onNavigateToWaitingRoom}
        onNavigateToSchedule={() => onSelectTab('frontdesk-dashboard')}
        onStartConsultation={onStartConsultation}
      />
    );
  }

  if (currentView === 'payments-insurance') {
    return (
      <PaymentAndInsurance
        onNavigateToDayFlow={onNavigateToDayFlow}
      />
    );
  }

  if (currentView === 'exception-flows') {
    return (
      <ExceptionFlows
        onStartBooking={onStartBookingWithPatientId}
      />
    );
  }

  if (currentView === 'reports') {
    return <FrontDeskReports />;
  }

  return (
    <ReceptionOverview
      onStartBooking={onStartBooking}
      onNavigateToWaitingRoom={onNavigateToWaitingRoom}
      onStartConsultation={onStartConsultation}
      onNavigateToDirectory={onNavigateToDirectory}
      onNavigateToDayFlow={onNavigateToDayFlow}
      onNavigateToBilling={onNavigateToBilling}
      onNavigateToExceptions={onNavigateToExceptions}
      onNavigateToReports={onNavigateToReports}
    />
  );
};
