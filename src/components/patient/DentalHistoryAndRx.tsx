import React, { useState } from 'react';
import {
  FileText, HeartPulse, Pill, Stethoscope, ChevronRight, Printer
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoBadge } from '../common/NeoBadge';
import { Consultation } from '../../types';
import { toothNames, defaultTeethConditions } from './patientUtils';

interface DentalHistoryAndRxProps {
  onStartBooking?: () => void;
}

export const DentalHistoryAndRx: React.FC<DentalHistoryAndRxProps> = ({
  onStartBooking,
}) => {
  const { consultations, dentists, currentPatient } = useDentalStore();

  const [selectedTooth, setSelectedTooth] = useState<number>(14);
  const [printFeedback, setPrintFeedback] = useState(false);

  if (!currentPatient) {
    return (
      <NeoCard className="p-8 text-center space-y-4">
        <p className="text-slate-600">Please select or register a patient profile.</p>
      </NeoCard>
    );
  }

  const myConsultations = consultations.filter((c) => c.patientId === currentPatient.id);

  const handlePrintRecords = () => {
    setPrintFeedback(true);
    setTimeout(() => {
      window.print();
      setPrintFeedback(false);
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neo-raised p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              Dental History & Prescriptions (Rx)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Clinical consultation records, interactive tooth odontogram (#1-32), treatment notes, and medication guidance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NeoButton
            variant="default"
            size="md"
            onClick={handlePrintRecords}
            icon={<Printer className="w-4 h-4 text-slate-600" />}
          >
            {printFeedback ? 'Preparing Print...' : 'Print Dental Summary'}
          </NeoButton>
        </div>
      </div>

      {/* Section 1: Interactive Odontogram Chart (#1 to #32) */}
      <NeoCard className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300/40 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-blue-600" /> Universal Numbering System Odontogram (#1 - #32)
            </h3>
            <p className="text-xs text-slate-500">
              Select any tooth to view its clinical findings, restorations, and dental record notes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-xl">
              Selected: Tooth #{selectedTooth}
            </span>
          </div>
        </div>

        {/* Upper Arch (Maxillary 1-16) */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
            Upper Arch (Maxillary Teeth 1 - 16)
          </span>
          <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 p-2 rounded-2xl neo-inset bg-[#EFF4FA]">
            {Array.from({ length: 16 }, (_, i) => i + 1).map((toothNum) => {
              const condition = defaultTeethConditions[toothNum] || { status: 'healthy' };
              const isSelected = selectedTooth === toothNum;

              let bgStyle = 'bg-white text-slate-700 border border-slate-200';
              if (condition.status === 'filling') bgStyle = 'bg-blue-600 text-white font-bold shadow-xs';
              if (condition.status === 'caries') bgStyle = 'bg-rose-500 text-white font-bold';
              if (condition.status === 'crown') bgStyle = 'bg-amber-400 text-slate-900 font-bold';
              if (condition.status === 'missing') bgStyle = 'bg-slate-300 text-slate-500 line-through';

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
                    {condition.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lower Arch (Mandibular 17-32) */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
            Lower Arch (Mandibular Teeth 17 - 32)
          </span>
          <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 p-2 rounded-2xl neo-inset bg-[#EFF4FA]">
            {Array.from({ length: 16 }, (_, i) => 32 - i).map((toothNum) => {
              const condition = defaultTeethConditions[toothNum] || { status: 'healthy' };
              const isSelected = selectedTooth === toothNum;

              let bgStyle = 'bg-white text-slate-700 border border-slate-200';
              if (condition.status === 'filling') bgStyle = 'bg-blue-600 text-white font-bold shadow-xs';
              if (condition.status === 'caries') bgStyle = 'bg-rose-500 text-white font-bold';
              if (condition.status === 'crown') bgStyle = 'bg-amber-400 text-slate-900 font-bold';
              if (condition.status === 'missing') bgStyle = 'bg-slate-300 text-slate-500 line-through';

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
                    {condition.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Odontogram Status Legend & Selected Tooth Detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-2xl neo-inset space-y-2 text-xs">
            <span className="font-bold text-slate-700 block">Tooth Legend:</span>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-white border border-slate-300" /> Healthy / Intact
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600" /> Restored Filling
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" /> Caries / Decay
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400" /> Crown
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-300" /> Missing
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl neo-raised bg-[#E8EEF5] text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                Tooth #{selectedTooth}: {toothNames[selectedTooth] || 'Molar'}
              </span>
              <NeoBadge
                variant={
                  defaultTeethConditions[selectedTooth]?.status === 'filling'
                    ? 'primary'
                    : 'success'
                }
                size="sm"
              >
                {(defaultTeethConditions[selectedTooth]?.status || 'healthy').toUpperCase()}
              </NeoBadge>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {defaultTeethConditions[selectedTooth]?.notes ||
                'Intact natural enamel, regular physiological alignment with no caries or active pathology detected.'}
            </p>
          </div>
        </div>
      </NeoCard>

      {/* Section 2: Prescriptions & Medication Schedule (Rx) */}
      <NeoCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-300/40 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" /> Prescribed Medications & Pharmacy Instructions (Rx)
            </h3>
            <p className="text-xs text-slate-500">
              Doctor-prescribed oral medications, dosages, administration schedule, and precautions.
            </p>
          </div>
        </div>

        {myConsultations.length === 0 || myConsultations.every((c) => !c.prescriptions?.length) ? (
          <div className="p-8 text-center text-xs text-slate-400 neo-inset rounded-2xl">
            No active or past prescriptions on file for your patient record.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myConsultations.flatMap((c) =>
              (c.prescriptions || []).map((rx) => (
                <div
                  key={rx.id}
                  className="p-4 rounded-2xl neo-raised bg-[#E8EEF5] space-y-2 text-xs border-l-4 border-emerald-500"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 text-sm">
                      {rx.medication}
                    </span>
                    <NeoBadge variant="success" size="sm">
                      {rx.dosage}
                    </NeoBadge>
                  </div>

                  <div className="space-y-1 text-slate-600">
                    <p>
                      <strong>Frequency:</strong> {rx.frequency}
                    </p>
                    <p>
                      <strong>Course Duration:</strong> {rx.duration}
                    </p>
                    <div className="p-2 rounded-xl neo-inset bg-[#EFF4FA] text-slate-700 italic text-[11px]">
                      "{rx.instructions}"
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-300/30 flex items-center justify-between">
                    <span>Prescribed by Attending DDS</span>
                    <span>Refills: As approved by clinic</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </NeoCard>

      {/* Section 3: Clinical Consultation History Timeline */}
      <NeoCard className="space-y-4">
        <div className="border-b border-slate-300/40 pb-3">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-600" /> Clinical Consultation History
          </h3>
          <p className="text-xs text-slate-500">
            Detailed clinical exam notes, verified diagnoses, and procedures documented by your dentists.
          </p>
        </div>

        {myConsultations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 neo-inset rounded-2xl">
            No clinical consultations completed yet.
          </div>
        ) : (
          <div className="space-y-4">
            {myConsultations.map((c) => {
              const dnt = dentists.find((d) => d.id === c.dentistId);
              return (
                <div key={c.id} className="p-5 rounded-2xl neo-inset space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300/30 pb-2">
                    <div>
                      <span className="font-extrabold text-sm text-slate-800">
                        Diagnosis: {c.diagnosis}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Examined by {dnt?.fullName || 'Dentist'} on {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <NeoBadge variant="info" size="sm">
                      Exam Completed
                    </NeoBadge>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="font-bold text-slate-700 block">Examination Findings:</span>
                      <p className="text-slate-600 mt-0.5">{c.examinationFindings}</p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block">Procedures Completed:</span>
                      <ul className="list-disc pl-5 text-slate-600 space-y-0.5 mt-0.5">
                        {c.proceduresPerformed.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    {c.aftercareInstructions && (
                      <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                        <strong>Aftercare Instructions:</strong> {c.aftercareInstructions}
                      </div>
                    )}

                    {c.followUpRecommendation?.required && (
                      <div className="text-[11px] text-slate-500">
                        <strong>Follow-Up:</strong> Recommended in {c.followUpRecommendation.timeframeWeeks} weeks ({c.followUpRecommendation.notes})
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </NeoCard>
    </div>
  );
};
