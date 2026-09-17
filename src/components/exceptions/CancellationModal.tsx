import React, { useState } from 'react';
import { AlertCircle, CalendarX2, CheckCircle2, Send, Users } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { NeoSelect } from '../common/NeoSelect';
import { Appointment } from '../../types';
import { useDentalStore } from '../../services/useDentalStore';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess
}) => {
  const { cancelAppointment, patients, dentists, services } = useDentalStore();
  const [reasonCategory, setReasonCategory] = useState<string>('Personal emergency');
  const [customReason, setCustomReason] = useState<string>('');
  const [result, setResult] = useState<{ success: boolean; notifiedWaitlistCount: number } | null>(null);

  if (!appointment) return null;

  const patient = patients.find((p) => p.id === appointment.patientId);
  const dentist = dentists.find((d) => d.id === appointment.dentistId);
  const service = services.find((s) => s.id === appointment.serviceId);

  const handleCancel = () => {
    const fullReason = customReason.trim()
      ? `${reasonCategory}: ${customReason.trim()}`
      : reasonCategory;

    const res = cancelAppointment(appointment.id, fullReason);
    setResult(res);
    if (onSuccess) onSuccess();
  };

  const handleClose = () => {
    setResult(null);
    setCustomReason('');
    onClose();
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-rose-700">
          <CalendarX2 className="w-5 h-5" />
          <span>Exception Flow: Cancel Appointment</span>
        </div>
      }
      subtitle={`Appointment #${appointment.appointmentNumber}`}
      maxWidth="lg"
    >
      {result ? (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-2xl neo-inset border-l-4 border-emerald-500 bg-emerald-50/50 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Appointment Cancelled & Slot Released</span>
            </div>
            <p className="text-xs text-slate-600">
              The time slot <strong>{appointment.date} at {appointment.startTime}</strong> is now free for new bookings.
            </p>
          </div>

          <div className="p-4 rounded-2xl neo-raised bg-[#E8EEF5] text-xs space-y-2">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-blue-600" /> Automated Workflow Execution:
            </h5>
            <p className="text-slate-600">• Dentist <strong>{dentist?.fullName}</strong> notified of schedule opening.</p>
            <p className="text-slate-600">• Patient <strong>{patient?.fullName}</strong> sent cancellation confirmation.</p>
            <p className="text-slate-600 font-bold text-blue-700">
              • Waitlist Matching: {result.notifiedWaitlistCount} eligible waitlisted patients automatically notified!
            </p>
            <p className="text-slate-600">• Timestamp and actor recorded in immutable audit log.</p>
          </div>

          <div className="flex justify-end pt-2">
            <NeoButton variant="primary" onClick={handleClose}>
              Done
            </NeoButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl neo-inset text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-slate-800">{patient?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service:</span>
              <span className="font-bold text-slate-800">{service?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Scheduled:</span>
              <span className="font-bold text-blue-700">{appointment.date} at {appointment.startTime}</span>
            </div>
          </div>

          <div className="space-y-3">
            <NeoSelect
              label="Cancellation Reason Category *"
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
            >
              <option value="Patient illness or indisposition">Patient illness or indisposition</option>
              <option value="Personal schedule conflict">Personal schedule conflict</option>
              <option value="Transportation / Travel issue">Transportation / Travel issue</option>
              <option value="Financial / Insurance constraint">Financial / Insurance constraint</option>
              <option value="Resolved elsewhere / symptoms subsided">Resolved elsewhere / symptoms subsided</option>
              <option value="Clinic requested cancellation">Clinic requested cancellation</option>
              <option value="Other reason">Other reason</option>
            </NeoSelect>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Additional Details / Staff Notes
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes for the record..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full neo-inset p-3 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl neo-raised bg-rose-50/60 border-l-4 border-rose-500 text-xs text-rose-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Automated Business Rules:
            </p>
            <p>1. Releases time slot immediately preventing double bookings.</p>
            <p>2. Automatically matches and notifies eligible patients on the waitlist.</p>
            <p>3. Dentist is alerted in their daily roster.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <NeoButton variant="default" onClick={handleClose}>
              Back
            </NeoButton>
            <NeoButton variant="danger" onClick={handleCancel}>
              Confirm Cancellation
            </NeoButton>
          </div>
        </div>
      )}
    </NeoModal>
  );
};
