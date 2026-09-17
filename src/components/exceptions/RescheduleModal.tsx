import React, { useState } from 'react';
import { CalendarClock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { Appointment } from '../../types';
import { useDentalStore } from '../../services/useDentalStore';
import { getTodayDateString } from '../../data/seedData';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: (newApt: Appointment) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess
}) => {
  const { rescheduleAppointment, getAvailableSlotsForDate, services, dentists, patients } = useDentalStore();
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [newApt, setNewApt] = useState<Appointment | null>(null);

  if (!appointment) return null;

  const patient = patients.find((p) => p.id === appointment.patientId);
  const dentist = dentists.find((d) => d.id === appointment.dentistId);
  const service = services.find((s) => s.id === appointment.serviceId);

  const duration = service ? service.durationMinutes : 45;
  const availableSlots = newDate && dentist
    ? getAvailableSlotsForDate(dentist.id, newDate, duration)
    : [];

  const handleReschedule = () => {
    setErrorMsg('');
    if (!newDate || !newTime) {
      setErrorMsg('Please select a new date and an open time slot.');
      return;
    }

    const res = rescheduleAppointment(appointment.id, newDate, newTime);
    if (!res.success) {
      setErrorMsg(res.error || 'Rescheduling failed. Slot unavailable.');
    } else if (res.newAppointment) {
      setNewApt(res.newAppointment);
      if (onSuccess) onSuccess(res.newAppointment);
    }
  };

  const handleClose = () => {
    setNewApt(null);
    setNewDate('');
    setNewTime('');
    setErrorMsg('');
    onClose();
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-blue-700">
          <CalendarClock className="w-5 h-5" />
          <span>Exception Flow: Reschedule Appointment</span>
        </div>
      }
      subtitle={`Original: #${appointment.appointmentNumber} (${appointment.date} at ${appointment.startTime})`}
      maxWidth="lg"
    >
      {newApt ? (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-2xl neo-inset border-l-4 border-emerald-500 bg-emerald-50/50 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Reschedule Confirmed</span>
            </div>
            <p className="text-xs text-slate-600">
              New Appointment <strong>#{newApt.appointmentNumber}</strong> confirmed for <strong>{newApt.date} at {newApt.startTime}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl neo-raised bg-[#E8EEF5] text-xs space-y-2 text-slate-600">
            <p>• Historical record <strong>#{appointment.appointmentNumber}</strong> preserved with status 'Rescheduled'.</p>
            <p>• Live availability check passed and slot reserved.</p>
            <p>• Updated SMS & In-app notifications dispatched to {patient?.fullName}.</p>
            <p>• Dentist schedule updated.</p>
          </div>

          <div className="flex justify-end pt-2">
            <NeoButton variant="primary" onClick={handleClose}>
              Done
            </NeoButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl neo-inset text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Slot</span>
              <span className="font-bold text-slate-700">{appointment.date} @ {appointment.startTime}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-500" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Dentist & Procedure</span>
              <span className="font-bold text-slate-700">{dentist?.fullName} ({service?.name})</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <NeoInput
              label="Select New Date *"
              type="date"
              min={getTodayDateString()}
              value={newDate}
              onChange={(e) => {
                setNewDate(e.target.value);
                setNewTime('');
              }}
            />

            {newDate && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Select Live Available Time Slot *
                </label>
                {availableSlots.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 neo-inset rounded-xl text-center">
                    No slots available on {newDate} for {dentist?.fullName}. Please pick another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                    {availableSlots.map((slot) => {
                      if (!slot.available) {
                        return (
                          <div
                            key={slot.time}
                            className="neo-inset-sm p-2 rounded-xl text-center opacity-40 text-xs font-medium text-slate-400 line-through select-none"
                          >
                            {slot.time}
                          </div>
                        );
                      }
                      const isSelected = newTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => setNewTime(slot.time)}
                          className={`p-2 rounded-xl text-center font-bold text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'neo-inset text-blue-700 border border-blue-400 font-extrabold'
                              : 'neo-btn text-slate-700 hover:text-blue-600'
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300/40">
            <NeoButton variant="default" onClick={handleClose}>
              Cancel
            </NeoButton>
            <NeoButton
              variant="primary"
              disabled={!newDate || !newTime}
              onClick={handleReschedule}
            >
              Confirm Reschedule
            </NeoButton>
          </div>
        </div>
      )}
    </NeoModal>
  );
};
