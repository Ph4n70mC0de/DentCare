import React, { useState } from 'react';
import {
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Siren,
  Eye,
  EyeOff,
  UserX,
  Stethoscope,
  ArrowRight,
  Volume2
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoBadge } from '../common/NeoBadge';
import { NeoStatusPill } from '../common/NeoStatusPill';
import { Appointment } from '../../types';
import { getTodayDateString } from '../../data/seedData';
import { NoShowModal } from '../exceptions/NoShowModal';
import { EmergencyModal } from '../exceptions/EmergencyModal';

interface WaitingRoomProps {
  onStartConsultation?: (appointmentId: string) => void;
  onOpenCheckIn?: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  onStartConsultation,
  onOpenCheckIn
}) => {
  const { appointments, patients, dentists, services, updateAppointmentStatus, sendNotification } = useDentalStore();
  const [privacyMode, setPrivacyMode] = useState<boolean>(false);
  const [selectedForNoShow, setSelectedForNoShow] = useState<Appointment | null>(null);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState<boolean>(false);

  const today = getTodayDateString();

  // Active queue appointments for today
  const queueAppointments = appointments
    .filter((a) => a.date === today && ['Waiting', 'In-Consultation', 'Checked-In', 'Emergency'].includes(a.status))
    .sort((a, b) => {
      // Emergency goes first (queue 0)
      if (a.status === 'Emergency') return -1;
      if (b.status === 'Emergency') return 1;
      // In-Consultation next
      if (a.status === 'In-Consultation' && b.status !== 'In-Consultation') return -1;
      if (b.status === 'In-Consultation' && a.status !== 'In-Consultation') return 1;
      // Then by queueNumber or time
      return (a.queueNumber || 99) - (b.queueNumber || 99);
    });

  const getDisplayName = (fullName: string) => {
    if (!privacyMode) return fullName;
    const parts = fullName.split(' ');
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}. ${parts[parts.length - 1]}`;
    }
    return fullName;
  };

  const handleCallPatient = (apt: Appointment) => {
    const pat = patients.find((p) => p.id === apt.patientId);
    const dent = dentists.find((d) => d.id === apt.dentistId);

    // Update status to In-Consultation
    updateAppointmentStatus(apt.id, 'In-Consultation');

    // Notify patient display / phone
    if (pat) {
      sendNotification({
        userId: pat.userId,
        patientId: pat.id,
        type: 'reminder',
        title: '🔔 Please Proceed to Operatory',
        message: `Queue #${apt.queueNumber}: Dr. ${dent?.fullName} is ready for you in Operatory Room.`,
        channel: 'in_app',
        relatedAppointmentId: apt.id
      });
    }

    if (onStartConsultation) {
      onStartConsultation(apt.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 neo-raised p-5 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-800">Waiting Room & Live Operatory Queue</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of seated patients, operatory status, and arrival calls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`neo-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              privacyMode ? 'neo-inset text-blue-700' : 'text-slate-600'
            }`}
          >
            {privacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{privacyMode ? 'Privacy Initials Mode' : 'Public Display Safe'}</span>
          </button>

          {onOpenCheckIn && (
            <NeoButton size="sm" variant="default" onClick={onOpenCheckIn}>
              <User className="w-3.5 h-3.5 mr-1" /> Check In Arrival
            </NeoButton>
          )}

          <NeoButton size="sm" variant="danger" onClick={() => setIsEmergencyOpen(true)}>
            <Siren className="w-3.5 h-3.5 mr-1" /> Emergency Triage
          </NeoButton>
        </div>
      </div>

      {/* Queue Grid / Table */}
      <NeoCard className="p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-300/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Active Queue Today ({queueAppointments.length})
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Synchronized
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Current Date: <strong>{today}</strong>
          </div>
        </div>

        {queueAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700">Waiting Room is Currently Clear</p>
            <p className="text-slate-400 max-w-xs mx-auto">
              Check in upcoming appointments from the today's schedule to place patients in the queue.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-300/30">
            {queueAppointments.map((apt) => {
              const patient = patients.find((p) => p.id === apt.patientId);
              const dentist = dentists.find((d) => d.id === apt.dentistId);
              const service = services.find((s) => s.id === apt.serviceId);

              const isInChair = apt.status === 'In-Consultation';
              const isEmergency = apt.status === 'Emergency';

              return (
                <div
                  key={apt.id}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    isEmergency
                      ? 'bg-rose-50/60 border-l-4 border-rose-600'
                      : isInChair
                      ? 'bg-purple-50/40 border-l-4 border-purple-500'
                      : 'hover:bg-slate-100/40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Queue Ticket Badge */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
                        isEmergency
                          ? 'bg-rose-600 text-white font-black shadow-md'
                          : isInChair
                          ? 'bg-purple-600 text-white font-black shadow-md'
                          : 'neo-raised text-blue-700 font-extrabold'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">
                        {isEmergency ? 'EMG' : 'QUEUE'}
                      </span>
                      <span className="text-base leading-none font-black">
                        #{apt.queueNumber ?? (isEmergency ? '0' : '—')}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm">
                          {getDisplayName(patient?.fullName || 'Patient')}
                        </h4>
                        <NeoStatusPill status={apt.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {service?.name} • Assigned to <strong>{dentist?.fullName}</strong>
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>Scheduled: {apt.startTime} - {apt.endTime}</span>
                        {apt.arrivedAt && (
                          <span>Arrived: {new Date(apt.arrivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        {patient?.medicalAlerts && patient.medicalAlerts.length > 0 && (
                          <span className="text-rose-600 font-bold bg-rose-100 px-1.5 py-0.2 rounded-md">
                            ⚠️ {patient.medicalAlerts[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {apt.status === 'Waiting' || apt.status === 'Checked-In' || apt.status === 'Emergency' ? (
                      <>
                        <button
                          onClick={() => setSelectedForNoShow(apt)}
                          className="neo-btn p-2 rounded-xl text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                          title="Mark as No-Show"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                        <NeoButton
                          size="sm"
                          variant="primary"
                          onClick={() => handleCallPatient(apt)}
                          icon={<Volume2 className="w-4 h-4" />}
                        >
                          Call to Operatory
                        </NeoButton>
                      </>
                    ) : isInChair ? (
                      <NeoButton
                        size="sm"
                        variant="default"
                        className="text-purple-700 font-bold"
                        onClick={() => onStartConsultation && onStartConsultation(apt.id)}
                        icon={<Stethoscope className="w-4 h-4" />}
                      >
                        In Dental Chair
                      </NeoButton>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </NeoCard>

      {/* Exception Modals */}
      <NoShowModal
        isOpen={!!selectedForNoShow}
        onClose={() => setSelectedForNoShow(null)}
        appointment={selectedForNoShow}
      />

      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
    </div>
  );
};
