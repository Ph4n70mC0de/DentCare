import React, { useState } from 'react';
import { AlertCircle, Siren, CheckCircle2, Users, Clock } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { NeoSelect } from '../common/NeoSelect';
import { NeoInput } from '../common/NeoInput';
import { useDentalStore } from '../../services/useDentalStore';
import { Appointment } from '../../types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (apt: Appointment) => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    patients,
    dentists,
    services,
    settings,
    createEmergencyAppointment
  } = useDentalStore();

  const [patientId, setPatientId] = useState<string>(patients[0]?.id || '');
  const [dentistId, setDentistId] = useState<string>(dentists[0]?.id || '');
  const [serviceId, setServiceId] = useState<string>(
    services.find((s) => s.category === 'General' || s.name.includes('Emergency'))?.id || services[0]?.id || ''
  );
  const [severity, setSeverity] = useState<'high' | 'critical'>('critical');
  const [emergencyNotes, setEmergencyNotes] = useState<string>('Severe acute pulpitis pain with facial swelling');
  const [result, setResult] = useState<{ appointment: Appointment; affectedWaitingPatientsCount: number } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !dentistId || !emergencyNotes.trim()) return;

    const res = createEmergencyAppointment({
      patientId,
      dentistId,
      serviceId,
      emergencyNotes: emergencyNotes.trim(),
      severity
    });

    setResult(res);
    if (onSuccess) onSuccess(res.appointment);
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-rose-700 font-extrabold">
          <Siren className="w-5 h-5 animate-bounce" />
          <span>Exception Flow: Priority Emergency Case</span>
        </div>
      }
      subtitle="Instantly injects an urgent dental case into the live clinical schedule"
      maxWidth="lg"
    >
      {result ? (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-2xl neo-inset border-l-4 border-rose-600 bg-rose-50/50 space-y-2">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Emergency Case Prioritized (Queue #0)</span>
            </div>
            <p className="text-xs text-slate-700">
              Assigned Emergency Reference <strong>#{result.appointment.appointmentNumber}</strong> to Dr. {dentists.find((d) => d.id === dentistId)?.fullName}.
            </p>
          </div>

          <div className="p-4 rounded-2xl neo-raised bg-[#E8EEF5] text-xs space-y-2 text-slate-700">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" /> Automated Schedule Balancing:
            </h5>
            <p>
              • <strong>{result.affectedWaitingPatientsCount} waiting patient(s)</strong> had their appointments automatically adjusted by +{settings.emergencyBufferShiftMinutes} minutes.
            </p>
            <p>
              • SMS & in-app courtesy delay notifications dispatched to affected waiting patients.
            </p>
            <p>
              • Emergency override event logged to immutable clinic audit trail.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <NeoButton variant="primary" onClick={handleClose}>
              Return to Reception
            </NeoButton>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 rounded-2xl neo-raised bg-rose-50/60 border-l-4 border-rose-500 text-xs text-rose-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Emergency Protocol Activated
            </p>
            <p>
              This bypasses normal availability and grants immediate priority. The system will safely recalculate subsequent waiting times by +{settings.emergencyBufferShiftMinutes} minutes without deleting any records.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NeoSelect
              label="Select Patient *"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.patientNumber})
                </option>
              ))}
            </NeoSelect>

            <NeoSelect
              label="Assign Dentist Operatory *"
              value={dentistId}
              onChange={(e) => setDentistId(e.target.value)}
              required
            >
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} ({d.specialization})
                </option>
              ))}
            </NeoSelect>

            <NeoSelect
              label="Procedure / Exam Type"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMinutes}m)
                </option>
              ))}
            </NeoSelect>

            <NeoSelect
              label="Triage Severity Level *"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as 'high' | 'critical')}
            >
              <option value="critical">Critical (Trauma, Bleeding, Acute Facial Swelling)</option>
              <option value="high">High (Severe Throbbing Pulpitis, Broken Incisor)</option>
            </NeoSelect>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Emergency Clinical Notes / Symptoms *
            </label>
            <textarea
              rows={3}
              placeholder="Describe acute pain, physical trauma, or swelling..."
              value={emergencyNotes}
              onChange={(e) => setEmergencyNotes(e.target.value)}
              className="w-full neo-inset p-3 rounded-2xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/40"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-300/40">
            <NeoButton type="button" variant="default" onClick={handleClose}>
              Cancel
            </NeoButton>
            <NeoButton type="submit" variant="danger">
              <Siren className="w-4 h-4 mr-1.5" /> Inject Priority Emergency
            </NeoButton>
          </div>
        </form>
      )}
    </NeoModal>
  );
};
