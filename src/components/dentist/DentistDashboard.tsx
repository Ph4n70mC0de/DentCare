import React from 'react';
import { OperatoryAndSchedule } from './OperatoryAndSchedule';
import { ConsultationAndExam } from './ConsultationAndExam';
import { ClinicalHistories } from './ClinicalHistories';
import { MyClinicHours } from './MyClinicHours';
import { Consultation } from '../../types';

interface DentistDashboardProps {
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
  activeConsultationAptId?: string;
  onCompleteConsultation?: (record: Consultation) => void;
}

export const DentistDashboard: React.FC<DentistDashboardProps> = ({
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
  onNavigateToReports,
  activeConsultationAptId,
  onCompleteConsultation
}) => {
  const currentView =
    activeTab === 'dentist-consultation'
      ? 'consultation-and-exam'
      : activeTab === 'dentist-records'
        ? 'clinical-histories'
        : activeTab === 'dentist-schedule'
          ? 'my-clinic-hours'
          : 'operatory-and-schedule';

  if (currentView === 'consultation-and-exam') {
    return (
      <ConsultationAndExam
        appointmentId={activeConsultationAptId}
        onComplete={(record) => {
          if (onCompleteConsultation) onCompleteConsultation(record);
          onSelectTab('dentist-dashboard');
        }}
        onBack={() => onSelectTab('dentist-dashboard')}
      />
    );
  }

  if (currentView === 'clinical-histories') {
    return (
      <ClinicalHistories
        onStartBooking={onStartBookingWithPatientId}
        onStartConsultation={onStartConsultation}
        onNavigateToOperatory={() => onSelectTab('dentist-dashboard')}
      />
    );
  }

  if (currentView === 'my-clinic-hours') {
    return (
      <MyClinicHours
        onNavigateToOperatory={() => onSelectTab('dentist-dashboard')}
      />
    );
  }

  return (
    <OperatoryAndSchedule
      onStartConsultation={onStartConsultation}
    />
  );
};
