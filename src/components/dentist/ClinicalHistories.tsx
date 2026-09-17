import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  User,
  FileText,
  Pill,
  Calendar,
  Clock,
  AlertCircle,
  ChevronRight,
  ClipboardList,
  Stethoscope,
  X
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { NeoSelect } from '../common/NeoSelect';
import { NeoBadge } from '../common/NeoBadge';
import { NeoStatusPill } from '../common/NeoStatusPill';
import { Patient, Consultation, Appointment } from '../../types';
import { getTodayDateString } from '../../data/seedData';

interface ClinicalHistoriesProps {
  onStartBooking?: (patientId?: string) => void;
  onStartConsultation?: (appointmentId: string) => void;
  onNavigateToOperatory?: () => void;
}

export const ClinicalHistories: React.FC<ClinicalHistoriesProps> = ({
  onStartBooking,
  onStartConsultation,
  onNavigateToOperatory
}) => {
  const {
    patients,
    dentists,
    appointments,
    consultations,
    activeUser,
    services
  } = useDentalStore();

  const today = getTodayDateString();
  const currentDentist = dentists.find((d) => d.userId === activeUser.id) || dentists[0];

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'recent' | 'chronic' | 'flagged'>('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = p.fullName.toLowerCase().includes(q);
          const matchesId = p.patientNumber.toLowerCase().includes(q);
          const matchesPhone = p.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''));
          const matchesEmail = p.email.toLowerCase().includes(q);
          if (!matchesName && !matchesId && !matchesPhone && !matchesEmail) {
            return false;
          }
        }

        if (filterCategory === 'recent') {
          const hasRecent = appointments.some(
            (a) => a.patientId === p.id && a.date >= today && !['Completed', 'Cancelled', 'No-Show'].includes(a.status)
          );
          if (!hasRecent) return false;
        }

        if (filterCategory === 'chronic') {
          const patientCons = consultations.filter((c) => c.patientId === p.id);
          if (patientCons.length < 2) return false;
        }

        if (filterCategory === 'flagged') {
          if (p.noShowCount === 0 && !p.requiresStaffReviewForBooking) return false;
        }

        return true;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [patients, searchQuery, filterCategory, appointments, consultations, today]);

  const selectedPatientConsultations = useMemo(() => {
    if (!selectedPatient) return [];
    return consultations
      .filter((c) => c.patientId === selectedPatient.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [consultations, selectedPatient]);

  const selectedPatientAppointments = useMemo(() => {
    if (!selectedPatient) return [];
    return appointments
      .filter((a) => a.patientId === selectedPatient.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [appointments, selectedPatient]);

  const getDentistName = (dentistId: string) => {
    const d = dentists.find((dent) => dent.id === dentistId);
    return d ? `Dr. ${d.fullName}` : 'Unknown Dentist';
  };

  const getServiceName = (serviceId: string) => {
    const s = services.find((svc) => svc.id === serviceId);
    return s?.name || 'Unknown Service';
  };

  const getAppointmentForConsultation = (appointmentId: string): Appointment | undefined => {
    return appointments.find((a) => a.id === appointmentId);
  };

  return (
    <div className="space-y-6">
      <div className="neo-raised p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl neo-raised overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">Clinical Histories</h2>
              <NeoBadge variant="primary">{currentDentist.specialization}</NeoBadge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review patient records, diagnoses, treatment plans, and consultation history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToOperatory && (
            <NeoButton
              variant="default"
              onClick={onNavigateToOperatory}
              icon={<Stethoscope className="w-4 h-4" />}
            >
              Back to Operatory
            </NeoButton>
          )}
          {onStartBooking && (
            <NeoButton
              variant="primary"
              onClick={() => onStartBooking()}
              icon={<User className="w-4 h-4" />}
            >
              New Patient
            </NeoButton>
          )}
        </div>
      </div>

      {selectedPatient ? (
        <div className="space-y-6">
          <NeoCard className="p-0 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-300/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center text-blue-600 font-bold">
                  {selectedPatient.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{selectedPatient.fullName}</h3>
                  <p className="text-xs text-slate-500">
                    ID: {selectedPatient.patientNumber} • {selectedPatient.phone} • {selectedPatient.email}
                  </p>
                </div>
              </div>
              <NeoButton
                size="sm"
                variant="default"
                onClick={() => setSelectedPatient(null)}
                icon={<X className="w-3.5 h-3.5" />}
              >
                Close
              </NeoButton>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl neo-inset">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Age / Gender</span>
                  <p className="font-bold text-slate-800 text-sm">
                    {selectedPatient.dateOfBirth ? `${new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()} years` : 'N/A'} • {selectedPatient.gender || 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-xl neo-inset">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Medical Alerts</span>
                  <p className="font-bold text-rose-700 text-sm">
                    {selectedPatient.medicalAlerts.length > 0 && !selectedPatient.medicalAlerts.includes('None declared')
                      ? selectedPatient.medicalAlerts.join(', ')
                      : 'None registered'}
                  </p>
                </div>
                <div className="p-3 rounded-xl neo-inset">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Known Allergies</span>
                  <p className="font-bold text-rose-700 text-sm">
                    {selectedPatient.allergies.join(', ') || 'None declared'}
                  </p>
                </div>
                <div className="p-3 rounded-xl neo-inset">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Visits</span>
                  <p className="font-bold text-slate-800 text-sm">{selectedPatientAppointments.length} appointments</p>
                </div>
              </div>

              {(selectedPatient.medicalAlerts.length > 0 || selectedPatient.allergies.length > 0) && (
                <div className="p-4 rounded-2xl neo-raised bg-amber-50/70 border-l-4 border-amber-500 flex items-start gap-3 text-xs text-amber-900">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Clinical Caution:</span>
                    <p className="mt-0.5 text-amber-800">
                      Allergies: <strong>{selectedPatient.allergies.join(', ') || 'None'}</strong> • Medical Conditions: <strong>{selectedPatient.medicalAlerts.join(', ') || 'None'}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </NeoCard>

          <NeoCard className="p-0 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-300/40">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Consultation History ({selectedPatientConsultations.length} records)
                </h3>
              </div>
            </div>

            {selectedPatientConsultations.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No consultation records found for this patient.
              </div>
            ) : (
              <div className="divide-y divide-slate-300/30">
                {selectedPatientConsultations.map((cons) => {
                  const apt = getAppointmentForConsultation(cons.appointmentId);
                  const dentist = dentists.find((d) => d.id === cons.dentistId);

                  return (
                    <div key={cons.id} className="p-4 sm:p-5 hover:bg-slate-100/50 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-blue-700">
                              {new Date(cons.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-xs text-slate-600">{getDentistName(cons.dentistId)}</span>
                            {apt && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="text-xs text-slate-600">{getServiceName(apt.serviceId)}</span>
                              </>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Diagnosis</span>
                              <p className="text-sm font-bold text-slate-800">{cons.diagnosis}</p>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Treatment Plan</span>
                              <p className="text-xs text-slate-700">{cons.treatmentPlan}</p>
                            </div>
                            {cons.examinationFindings && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Examination Findings</span>
                                <p className="text-xs text-slate-600">{cons.examinationFindings}</p>
                              </div>
                            )}
                            {cons.prescriptions.length > 0 && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Prescriptions</span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {cons.prescriptions.map((rx, idx) => (
                                    <span key={idx} className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold flex items-center gap-1">
                                      <Pill className="w-3 h-3" />
                                      {rx.medication}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {cons.followUpRecommendation?.required && (
                              <div className="p-2 rounded-lg neo-inset">
                                <span className="text-[10px] uppercase font-bold text-blue-700 block">Follow-Up</span>
                                <p className="text-xs text-slate-700">
                                  {cons.followUpRecommendation.timeframeWeeks} weeks • {cons.followUpRecommendation.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </NeoCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <NeoCard className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">Patient Search</h3>
              </div>

              <NeoInput
                placeholder="Search by name, ID, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />

              <NeoSelect
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
              >
                <option value="all">All Patients</option>
                <option value="recent">Recent Visits</option>
                <option value="chronic">Chronic Cases</option>
                <option value="flagged">Flagged Records</option>
              </NeoSelect>

              <div className="text-xs text-slate-500 font-semibold">
                {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
              </div>
            </NeoCard>
          </div>

          <div className="lg:col-span-2">
            <NeoCard className="p-0 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-300/40">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">Patient Records</h3>
                </div>
              </div>

              {filteredPatients.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No patients match your search criteria.
                </div>
              ) : (
                <div className="divide-y divide-slate-300/30 max-h-[600px] overflow-y-auto">
                  {filteredPatients.map((patient) => {
                    const patientCons = consultations.filter((c) => c.patientId === patient.id);
                    const lastVisit = patientCons.length > 0
                      ? new Date(patientCons[patientCons.length - 1].createdAt).toLocaleDateString()
                      : 'No visits';

                    return (
                      <div
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-100/50 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center text-blue-600 font-bold shrink-0">
                            {patient.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-800">{patient.fullName}</h4>
                              <NeoStatusPill status={patient.status === 'active' ? 'Confirmed' : 'Pending'} size="sm" />
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              ID: {patient.patientNumber} • {patient.phone}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400">Last visit:</span>
                              <span className="text-[10px] font-bold text-slate-600">{lastVisit}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-[10px] text-slate-500">{patientCons.length} consultations</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {patient.medicalAlerts.length > 0 && patient.medicalAlerts[0] !== 'None declared' && (
                            <NeoBadge variant="danger" size="sm">Alert</NeoBadge>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </NeoCard>
          </div>
        </div>
      )}
    </div>
  );
};
