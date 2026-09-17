import React, { useState } from 'react';
import { UserX, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { NeoSelect } from '../common/NeoSelect';
import { Appointment } from '../../types';
import { useDentalStore } from '../../services/useDentalStore';

interface NoShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

export const NoShowModal: React.FC<NoShowModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess
}) => {
  const { markNoShow, patients, settings } = useDentalStore();
  const [reason, setReason] = useState<string>('Patient did not arrive within grace period (15 mins)');
  const [notes, setNotes] = useState<string>('');
  const [result, setResult] = useState<{ success: boolean; patientRequiresReview: boolean } | null>(null);

  if (!appointment) return null;

  const patient = patients.find((p) => p.id === appointment.patientId);

  const handleMarkNoShow = () => {
    const fullReason = notes.trim() ? `${reason} - ${notes.trim()}` : reason;
    const res = markNoShow(appointment.id, fullReason);
    setResult(res);
    if (onSuccess) onSuccess();
  };

  const handleClose = () => {
    setResult(null);
    setNotes('');
    onClose();
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-rose-800">
          <UserX className="w-5 h-5" />
          <span>Exception Flow: Record No-Show</span>
        </div>
      }
      subtitle={`Appointment #${appointment.appointmentNumber} • Patient: ${patient?.fullName}`}
      maxWidth="md"
    >
      {result ? (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-2xl neo-inset border-l-4 border-amber-500 bg-amber-50/50 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>No-Show Recorded in Patient Record</span>
            </div>
            <p className="text-xs text-slate-700">
              Total Recorded No-Shows for {patient?.fullName}: <strong>{(patient?.noShowCount || 0)}</strong>
            </p>
            {result.patientRequiresReview && (
              <p className="text-xs font-bold text-rose-700">
                ⚠️ Clinic Threshold Reached (≥ {settings.maxNoShowsBeforeLock}): Patient is now flagged as requiring Staff Review before booking future slots.
              </p>
            )}
          </div>

          <p className="text-xs text-slate-600">
            Automated clinic warning notice dispatched to patient's in-app and SMS feed.
          </p>

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
              <span className="text-slate-500">Past No-Show Count:</span>
              <span className="font-bold text-rose-600">{patient?.noShowCount || 0} times</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Threshold for Booking Restriction:</span>
              <span className="font-bold text-slate-700">{settings.maxNoShowsBeforeLock} strikes</span>
            </div>
          </div>

          <div className="space-y-3">
            <NeoSelect
              label="Observed No-Show Reason *"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="Patient did not arrive within grace period (15 mins)">
                Patient did not arrive within grace period (15 mins)
              </option>
              <option value="Unreachable by phone / voicemail left">
                Unreachable by phone / voicemail left
              </option>
              <option value="Called after appointment time had passed">
                Called after appointment time had passed
              </option>
              <option value="No response to 24h reminder SMS">
                No response to 24h reminder SMS
              </option>
              <option value="Other unexcused absence">
                Other unexcused absence
              </option>
            </NeoSelect>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Staff Observations / Call Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Attempted front desk call at 10:15am, line busy..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full neo-inset p-3 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300/40">
            <NeoButton variant="default" onClick={handleClose}>
              Cancel
            </NeoButton>
            <NeoButton variant="danger" onClick={handleMarkNoShow}>
              Confirm No-Show Record
            </NeoButton>
          </div>
        </div>
      )}
    </NeoModal>
  );
};
