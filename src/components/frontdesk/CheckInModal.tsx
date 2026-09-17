import React, { useState } from 'react';
import { UserCheck, Search, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { NeoBadge } from '../common/NeoBadge';
import { useDentalStore } from '../../services/useDentalStore';
import { Appointment, Patient } from '../../types';
import { getTodayDateString } from '../../data/seedData';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (apt: Appointment) => void;
  preselectedAppointmentId?: string;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedAppointmentId
}) => {
  const { appointments, patients, dentists, services, updateAppointmentStatus, updatePatient } = useDentalStore();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(
    preselectedAppointmentId ? appointments.find((a) => a.id === preselectedAppointmentId) || null : null
  );

  const [idVerified, setIdVerified] = useState<boolean>(false);
  const [updatedAddress, setUpdatedAddress] = useState<string>('');
  const [updatedAllergies, setUpdatedAllergies] = useState<string>('');
  const [checkedInResult, setCheckedInResult] = useState<Appointment | null>(null);

  const today = getTodayDateString();

  // Find today's check-in eligible appointments (status Confirmed or Requested)
  const eligibleAppointments = appointments.filter((a) => {
    if (a.date !== today) return false;
    if (a.status !== 'Confirmed' && a.status !== 'Requested') return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const pat = patients.find((p) => p.id === a.patientId);
    return (
      a.appointmentNumber.toLowerCase().includes(term) ||
      pat?.fullName.toLowerCase().includes(term) ||
      pat?.patientNumber.toLowerCase().includes(term)
    );
  });

  const handleSelectAppointment = (apt: Appointment) => {
    setSelectedApt(apt);
    const pat = patients.find((p) => p.id === apt.patientId);
    if (pat) {
      setUpdatedAddress(pat.address);
      setUpdatedAllergies(pat.allergies.join(', '));
    }
  };

  const handleConfirmCheckIn = () => {
    if (!selectedApt || !idVerified) return;

    // Update patient if changed
    const pat = patients.find((p) => p.id === selectedApt.patientId);
    if (pat) {
      updatePatient(pat.id, {
        address: updatedAddress,
        allergies: updatedAllergies ? updatedAllergies.split(',').map((s) => s.trim()) : ['None declared']
      });
    }

    // Mark appointment as Checked-In (transitions to Waiting room queue)
    const updated = updateAppointmentStatus(selectedApt.id, 'Checked-In');
    if (updated) {
      setCheckedInResult(updated);
      if (onSuccess) onSuccess(updated);
    }
  };

  const handleClose = () => {
    setSelectedApt(null);
    setCheckedInResult(null);
    setIdVerified(false);
    onClose();
  };

  const patient = selectedApt ? patients.find((p) => p.id === selectedApt.patientId) : null;
  const dentist = selectedApt ? dentists.find((d) => d.id === selectedApt.dentistId) : null;
  const service = selectedApt ? services.find((s) => s.id === selectedApt.serviceId) : null;

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-blue-700">
          <UserCheck className="w-5 h-5" />
          <span>Appointment Day: Patient Arrival & Check-In</span>
        </div>
      }
      subtitle="Verify identity, update contact details, and assign queue number"
      maxWidth="xl"
    >
      {checkedInResult ? (
        <div className="space-y-4 py-2 text-center">
          <div className="w-16 h-16 rounded-3xl neo-raised mx-auto flex items-center justify-center text-emerald-600 bg-emerald-50">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-xl font-bold text-slate-800">Patient Checked In!</h4>
            <p className="text-xs text-slate-500">
              Assigned to Waiting Room with Queue Position:
            </p>
            <div className="inline-block px-6 py-2 rounded-2xl neo-inset bg-[#E8EEF5] text-blue-700 font-extrabold text-2xl my-2">
              Queue #{checkedInResult.queueNumber}
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Dentist {dentist?.fullName} has been notified that {patient?.fullName} has arrived and is waiting.
          </p>

          <div className="flex justify-center pt-2">
            <NeoButton variant="primary" onClick={handleClose}>
              Done & Return to Queue
            </NeoButton>
          </div>
        </div>
      ) : !selectedApt ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <NeoInput
              placeholder="Search by Patient Name, ID, or Appointment #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
              className="flex-1"
            />
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Today's Scheduled Arrivals ({eligibleAppointments.length})
            </p>
            {eligibleAppointments.length === 0 ? (
              <div className="p-8 neo-inset rounded-2xl text-center text-xs text-slate-500">
                No pending arrivals found for today matching query.
              </div>
            ) : (
              eligibleAppointments.map((apt) => {
                const pat = patients.find((p) => p.id === apt.patientId);
                const dent = dentists.find((d) => d.id === apt.dentistId);
                const serv = services.find((s) => s.id === apt.serviceId);

                return (
                  <div
                    key={apt.id}
                    onClick={() => handleSelectAppointment(apt)}
                    className="p-3.5 rounded-2xl neo-raised hover:bg-blue-50/40 cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">{pat?.fullName}</span>
                        <span className="text-[11px] text-slate-500">({pat?.patientNumber})</span>
                        {pat?.noShowCount ? (
                          <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md font-bold">
                            {pat.noShowCount} No-Show
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {serv?.name} • with {dent?.fullName}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-blue-700">{apt.startTime}</span>
                      <NeoBadge variant="neutral" size="sm" className="block mt-1">
                        Ref: {apt.appointmentNumber}
                      </NeoBadge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl neo-inset space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Appointment:</span>
              <span className="font-bold text-blue-700">
                #{selectedApt.appointmentNumber} ({selectedApt.startTime} - {selectedApt.endTime})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-slate-800">{patient?.fullName} ({patient?.patientNumber})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dentist & Service:</span>
              <span className="font-bold text-slate-800">{dentist?.fullName} — {service?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ID Reference on File:</span>
              <span className="font-bold text-slate-800">{patient?.identificationReference || 'None on file'}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Verify Identity & Update Information
            </h5>

            <label className="flex items-center gap-3 p-3 rounded-xl neo-raised cursor-pointer select-none bg-[#EBF1F8]">
              <input
                type="checkbox"
                checked={idVerified}
                onChange={(e) => setIdVerified(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800">Physical ID Verified</span>
                <p className="text-slate-500">Front desk staff verified photo ID or National/Insurance ID.</p>
              </div>
            </label>

            <NeoInput
              label="Confirm / Update Home Address"
              value={updatedAddress}
              onChange={(e) => setUpdatedAddress(e.target.value)}
            />

            <NeoInput
              label="Allergies (Verify with patient)"
              value={updatedAllergies}
              onChange={(e) => setUpdatedAllergies(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-300/40">
            <NeoButton variant="default" onClick={() => setSelectedApt(null)}>
              Change Patient
            </NeoButton>
            <NeoButton
              variant="primary"
              disabled={!idVerified}
              onClick={handleConfirmCheckIn}
            >
              Confirm Check-In & Issue Queue Ticket
            </NeoButton>
          </div>
        </div>
      )}
    </NeoModal>
  );
};
