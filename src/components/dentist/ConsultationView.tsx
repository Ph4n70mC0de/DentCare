import React, { useState } from 'react';
import {
  Stethoscope,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  Pill,
  Save,
  ArrowRight
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { NeoSelect } from '../common/NeoSelect';
import { NeoBadge } from '../common/NeoBadge';
import { Appointment, Consultation, PrescriptionItem } from '../../types';

export type ToothStatus = 'healthy' | 'caries' | 'filling' | 'crown' | 'missing' | 'implant' | 'root_canal';

export interface ToothRecord {
  toothNumber: number;
  status: ToothStatus;
}

interface ConsultationViewProps {
  appointmentId?: string;
  onComplete?: (record: Consultation) => void;
  onBack?: () => void;
}

export const ConsultationView: React.FC<ConsultationViewProps> = ({
  appointmentId,
  onComplete,
  onBack
}) => {
  const {
    appointments,
    patients,
    dentists,
    services,
    saveConsultation,
    consultations
  } = useDentalStore();

  // Find active appointment or pick the first In-Consultation / Waiting appointment
  const currentApt = appointmentId
    ? appointments.find((a) => a.id === appointmentId)
    : appointments.find((a) => a.status === 'In-Consultation') ||
      appointments.find((a) => a.status === 'Waiting');

  const patient = currentApt ? patients.find((p) => p.id === currentApt.patientId) : null;
  const dentist = currentApt ? dentists.find((d) => d.id === currentApt.dentistId) : null;
  const service = currentApt ? services.find((s) => s.id === currentApt.serviceId) : null;

  // Past consultation records for this patient
  const patientPastRecords = patient
    ? consultations.filter((c) => c.patientId === patient.id)
    : [];

  // Consultation Form State
  const [activeTab, setActiveTab] = useState<'exam' | 'chart' | 'rx' | 'history'>('exam');
  const [diagnosis, setDiagnosis] = useState<string>('Mild localized gingivitis and small occlusal fissure stain.');
  const [treatmentRendered, setTreatmentRendered] = useState<string>('Full mouth ultrasonic scaling, polishing, and topical fluoride varnish applied.');
  const [clinicalNotes, setClinicalNotes] = useState<string>('Patient tolerated procedure well. Reviewed interdental flossing techniques.');

  // Tooth Chart State
  const [selectedTooth, setSelectedTooth] = useState<number>(14);
  const [toothStatus, setToothStatus] = useState<ToothStatus>('filling');
  const [teethRecords, setTeethRecords] = useState<Record<number, ToothStatus>>({
    3: 'filling',
    14: 'filling',
    19: 'crown',
    30: 'caries'
  });

  // Prescriptions List
  const [prescriptions, setPrescriptions] = useState<Omit<PrescriptionItem, 'id'>[]>([
    {
      medication: 'Chlorhexidine Gluconate 0.12% Oral Rinse',
      dosage: '15 mL',
      frequency: 'Twice daily after meals',
      duration: '7 days',
      instructions: 'Swish for 30 seconds and expectorate. Do not swallow.'
    }
  ]);

  const [newRx, setNewRx] = useState<Omit<PrescriptionItem, 'id'>>({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  // Follow-up recommendation
  const [needsFollowUp, setNeedsFollowUp] = useState<boolean>(true);
  const [followUpInterval, setFollowUpInterval] = useState<string>('6 months');
  const [followUpReason, setFollowUpReason] = useState<string>('Routine 6-month preventive checkup and periodontal evaluation');

  const [completedRecord, setCompletedRecord] = useState<Consultation | null>(null);

  if (!currentApt || !patient) {
    return (
      <NeoCard className="p-12 text-center space-y-4">
        <Stethoscope className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Active Consultation in Operatory</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please select a waiting patient from the Reception Queue or Today's Appointments to start a consultation.
        </p>
        {onBack && (
          <NeoButton variant="primary" onClick={onBack}>
            View Waiting Queue
          </NeoButton>
        )}
      </NeoCard>
    );
  }

  const handleUpdateTooth = () => {
    setTeethRecords({
      ...teethRecords,
      [selectedTooth]: toothStatus
    });
  };

  const handleAddPrescription = () => {
    if (!newRx.medication.trim()) return;
    setPrescriptions([...prescriptions, { ...newRx }]);
    setNewRx({
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
  };

  const handleRemovePrescription = (idx: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  const handleFinalize = () => {
    const formattedRx: PrescriptionItem[] = prescriptions.map((p, idx) => ({
      id: `rx-${idx}-${Date.now()}`,
      medication: p.medication,
      dosage: p.dosage,
      frequency: p.frequency,
      duration: p.duration,
      instructions: p.instructions
    }));

    const timeframeWeeks = followUpInterval === '2 weeks' ? 2 : followUpInterval === '1 month' ? 4 : 26;

    const record = saveConsultation({
      appointmentId: currentApt.id,
      dentistId: currentApt.dentistId,
      patientId: currentApt.patientId,
      examinationFindings: clinicalNotes,
      diagnosis,
      treatmentPlan: treatmentRendered,
      proceduresPerformed: [service?.name || 'Dental Procedure', treatmentRendered],
      prescriptions: formattedRx,
      aftercareInstructions: clinicalNotes,
      followUpRecommendation: needsFollowUp
        ? {
            required: true,
            timeframeWeeks,
            notes: followUpReason
          }
        : undefined
    });

    setCompletedRecord(record);
    if (onComplete) onComplete(record);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Patient Clinical Bar Header */}
      <div className="neo-raised p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl neo-raised flex items-center justify-center text-blue-600 bg-blue-50 shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800">{patient.fullName}</h3>
              <NeoBadge variant="primary" size="sm">ID: {patient.patientNumber}</NeoBadge>
              {patient.medicalAlerts.length > 0 && (
                <NeoBadge variant="danger" size="sm">
                  Alert: {patient.medicalAlerts[0]}
                </NeoBadge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Service: <strong>{service?.name}</strong> • Attending: Dr. {dentist?.fullName} • Appt Ref #{currentApt.appointmentNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBack && (
            <NeoButton size="sm" variant="default" onClick={onBack}>
              Queue Roster
            </NeoButton>
          )}
          {!completedRecord && (
            <NeoButton
              size="sm"
              variant="primary"
              onClick={handleFinalize}
              icon={<Save className="w-4 h-4" />}
            >
              Complete Exam & Bill Front Desk
            </NeoButton>
          )}
        </div>
      </div>

      {completedRecord ? (
        <NeoCard className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl neo-raised mx-auto flex items-center justify-center text-emerald-600 bg-emerald-50">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Consultation Finished & Record Saved</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Clinical findings, odontogram condition status, and prescriptions have been added to patient's electronic chart.
            Status transitioned to <strong>Payment-Pending</strong> for front desk checkout.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            {onBack && (
              <NeoButton variant="primary" onClick={onBack}>
                Return to Operatory Queue
              </NeoButton>
            )}
          </div>
        </NeoCard>
      ) : (
        <>
          {/* Medical Caution Alert Banner */}
          {(patient.allergies.length > 0 || patient.medicalAlerts.length > 0) && (
            <div className="p-4 rounded-2xl neo-raised bg-amber-50/70 border-l-4 border-amber-500 flex items-start gap-3 text-xs text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Clinical Caution & Medical History:</span>
                <p className="mt-0.5 text-amber-800">
                  Known Allergies: <strong>{patient.allergies.join(', ') || 'None'}</strong> • Medical Conditions: <strong>{patient.medicalAlerts.join(', ') || 'None'}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Navigation Sub-Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 neo-inset-sm rounded-2xl">
            {[
              { id: 'exam', label: 'Examination & Procedure Notes' },
              { id: 'chart', label: 'Interactive Odontogram (Universal #1-32)' },
              { id: 'rx', label: `Prescriptions (${prescriptions.length})` },
              { id: 'history', label: `Prior Visits Archive (${patientPastRecords.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'neo-raised bg-[#E8EEF5] text-blue-700 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Examination & Notes */}
          {activeTab === 'exam' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NeoCard className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-300/40 pb-2">
                  Clinical Examination & Findings
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Diagnosis *
                    </label>
                    <textarea
                      rows={3}
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full p-3 text-xs rounded-xl neo-inset border-none outline-none focus:ring-2 focus:ring-blue-500 bg-[#E8EEF5] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Procedures & Treatment Rendered *
                    </label>
                    <textarea
                      rows={4}
                      value={treatmentRendered}
                      onChange={(e) => setTreatmentRendered(e.target.value)}
                      className="w-full p-3 text-xs rounded-xl neo-inset border-none outline-none focus:ring-2 focus:ring-blue-500 bg-[#E8EEF5] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Aftercare & Patient Instructions
                    </label>
                    <textarea
                      rows={3}
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      className="w-full p-3 text-xs rounded-xl neo-inset border-none outline-none focus:ring-2 focus:ring-blue-500 bg-[#E8EEF5] text-slate-800"
                    />
                  </div>
                </div>
              </NeoCard>

              {/* Follow-up recommendation */}
              <NeoCard className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-300/40 pb-2">
                  Follow-Up Recommendations
                </h4>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-xl neo-inset">
                    <input
                      type="checkbox"
                      id="needsFollowUp"
                      checked={needsFollowUp}
                      onChange={(e) => setNeedsFollowUp(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <label htmlFor="needsFollowUp" className="font-bold text-slate-800 cursor-pointer">
                      Recommend Follow-Up Visit for Patient
                    </label>
                  </div>

                  {needsFollowUp && (
                    <div className="space-y-3 pt-2">
                      <NeoSelect
                        label="Recommended Interval"
                        value={followUpInterval}
                        onChange={(e) => setFollowUpInterval(e.target.value)}
                      >
                        <option value="2 weeks">2 weeks (Post-op evaluation / Suture removal)</option>
                        <option value="1 month">1 month (Healing check / Crown placement)</option>
                        <option value="3 months">3 months (Periodontal maintenance)</option>
                        <option value="6 months">6 months (Standard preventive recall)</option>
                      </NeoSelect>

                      <NeoInput
                        label="Clinical Follow-Up Objective"
                        value={followUpReason}
                        onChange={(e) => setFollowUpReason(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="p-4 rounded-2xl neo-raised bg-blue-50/50 space-y-2 mt-4">
                    <span className="font-bold text-blue-900 block">Workflow Notice:</span>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      Upon finalizing this consultation, the patient will be routed to the front desk reception for billing settlement and automated follow-up scheduling.
                    </p>
                  </div>
                </div>
              </NeoCard>
            </div>
          )}

          {/* TAB 2: Interactive Odontogram */}
          {activeTab === 'chart' && (
            <NeoCard className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/40 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Universal Numbering System Odontogram (#1 - #32)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Select a tooth to record restorations, caries, crowns, or missing status.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-xl">
                    Selected: Tooth #{selectedTooth}
                  </span>
                </div>
              </div>

              {/* Upper Arch (1-16) */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Upper Arch (Maxillary 1-16)
                </span>
                <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 p-2 rounded-2xl neo-inset bg-[#EFF4FA]">
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((toothNum) => {
                    const status = teethRecords[toothNum] || 'healthy';
                    const isSelected = selectedTooth === toothNum;

                    let bgStyle = 'bg-white text-slate-700';
                    if (status === 'caries') bgStyle = 'bg-rose-500 text-white font-bold';
                    if (status === 'filling') bgStyle = 'bg-blue-500 text-white font-bold';
                    if (status === 'crown') bgStyle = 'bg-amber-400 text-slate-900 font-bold';
                    if (status === 'missing') bgStyle = 'bg-slate-300 text-slate-500 line-through';

                    return (
                      <button
                        key={toothNum}
                        onClick={() => setSelectedTooth(toothNum)}
                        className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'ring-2 ring-blue-600 scale-105 shadow-md z-10' : 'hover:scale-102'
                        } ${bgStyle}`}
                      >
                        <span className="text-[11px] font-black">{toothNum}</span>
                        <span className="text-[8px] uppercase tracking-tighter truncate max-w-[28px]">
                          {status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lower Arch (32-17) */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Lower Arch (Mandibular 32-17)
                </span>
                <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 p-2 rounded-2xl neo-inset bg-[#EFF4FA]">
                  {Array.from({ length: 16 }, (_, i) => 32 - i).map((toothNum) => {
                    const status = teethRecords[toothNum] || 'healthy';
                    const isSelected = selectedTooth === toothNum;

                    let bgStyle = 'bg-white text-slate-700';
                    if (status === 'caries') bgStyle = 'bg-rose-500 text-white font-bold';
                    if (status === 'filling') bgStyle = 'bg-blue-500 text-white font-bold';
                    if (status === 'crown') bgStyle = 'bg-amber-400 text-slate-900 font-bold';
                    if (status === 'missing') bgStyle = 'bg-slate-300 text-slate-500 line-through';

                    return (
                      <button
                        key={toothNum}
                        onClick={() => setSelectedTooth(toothNum)}
                        className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'ring-2 ring-blue-600 scale-105 shadow-md z-10' : 'hover:scale-102'
                        } ${bgStyle}`}
                      >
                        <span className="text-[11px] font-black">{toothNum}</span>
                        <span className="text-[8px] uppercase tracking-tighter truncate max-w-[28px]">
                          {status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tooth Condition Controller */}
              <div className="p-4 rounded-2xl neo-raised bg-[#E8EEF5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Tooth #{selectedTooth} Condition:</span>
                  {(['healthy', 'caries', 'filling', 'crown', 'missing', 'implant', 'root_canal'] as ToothStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => setToothStatus(st)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        toothStatus === st
                          ? 'neo-inset text-blue-700 font-black'
                          : 'neo-btn text-slate-600'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <NeoButton size="sm" variant="primary" onClick={handleUpdateTooth}>
                  Record on Chart
                </NeoButton>
              </div>
            </NeoCard>
          )}

          {/* TAB 3: Prescriptions */}
          {activeTab === 'rx' && (
            <NeoCard className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-300/40 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Electronic Dental Prescription (e-Rx)</h4>
                  <p className="text-xs text-slate-500">Add medications, dosage, intervals, and dispensing instructions.</p>
                </div>
              </div>

              {/* Add New Rx Form */}
              <div className="p-4 rounded-2xl neo-inset space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Prescribe New Medication
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <NeoInput
                    label="Medication Name *"
                    placeholder="e.g. Amoxicillin 500mg"
                    value={newRx.medication}
                    onChange={(e) => setNewRx({ ...newRx, medication: e.target.value })}
                  />
                  <NeoInput
                    label="Dosage"
                    placeholder="e.g. 1 capsule"
                    value={newRx.dosage}
                    onChange={(e) => setNewRx({ ...newRx, dosage: e.target.value })}
                  />
                  <NeoInput
                    label="Frequency"
                    placeholder="e.g. 3 times daily"
                    value={newRx.frequency}
                    onChange={(e) => setNewRx({ ...newRx, frequency: e.target.value })}
                  />
                  <NeoInput
                    label="Duration"
                    placeholder="e.g. 5 days"
                    value={newRx.duration}
                    onChange={(e) => setNewRx({ ...newRx, duration: e.target.value })}
                  />
                </div>
                <NeoInput
                  label="Instructions to Patient / Pharmacist"
                  placeholder="e.g. Take with food. Finish full antibiotic course."
                  value={newRx.instructions}
                  onChange={(e) => setNewRx({ ...newRx, instructions: e.target.value })}
                />
                <div className="flex justify-end">
                  <NeoButton
                    size="sm"
                    variant="primary"
                    onClick={handleAddPrescription}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Add to Prescription List
                  </NeoButton>
                </div>
              </div>

              {/* Current Prescriptions Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Active Prescriptions for this Visit ({prescriptions.length})
                </span>
                {prescriptions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 rounded-xl neo-inset text-center">
                    No medications prescribed for this appointment.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {prescriptions.map((rx, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl neo-raised bg-[#E8EEF5] flex items-start justify-between gap-4 text-xs">
                        <div>
                          <span className="font-extrabold text-blue-700 text-sm block">{rx.medication}</span>
                          <span className="text-slate-600">{rx.dosage} • {rx.frequency} • {rx.duration}</span>
                          {rx.instructions && (
                            <p className="text-slate-500 italic text-[11px] mt-0.5">"{rx.instructions}"</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemovePrescription(idx)}
                          className="p-1.5 rounded-xl neo-btn text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </NeoCard>
          )}

          {/* TAB 4: Patient Past History Archive */}
          {activeTab === 'history' && (
            <NeoCard className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 border-b border-slate-300/40 pb-2">
                Patient Clinical Archive & Prior Consultations
              </h4>
              {patientPastRecords.length === 0 ? (
                <div className="p-8 neo-inset rounded-2xl text-center text-xs text-slate-500">
                  No prior consultation records found in electronic archive.
                </div>
              ) : (
                <div className="space-y-3">
                  {patientPastRecords.map((rec) => (
                    <div key={rec.id} className="p-4 rounded-2xl neo-inset space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-300/30 pb-1.5">
                        <span className="font-bold text-blue-700">Record Ref: #{rec.appointmentId}</span>
                        <span className="text-slate-400">{new Date(rec.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-700"><strong>Diagnosis:</strong> {rec.diagnosis}</p>
                      <p className="text-slate-700"><strong>Treatment:</strong> {rec.treatmentPlan}</p>
                      {rec.prescriptions.length > 0 && (
                        <p className="text-slate-500">
                          <strong>Rx:</strong> {rec.prescriptions.map((p) => p.medication).join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </NeoCard>
          )}
        </>
      )}
    </div>
  );
};
