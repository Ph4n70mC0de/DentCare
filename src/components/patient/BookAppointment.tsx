import React from 'react';
import { BookingWizard } from './BookingWizard';

interface BookAppointmentProps {
  initialPatientId?: string;
  onCancel: () => void;
  onViewAppointments?: () => void;
}

export const BookAppointment: React.FC<BookAppointmentProps> = ({
  initialPatientId,
  onCancel,
  onViewAppointments
}) => {
  return (
    <div className="space-y-6">
      <BookingWizard
        initialPatientId={initialPatientId}
        onCompleted={() => {
          if (onViewAppointments) {
            onViewAppointments();
          } else {
            onCancel();
          }
        }}
        onCancel={onCancel}
        onViewAppointments={onViewAppointments}
      />
    </div>
  );
};
