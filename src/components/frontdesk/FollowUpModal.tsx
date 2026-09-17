import React, { useState } from 'react';
import { CalendarPlus, CheckCircle2, Clock, Calendar, Bell } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { useDentalStore } from '../../services/useDentalStore';
import { Appointment } from '../../types';
import { getOffsetDateString } from '../../data/seedData';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalAppointment: Appointment | null;
  onSuccess?: (newApt: Appointment) => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  originalAppointment,
  onSuccess
}) => {
  const {
    patients,
    dentists,
    services,
    consultations,
    createAppointment,
    scheduleFollowUpReminder,
    getAvailableSlotsForDate
  } = useDentalStore();

  if (!originalAppointment) return null;

  const patient = patients.find((p) => p.id === originalAppointment.patientId);
  const dentist = dentists.find((d) => d.id === originalAppointment.dentistId);
  const service = services.find((s) => s.id === originalAppointment.serviceId);
  const consultation = consultations.find((c) => c.appointmentId === originalAppointment.id);

  // Default follow-up date (e.g. timeframe in weeks or default 2 weeks)
  const defaultOffset = (consultation?.followUpRecommendation?.timeframeWeeks || 2) * 7;

  const [date, setDate] = useState<string>(getOffsetDateString(defaultOffset));
  const [time, setTime] = useState<string>('');
  const [notes, setNotes] = useState<string>(
    consultation?.followUpRecommendation?.notes || 'Recommended clinical follow-up examination'
  );
  const [createdApt, setCreatedApt] = useState<Appointment | null>(null);

  const availableSlots = dentist
    ? getAvailableSlotsForDate(dentist.id, date, service?.durationMinutes || 30)
    : [];

  const handleBookFollowUp = () => {
    if (!patient || !dentist || !service || !date || !time) return;

    const apt = createAppointment({
      patientId: patient.id,
      dentistId: dentist.id,
      serviceId: service.id,
      date,
      startTime: time,
      notes: `Follow-up from #${originalAppointment.appointmentNumber}: ${notes}`,
      bookingSource: 'online_form'
    });

    const remindedApt = scheduleFollowUpReminder(apt.id) || apt;
    setCreatedApt(remindedApt);
    if (onSuccess) onSuccess(apt);
  };

  const handleClose = () => {
    setCreatedApt(null);
    setTime('');
    onClose();
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-blue-700">
          <CalendarPlus className="w-5 h-5" />
          <span>Schedule Recommended Follow-Up</span>
        </div>
      }
      subtitle={`Patient: ${patient?.fullName} • Prior Visit: #${originalAppointment.appointmentNumber}`}
      maxWidth="md"
    >
      {createdApt ? (
        <div className="space-y-4 py-2 text-center">
          <div className="w-16 h-16 rounded-3xl neo-raised mx-auto flex items-center justify-center text-emerald-600 bg-emerald-50">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h4 className="text-xl font-bold text-slate-800">Follow-Up Successfully Booked!</h4>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            Appointment reference <strong>#{createdApt.appointmentNumber}</strong> confirmed for <strong>{createdApt.date} at {createdApt.startTime}</strong>.
          </p>

          <div className="p-3.5 rounded-2xl neo-inset text-xs space-y-1 text-slate-600">
            <div className="flex items-center justify-center gap-2 font-bold text-blue-700">
              <Bell className="w-4 h-4" />
              <span>Automated 24-Hour Reminder Scheduled</span>
            </div>
            <p className="text-[11px] text-slate-500">
              The system will dispatch an in-app, SMS, and email reminder to {patient?.phone} 24 hours prior to the appointment.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <NeoButton variant="primary" onClick={handleClose}>
              Done
            </NeoButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {consultation && (
            <div className="p-3.5 rounded-2xl neo-raised bg-blue-50/50 text-xs space-y-1">
              <span className="font-bold text-blue-900 block">Dentist's Recommendation:</span>
              <p className="text-slate-700">
                Timeframe: <strong>{consultation.followUpRecommendation?.timeframeWeeks ? `${consultation.followUpRecommendation.timeframeWeeks} week(s)` : 'General follow-up'}</strong> • Notes: {consultation.followUpRecommendation?.notes || 'Follow-up exam'}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <NeoInput
              label="Select Follow-Up Target Date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime('');
              }}
            />

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Available Time Slots
              </label>
              {availableSlots.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 neo-inset rounded-xl text-center">
                  No slots available on {date}. Try another date.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                  {availableSlots.map((slot) => {
                    if (!slot.available) return null;
                    const isSelected = time === slot.time;
                    return (
                      <button
                        key={slot.time}
                        onClick={() => setTime(slot.time)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'neo-inset text-blue-700 font-extrabold border border-blue-400'
                            : 'neo-btn text-slate-700'
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <NeoInput
              label="Follow-Up Clinical Instructions"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300/40">
            <NeoButton variant="default" onClick={handleClose}>
              Skip For Now
            </NeoButton>
            <NeoButton
              variant="primary"
              disabled={!date || !time}
              onClick={handleBookFollowUp}
            >
              Confirm Follow-Up Appointment
            </NeoButton>
          </div>
        </div>
      )}
    </NeoModal>
  );
};
