import React, { useState } from 'react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { Appointment, WaitlistEntry } from '../../types';
import { MyDashboard } from './MyDashboard';
import { BookAppointment } from './BookAppointment';
import { MyAppointments } from './MyAppointments';
import { DentalHistoryAndRx } from './DentalHistoryAndRx';
import { MyWaitlist } from './MyWaitlist';
import { BookingWizard } from './BookingWizard';

interface PatientDashboardProps {
  onStartBooking: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  onStartBooking,
  activeTab = 'patient-dashboard',
  onSelectTab
}) => {
  const { currentPatient, joinWaitlist, cancelWaitlistEntry } = useDentalStore();

  const [selectedForCancel, setSelectedForCancel] = useState<Appointment | null>(null);
  const [selectedForReschedule, setSelectedForReschedule] = useState<Appointment | null>(null);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);

  const handleJoinWaitlist = (entry: Omit<WaitlistEntry, 'id' | 'createdAt'>) => {
    joinWaitlist(entry);
  };

  if (!currentPatient) {
    return (
      <NeoCard className="p-8 text-center space-y-4">
        <p className="text-slate-600">Please select or register a patient profile.</p>
        <NeoButton variant="primary" onClick={onStartBooking}>
          Book an Appointment
        </NeoButton>
      </NeoCard>
    );
  }

  const currentTabMode =
    activeTab === 'patient-book'
      ? 'patient-book'
      : activeTab === 'patient-appointments'
      ? 'patient-appointments'
      : activeTab === 'patient-records'
      ? 'patient-records'
      : activeTab === 'patient-waitlist'
      ? 'patient-waitlist'
      : 'patient-dashboard';

  if (currentTabMode === 'patient-book') {
    return (
      <BookAppointment
        initialPatientId={currentPatient.id}
        onCancel={() => {
          if (onSelectTab) onSelectTab('patient-dashboard');
        }}
        onViewAppointments={() => {
          if (onSelectTab) onSelectTab('patient-appointments');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {currentTabMode === 'patient-dashboard' && (
        <MyDashboard
          onStartBooking={onStartBooking}
          onSelectTab={(tab) => onSelectTab && onSelectTab(tab)}
          selectedForCancel={selectedForCancel}
          setSelectedForCancel={setSelectedForCancel}
          selectedForReschedule={selectedForReschedule}
          setSelectedForReschedule={setSelectedForReschedule}
          isWaitlistModalOpen={isWaitlistModalOpen}
          setIsWaitlistModalOpen={setIsWaitlistModalOpen}
          onJoinWaitlist={handleJoinWaitlist}
        />
      )}

      {currentTabMode === 'patient-appointments' && (
        <MyAppointments
          onStartBooking={onStartBooking}
          onSelectTab={(tab) => onSelectTab && onSelectTab(tab)}
          selectedForCancel={selectedForCancel}
          setSelectedForCancel={setSelectedForCancel}
          selectedForReschedule={selectedForReschedule}
          setSelectedForReschedule={setSelectedForReschedule}
        />
      )}

      {currentTabMode === 'patient-records' && (
        <DentalHistoryAndRx onStartBooking={onStartBooking} />
      )}

      {currentTabMode === 'patient-waitlist' && (
        <MyWaitlist
          onStartBooking={onStartBooking}
          onSelectTab={(tab) => onSelectTab && onSelectTab(tab)}
          isWaitlistModalOpen={isWaitlistModalOpen}
          setIsWaitlistModalOpen={setIsWaitlistModalOpen}
          onJoinWaitlist={handleJoinWaitlist}
        />
      )}
    </div>
  );
};
