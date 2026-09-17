import React from 'react';
import {
  Stethoscope,
  Clock,
  User,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileText,
  Activity,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoStatusPill } from '../common/NeoStatusPill';
import { NeoBadge } from '../common/NeoBadge';
import { Appointment } from '../../types';
import { getTodayDateString } from '../../data/seedData';

interface OperatoryAndScheduleProps {
  onStartConsultation: (appointmentId: string) => void;
}

export const OperatoryAndSchedule: React.FC<OperatoryAndScheduleProps> = ({
  onStartConsultation
}) => {
  const {
    activeUser,
    dentists,
    appointments,
    patients,
    services,
    updateAppointmentStatus
  } = useDentalStore();

  const today = getTodayDateString();

  const currentDentist = dentists.find((d) => d.userId === activeUser.id) || dentists[0];

  const myTodayApts = appointments
    .filter((a) => a.dentistId === currentDentist.id && a.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const activeInChair = myTodayApts.find((a) => a.status === 'In-Consultation');
  const nextWaiting = myTodayApts.find((a) => a.status === 'Waiting' || a.status === 'Emergency');

  const activePatient = activeInChair ? patients.find((p) => p.id === activeInChair.patientId) : null;
  const activeService = activeInChair ? services.find((s) => s.id === activeInChair.serviceId) : null;

  const handleCallToChair = (apt: Appointment) => {
    updateAppointmentStatus(apt.id, 'In-Consultation');
    onStartConsultation(apt.id);
  };

  return (
    <div className="space-y-6">
      <div className="neo-raised p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl neo-raised overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center">
            {currentDentist.avatarUrl ? (
              <img src={currentDentist.avatarUrl} alt={currentDentist.fullName} className="w-full h-full object-cover" />
            ) : (
              <Stethoscope className="w-7 h-7 text-blue-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">{currentDentist.fullName}</h2>
              <NeoBadge variant="primary">{currentDentist.specialization}</NeoBadge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              License: {currentDentist.licenseReference} • Operatory Chair 1 • Today's Schedule: {today}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="neo-inset px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operatory Available</span>
          </div>
        </div>
      </div>

      {activeInChair && activePatient ? (
        <NeoCard className="p-6 border-2 border-purple-500/40 relative overflow-hidden bg-[#EFF3F9]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-md">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  Currently in Dental Chair
                </span>
                <h3 className="text-xl font-extrabold text-slate-800 mt-1">
                  {activePatient.fullName}
                </h3>
                <p className="text-xs text-slate-600">
                  {activeService?.name} • Record #{activePatient.patientNumber}
                </p>
              </div>
            </div>

            <NeoButton
              variant="primary"
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => onStartConsultation(activeInChair.id)}
              icon={<FileText className="w-4 h-4" />}
            >
              Open Active Consultation
            </NeoButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
            <div className="p-3 rounded-xl neo-inset">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Medical Alerts</span>
              <p className="font-bold text-rose-700">
                {activePatient.medicalAlerts.length > 0 ? activePatient.medicalAlerts.join(', ') : 'None registered'}
              </p>
            </div>
            <div className="p-3 rounded-xl neo-inset">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Known Allergies</span>
              <p className="font-bold text-rose-700">
                {activePatient.allergies.join(', ') || 'None declared'}
              </p>
            </div>
            <div className="p-3 rounded-xl neo-inset">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Appt Time</span>
              <p className="font-bold text-slate-800">
                {activeInChair.startTime} - {activeInChair.endTime}
              </p>
            </div>
          </div>
        </NeoCard>
      ) : nextWaiting ? (
        <NeoCard className="p-5 border-2 border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center text-indigo-600 font-bold">
              #{nextWaiting.queueNumber || '1'}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-600">Next Patient in Waiting Room</span>
              <h4 className="text-base font-bold text-slate-800">
                {patients.find((p) => p.id === nextWaiting.patientId)?.fullName}
              </h4>
              <p className="text-xs text-slate-500">
                {services.find((s) => s.id === nextWaiting.serviceId)?.name} • Scheduled {nextWaiting.startTime}
              </p>
            </div>
          </div>

          <NeoButton
            variant="primary"
            onClick={() => handleCallToChair(nextWaiting)}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Call to Dental Chair
          </NeoButton>
        </NeoCard>
      ) : null}

      <NeoCard className="p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-300/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Today's Operatory Roster ({myTodayApts.length} appointments)
            </h3>
          </div>
          <span className="text-xs text-slate-500">{today}</span>
        </div>

        {myTodayApts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No appointments scheduled for your operatory today.
          </div>
        ) : (
          <div className="divide-y divide-slate-300/30">
            {myTodayApts.map((apt) => {
              const patient = patients.find((p) => p.id === apt.patientId);
              const service = services.find((s) => s.id === apt.serviceId);

              return (
                <div
                  key={apt.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-100/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center shrink-0 w-16">
                      <span className="font-extrabold text-xs text-slate-900 block">{apt.startTime}</span>
                      <span className="text-[10px] text-slate-400">{apt.endTime}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-800">{patient?.fullName}</h4>
                        <NeoStatusPill status={apt.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {service?.name} ({service?.durationMinutes} mins)
                      </p>
                      {patient?.allergies && patient.allergies.length > 0 && patient.allergies[0] !== 'None declared' && (
                        <span className="text-[10px] text-rose-700 font-semibold block mt-0.5">
                          ⚠️ Allergy Alert: {patient.allergies.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {apt.status === 'Waiting' || apt.status === 'Emergency' ? (
                      <NeoButton
                        size="sm"
                        variant="primary"
                        onClick={() => handleCallToChair(apt)}
                      >
                        Call to Chair
                      </NeoButton>
                    ) : apt.status === 'In-Consultation' ? (
                      <NeoButton
                        size="sm"
                        variant="default"
                        className="text-purple-700 font-bold"
                        onClick={() => onStartConsultation(apt.id)}
                      >
                        Continue Exam
                      </NeoButton>
                    ) : apt.status === 'Completed' ? (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Finished
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">
                        {apt.status}
                      </span>
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
