import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CalendarCheck,
  ShieldCheck,
  Info,
  Phone,
  Mail,
  HeartPulse,
  Share2,
  UserCheck
} from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoInput } from '../common/NeoInput';
import { NeoSelect } from '../common/NeoSelect';
import { NeoBadge } from '../common/NeoBadge';
import { DentalService, Dentist, Patient, Appointment, BookingSource } from '../../types';
import { getTodayDateString, getOffsetDateString } from '../../data/seedData';

interface BookingWizardProps {
  onCompleted?: (appointment: Appointment) => void;
  onCancel?: () => void;
  onViewAppointments?: () => void;
  initialServiceId?: string;
  initialDentistId?: string;
  initialPatientId?: string;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  onCompleted,
  onCancel,
  onViewAppointments,
  initialServiceId,
  initialDentistId,
  initialPatientId
}) => {
  const {
    patients,
    dentists,
    services,
    settings,
    registerPatient,
    createAppointment,
    joinWaitlist,
    getAvailableSlotsForDate,
    getAlternativeDates,
    currentPatient,
    activeUser,
    confirmPatientBookingEligibility
  } = useDentalStore();

  const preselectedPat = initialPatientId
    ? patients.find((p) => p.id === initialPatientId) || currentPatient
    : currentPatient;

  // Wizard Steps: 1: Patient Status -> 2: Patient Info -> 3: Select Service -> 4: Select Dentist -> 5: Date & Time -> 6: Review -> 7: Confirmation
  const [step, setStep] = useState<number>(preselectedPat ? 3 : 1);

  // Form State
  const [isReturning, setIsReturning] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(preselectedPat ? preselectedPat.email : '');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(preselectedPat || null);
  const [bookingSource, setBookingSource] = useState<BookingSource>(activeUser.role === 'patient' ? 'app' : 'phone_call');

  // New Patient Registration Fields
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '1995-05-15',
    sex: 'Male' as 'Male' | 'Female' | 'Other',
    address: '',
    identificationReference: '',
    emergencyName: '',
    emergencyRelationship: 'Family',
    emergencyPhone: '',
    allergies: '',
    medicalAlerts: ''
  });

  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId || services[0]?.id || '');
  const [selectedDentistId, setSelectedDentistId] = useState<string>(initialDentistId || dentists[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(getOffsetDateString(1));
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [patientNotes, setPatientNotes] = useState<string>('');

  // Waitlist Fallback State
  const [showWaitlistOption, setShowWaitlistOption] = useState<boolean>(false);
  const [waitlistTimeRange, setWaitlistTimeRange] = useState<'morning' | 'afternoon' | 'any'>('any');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState<boolean>(false);

  // Completed appointment
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Errors
  const [errorMsg, setErrorMsg] = useState<string>('');

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];
  const selectedDentist = dentists.find((d) => d.id === selectedDentistId) || dentists[0];

  // Dynamic slot availability calculation
  const availableSlots = selectedDentistId && selectedDate && selectedService
    ? getAvailableSlotsForDate(selectedDentistId, selectedDate, selectedService.durationMinutes)
    : [];

  const freeSlotsCount = availableSlots.filter((s) => s.available).length;
  const alternativeDates = freeSlotsCount === 0 && selectedDentistId && selectedService
    ? getAlternativeDates(selectedDentistId, selectedDate, selectedService.durationMinutes, 3)
    : [];

  // Lookup returning patient
  const handleLookupPatient = () => {
    setErrorMsg('');
    if (!searchQuery.trim()) {
      setErrorMsg('Please enter an email, phone number, or patient ID to search.');
      return;
    }
    const term = searchQuery.trim().toLowerCase();
    const found = patients.find(
      (p) =>
        p.email.toLowerCase().includes(term) ||
        p.phone.replace(/\D/g, '').includes(term.replace(/\D/g, '')) ||
        p.patientNumber.toLowerCase().includes(term)
    );

    if (found) {
      if (found.requiresStaffReviewForBooking) {
        setErrorMsg(`Notice: Record #${found.patientNumber} has ${found.noShowCount} recorded no-shows. Clinic policy requires front-desk confirmation before the next booking can be finalized.`);
      }
      setSelectedPatient(found);
      setStep(3); // Proceed directly to service selection!
    } else {
      setErrorMsg('No existing patient record found with that information. Please register as a new patient.');
    }
  };

  // Register new patient
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!regForm.fullName || !regForm.phone || !regForm.email) {
      setErrorMsg('Please complete all required fields (Full Name, Phone, Email).');
      return;
    }

    try {
      const newPat = registerPatient({
        fullName: regForm.fullName.trim(),
        email: regForm.email.trim(),
        phone: regForm.phone.trim(),
        dateOfBirth: regForm.dateOfBirth,
        sex: regForm.sex,
        address: regForm.address || 'Metro Area',
        identificationReference: regForm.identificationReference || `ID-${Math.floor(100000 + Math.random() * 900000)}`,
        emergencyContact: {
          name: regForm.emergencyName || 'Primary Contact',
          relationship: regForm.emergencyRelationship,
          phone: regForm.emergencyPhone || regForm.phone
        },
        allergies: regForm.allergies ? regForm.allergies.split(',').map((s) => s.trim()) : ['None declared'],
        medicalAlerts: regForm.medicalAlerts ? regForm.medicalAlerts.split(',').map((s) => s.trim()) : []
      });

      setSelectedPatient(newPat);
      setStep(3); // Continue directly to service selection
    } catch (err: unknown) {
      setErrorMsg('Registration failed. Please check your details.');
    }
  };

  // Confirm booking
  const handleConfirmBooking = () => {
    if (!selectedPatient || !selectedDentistId || !selectedServiceId || !selectedDate || !selectedTime) {
      setErrorMsg('Missing required booking details. Please verify all steps.');
      return;
    }
    if (selectedPatient.requiresStaffReviewForBooking) {
      setErrorMsg('This patient requires staff confirmation before the next booking can be finalized.');
      return;
    }

    try {
      const apt = createAppointment({
        patientId: selectedPatient.id,
        dentistId: selectedDentistId,
        serviceId: selectedServiceId,
        date: selectedDate,
        startTime: selectedTime,
        notes: patientNotes,
        bookingSource
      });

      setConfirmedAppointment(apt);
      setStep(7); // Final confirmation step
      if (onCompleted) {
        onCompleted(apt);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Booking could not be finalized.');
    }
  };

  // Join waitlist handler
  const handleJoinWaitlist = () => {
    if (!selectedPatient || !selectedServiceId) return;

    joinWaitlist({
      patientId: selectedPatient.id,
      preferredDentistId: selectedDentistId,
      serviceId: selectedServiceId,
      preferredDate: selectedDate,
      preferredTimeRange: waitlistTimeRange,
      priority: 'normal',
      notes: `Joined waitlist via booking wizard for ${selectedDate}`
    });

    setWaitlistSubmitted(true);
  };

  // Add to Calendar helper
  const handleAddToCalendar = () => {
    if (!confirmedAppointment) return;
    const title = `DentCare: ${selectedService.name}`;
    const details = `Appointment #${confirmedAppointment.appointmentNumber} with ${selectedDentist.fullName} at ${settings.clinicName}.`;
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:${details}
LOCATION:${settings.clinicAddress}
DTSTART:${confirmedAppointment.date.replace(/-/g, '')}T${confirmedAppointment.startTime.replace(':', '')}00
DTEND:${confirmedAppointment.date.replace(/-/g, '')}T${confirmedAppointment.endTime.replace(':', '')}00
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DentCare-${confirmedAppointment.appointmentNumber}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Stepper Header */}
      <div className="neo-raised p-4 sm:p-6 rounded-3xl">
        <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2 text-xs font-bold text-slate-500">
          {[
            { num: 1, label: 'Patient Status' },
            { num: 2, label: 'Registration' },
            { num: 3, label: 'Select Service' },
            { num: 4, label: 'Dentist' },
            { num: 5, label: 'Date & Time' },
            { num: 6, label: 'Review' },
            { num: 7, label: 'Confirmed' }
          ].map((s) => {
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div
                key={s.num}
                className={`flex items-center gap-2 shrink-0 ${
                  isCurrent ? 'text-blue-700 font-extrabold' : isDone ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs transition-all ${
                    isCurrent
                      ? 'neo-inset text-blue-700 font-black'
                      : isDone
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'neo-raised text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
                {s.num < 7 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden md:block" />}
              </div>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="neo-inset p-4 rounded-2xl border-l-4 border-amber-500 text-amber-900 text-xs font-semibold flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {/* STEP 1: Patient Status (New vs Returning) */}
      {step === 1 && (
        <NeoCard className="space-y-6">
          <div className="border-b border-slate-300/40 pb-4">
            <h3 className="text-xl font-bold text-slate-800">Step 1: Patient Status</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you a new patient or returning to DentCare?
            </p>
            <div className="mt-4 max-w-sm">
              <NeoSelect
                label="Appointment Request Channel"
                value={bookingSource}
                onChange={(e) => setBookingSource(e.target.value as BookingSource)}
              >
                <option value="online_form">Online Form</option>
                <option value="phone_call">Phone / Call</option>
                <option value="app">Mobile / App</option>
                <option value="walk_in">Walk-In</option>
              </NeoSelect>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setIsReturning(true)}
              className={`p-6 rounded-3xl cursor-pointer transition-all ${
                isReturning
                  ? 'neo-inset border-2 border-blue-500/40 bg-[#E8EEF5]'
                  : 'neo-raised hover:-translate-y-0.5'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl neo-raised flex items-center justify-center text-blue-600 mb-4 bg-blue-50">
                <UserCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">Returning Patient</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                I have visited before. Pull up my existing medical history, dental records, and profile.
              </p>
            </div>

            <div
              onClick={() => setIsReturning(false)}
              className={`p-6 rounded-3xl cursor-pointer transition-all ${
                !isReturning
                  ? 'neo-inset border-2 border-blue-500/40 bg-[#E8EEF5]'
                  : 'neo-raised hover:-translate-y-0.5'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl neo-raised flex items-center justify-center text-emerald-600 mb-4 bg-emerald-50">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">New Patient</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                First time at DentCare. Register my details, emergency contact, and medical alerts.
              </p>
            </div>
          </div>

          {selectedPatient?.requiresStaffReviewForBooking && (
            <div className="neo-raised p-4 rounded-2xl border-l-4 border-rose-500 bg-rose-50/70 space-y-3">
              <div>
                <p className="text-sm font-extrabold text-rose-900">Staff confirmation required before the next booking</p>
                <p className="text-xs text-rose-800 mt-1">This patient has a recorded no-show. The flowchart requires front-desk confirmation before another appointment can be booked.</p>
              </div>
              {['front_desk', 'admin'].includes(activeUser.role) ? (
                <NeoButton
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    const approved = confirmPatientBookingEligibility(selectedPatient.id);
                    if (approved) setSelectedPatient(approved);
                  }}
                >
                  Confirm Next Booking Eligibility
                </NeoButton>
              ) : (
                <p className="text-xs font-bold text-rose-700">Please contact the front desk to confirm eligibility before booking.</p>
              )}
            </div>
          )}

          {/* Active Profile Quick Resume */}
          {selectedPatient && isReturning && (
            <div className="neo-raised p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl neo-raised flex items-center justify-center text-blue-600 bg-white shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{selectedPatient.fullName}</span>
                    <NeoBadge variant="primary" size="sm">Active Profile</NeoBadge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Record ID: {selectedPatient.patientNumber} • {selectedPatient.email} • {selectedPatient.phone}
                  </p>
                </div>
              </div>
              <NeoButton
                variant="primary"
                size="sm"
                onClick={() => setStep(3)}
              >
                Continue as {selectedPatient.fullName.split(' ')[0]} <ChevronRight className="w-4 h-4 ml-1" />
              </NeoButton>
            </div>
          )}

          {isReturning ? (
            <div className="neo-inset p-5 rounded-2xl space-y-3">
              <h5 className="text-xs font-bold text-slate-700">
                {selectedPatient ? 'Or Search For Another Patient Record' : 'Find Your Patient Record'}
              </h5>
              <div className="flex flex-col sm:flex-row gap-3">
                <NeoInput
                  placeholder="Enter email, phone number, or Patient ID (e.g. james.wilson@example.com)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookupPatient()}
                  className="flex-1"
                />
                <NeoButton variant="primary" onClick={handleLookupPatient}>
                  Search & Pull Record
                </NeoButton>
              </div>
              <p className="text-[11px] text-slate-500">
                💡 Demo quick test: Search <strong>james.wilson@example.com</strong> or <strong>emily.chen@example.com</strong>
              </p>
            </div>
          ) : (
            <div className="flex justify-end pt-2">
              <NeoButton variant="primary" onClick={() => setStep(2)}>
                Continue to Registration <ChevronRight className="w-4 h-4 ml-1" />
              </NeoButton>
            </div>
          )}
        </NeoCard>
      )}

      {/* STEP 2: Registration (for New Patients) */}
      {step === 2 && (
        <NeoCard className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Step 2: New Patient Registration</h3>
              <p className="text-xs text-slate-500 mt-1">
                Please enter your basic information, emergency contact, and medical alerts.
              </p>
            </div>
            <NeoButton size="sm" variant="default" onClick={() => setStep(1)}>
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back
            </NeoButton>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NeoInput
                label="Full Name *"
                placeholder="e.g. Eleanor Vance"
                value={regForm.fullName}
                onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                required
              />
              <NeoInput
                label="Contact Number *"
                placeholder="e.g. +1 (555) 234-5678"
                value={regForm.phone}
                onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                required
              />
              <NeoInput
                label="Email Address *"
                type="email"
                placeholder="e.g. eleanor@example.com"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <NeoInput
                  label="Date of Birth"
                  type="date"
                  value={regForm.dateOfBirth}
                  onChange={(e) => setRegForm({ ...regForm, dateOfBirth: e.target.value })}
                />
                <NeoSelect
                  label="Biological Sex"
                  value={regForm.sex}
                  onChange={(e) => setRegForm({ ...regForm, sex: e.target.value as 'Male' | 'Female' | 'Other' })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </NeoSelect>
              </div>
              <NeoInput
                label="Home Address"
                placeholder="Street, City, Postal Code"
                value={regForm.address}
                onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
              />
              <NeoInput
                label="Government ID / Reference #"
                placeholder="e.g. ID-482-19-002"
                value={regForm.identificationReference}
                onChange={(e) => setRegForm({ ...regForm, identificationReference: e.target.value })}
              />
            </div>

            <div className="p-4 rounded-2xl neo-inset space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Emergency Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <NeoInput
                  placeholder="Contact Name"
                  value={regForm.emergencyName}
                  onChange={(e) => setRegForm({ ...regForm, emergencyName: e.target.value })}
                />
                <NeoInput
                  placeholder="Relationship (e.g. Spouse)"
                  value={regForm.emergencyRelationship}
                  onChange={(e) => setRegForm({ ...regForm, emergencyRelationship: e.target.value })}
                />
                <NeoInput
                  placeholder="Emergency Phone"
                  value={regForm.emergencyPhone}
                  onChange={(e) => setRegForm({ ...regForm, emergencyPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NeoInput
                label="Known Allergies (comma separated)"
                placeholder="e.g. Penicillin, Latex, Aspirin"
                value={regForm.allergies}
                onChange={(e) => setRegForm({ ...regForm, allergies: e.target.value })}
              />
              <NeoInput
                label="Medical Alerts (High BP, Diabetes, etc.)"
                placeholder="e.g. Asthma, Pacemaker"
                value={regForm.medicalAlerts}
                onChange={(e) => setRegForm({ ...regForm, medicalAlerts: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-300/40">
              <NeoButton type="button" variant="default" onClick={() => setStep(1)}>
                Cancel
              </NeoButton>
              <NeoButton type="submit" variant="primary">
                Save & Proceed to Services <ChevronRight className="w-4 h-4 ml-1" />
              </NeoButton>
            </div>
          </form>
        </NeoCard>
      )}

      {/* STEP 3: Select Dental Service */}
      {step === 3 && (
        <NeoCard className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-800">Step 3: Select Dental Service</h3>
                {selectedPatient && (
                  <NeoBadge variant="primary">
                    Patient: {selectedPatient.fullName}
                  </NeoBadge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Choose the required treatment, checkup, or consultation.
              </p>
            </div>
            <NeoButton size="sm" variant="default" onClick={() => setStep(1)}>
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Patient
            </NeoButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.filter((s) => s.active).map((service) => {
              const isSelected = selectedServiceId === service.id;
              return (
                <div
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`p-5 rounded-3xl cursor-pointer transition-all ${
                    isSelected
                      ? 'neo-inset border-2 border-blue-500/50 bg-[#E8EEF5]'
                      : 'neo-raised hover:-translate-y-1'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-2xl ${isSelected ? 'bg-blue-600 text-white' : 'neo-raised text-blue-600'}`}>
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{service.name}</h4>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {service.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold text-blue-700">₱{service.price}</span>
                      <p className="text-[10px] text-slate-400 font-semibold">{service.durationMinutes} mins</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-300/40">
            <NeoButton variant="default" onClick={() => setStep(1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </NeoButton>
            <NeoButton variant="primary" onClick={() => setStep(4)}>
              Select Dentist <ChevronRight className="w-4 h-4 ml-1" />
            </NeoButton>
          </div>
        </NeoCard>
      )}

      {/* STEP 4: Select Dentist */}
      {step === 4 && (
        <NeoCard className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Step 4: Select Dentist</h3>
              <p className="text-xs text-slate-500 mt-1">
                Choose your practitioner or select the specialist recommended for {selectedService.name}.
              </p>
            </div>
            <NeoButton size="sm" variant="default" onClick={() => setStep(3)}>
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Services
            </NeoButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dentists.map((dentist) => {
              const isSelected = selectedDentistId === dentist.id;
              return (
                <div
                  key={dentist.id}
                  onClick={() => setSelectedDentistId(dentist.id)}
                  className={`p-5 rounded-3xl cursor-pointer transition-all flex items-start gap-4 ${
                    isSelected
                      ? 'neo-inset border-2 border-blue-500/50 bg-[#E8EEF5]'
                      : 'neo-raised hover:-translate-y-1'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl neo-raised overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center">
                    {dentist.avatarUrl ? (
                      <img src={dentist.avatarUrl} alt={dentist.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{dentist.fullName}</h4>
                      <NeoBadge variant="success" size="sm">Available</NeoBadge>
                    </div>
                    <p className="text-xs font-semibold text-blue-700 mt-0.5">{dentist.specialization}</p>
                    <p className="text-[11px] text-slate-500 mt-1">License: {dentist.licenseReference}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-300/40">
            <NeoButton variant="default" onClick={() => setStep(3)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </NeoButton>
            <NeoButton variant="primary" onClick={() => setStep(5)}>
              Choose Date & Time <ChevronRight className="w-4 h-4 ml-1" />
            </NeoButton>
          </div>
        </NeoCard>
      )}

      {/* STEP 5: Date & Real-Time Slot Availability Engine */}
      {step === 5 && (
        <NeoCard className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Step 5: Real-Time Availability</h3>
              <p className="text-xs text-slate-500 mt-1">
                Checking schedule for {selectedDentist.fullName} ({selectedService.durationMinutes} min procedure).
              </p>
            </div>
            <NeoButton size="sm" variant="default" onClick={() => setStep(4)}>
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Dentist
            </NeoButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Date Picker */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Select Date
              </label>
              <NeoInput
                type="date"
                min={getTodayDateString()}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime('');
                  setShowWaitlistOption(false);
                }}
              />
              <div className="p-3 rounded-2xl neo-inset text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Clinic Working Hours</span>
                </div>
                <p>Monday - Saturday: 08:30 - 17:30</p>
                <p>Break: 12:30 - 13:30 (Reserved)</p>
              </div>
            </div>

            {/* Time Slot Chips */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Available Slots for {selectedDate}
                </label>
                <span className="text-xs font-semibold text-slate-500">
                  {freeSlotsCount} slots open
                </span>
              </div>

              {availableSlots.length === 0 ? (
                <div className="neo-inset p-8 rounded-3xl text-center space-y-3">
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No Clinic Slots on this Date</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    The dentist is either off-duty, attending continuing education, or the clinic is closed on {selectedDate}.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto p-1">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    if (!slot.available) {
                      return (
                        <div
                          key={slot.time}
                          title={slot.reason || 'Unavailable'}
                          className="neo-inset-sm p-2.5 rounded-xl text-center opacity-40 cursor-not-allowed select-none"
                        >
                          <span className="text-xs font-semibold text-slate-500 line-through block">
                            {slot.time}
                          </span>
                          <span className="text-[9px] text-rose-500 block truncate">
                            {slot.reason || 'Booked'}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`p-2.5 rounded-xl text-center transition-all cursor-pointer select-none font-bold text-xs ${
                          isSelected
                            ? 'neo-inset text-blue-700 border border-blue-400 font-extrabold bg-[#E8EEF5]'
                            : 'neo-btn text-slate-700 hover:text-blue-600'
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* FLOWCHART DECISION: Slots Available? NO -> Offer Alternative Dates / Waitlist */}
              {freeSlotsCount === 0 && (
                <div className="neo-raised p-4 rounded-2xl border-l-4 border-amber-500 space-y-3 bg-[#EBF1F8]">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Decision: No Slots Available for this Selection</span>
                  </div>

                  {alternativeDates.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-600 font-medium">Recommended alternative dates with open slots:</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {alternativeDates.map((altDate) => (
                          <button
                            key={altDate}
                            onClick={() => {
                              setSelectedDate(altDate);
                              setSelectedTime('');
                            }}
                            className="neo-btn px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-50 cursor-pointer"
                          >
                            📅 {altDate}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-300/40">
                    <p className="text-xs text-slate-600">
                      Or join the priority cancellation waitlist to be automatically notified if a patient cancels:
                    </p>
                    <NeoButton
                      size="sm"
                      variant="primary"
                      className="mt-2"
                      onClick={() => setShowWaitlistOption(true)}
                    >
                      <Clock className="w-3.5 h-3.5 mr-1.5" /> Enroll in Waitlist for {selectedDate}
                    </NeoButton>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Waitlist Modal Dialog if requested */}
          {showWaitlistOption && (
            <div className="neo-inset p-5 rounded-2xl space-y-3 border-2 border-blue-400">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Join Priority Cancellation Waitlist
                </h4>
                <button
                  onClick={() => setShowWaitlistOption(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {waitlistSubmitted ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Successfully enrolled in waitlist! You will receive an SMS and in-app alert when a slot opens.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">
                    If another patient cancels or reschedules on <strong>{selectedDate}</strong>, our automated triage engine will dispatch immediate alert notifications to your phone and email.
                  </p>
                  <div className="flex gap-2">
                    {(['morning', 'afternoon', 'any'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setWaitlistTimeRange(range)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                          waitlistTimeRange === range
                            ? 'neo-inset text-blue-700'
                            : 'neo-btn text-slate-600'
                        }`}
                      >
                        {range} Range
                      </button>
                    ))}
                  </div>
                  <NeoButton size="sm" variant="success" onClick={handleJoinWaitlist}>
                    Confirm Waitlist Entry
                  </NeoButton>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-300/40">
            <NeoButton variant="default" onClick={() => setStep(4)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </NeoButton>
            <NeoButton
              variant="primary"
              disabled={!selectedTime}
              onClick={() => setStep(6)}
            >
              Review Booking <ChevronRight className="w-4 h-4 ml-1" />
            </NeoButton>
          </div>
        </NeoCard>
      )}

      {/* STEP 6: Review & Final Confirmation */}
      {step === 6 && (
        <NeoCard className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-300/40 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Step 6: Review Appointment</h3>
              <p className="text-xs text-slate-500 mt-1">
                Please verify the appointment summary before final submission.
              </p>
            </div>
            <NeoButton size="sm" variant="default" onClick={() => setStep(5)}>
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Date & Time
            </NeoButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl neo-inset space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Patient Summary
                </span>
                <p className="text-sm font-bold text-slate-800">{selectedPatient?.fullName}</p>
                <p className="text-xs text-slate-600">{selectedPatient?.phone} • {selectedPatient?.email}</p>
                <p className="text-xs text-slate-500">Record ID: {selectedPatient?.patientNumber}</p>
              </div>

              <div className="p-4 rounded-2xl neo-inset space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Practitioner & Service
                </span>
                <p className="text-sm font-bold text-slate-800">{selectedDentist.fullName}</p>
                <p className="text-xs text-blue-700 font-semibold">{selectedService.name}</p>
                <p className="text-xs text-slate-500">
                  Duration: {selectedService.durationMinutes} mins • Estimated Fee: ₱{selectedService.price}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl neo-inset space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Schedule Details
                </span>
                <div className="flex items-center gap-2 text-sm font-bold text-blue-700">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedDate}</span>
                  <Clock className="w-4 h-4 ml-2" />
                  <span>{selectedTime}</span>
                </div>
                <p className="text-xs text-slate-500">Location: {settings.clinicAddress}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Optional Symptoms / Notes for Dentist
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Sensitivity to cold liquids, slight toothache on lower left..."
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  className="w-full neo-inset p-3 rounded-2xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl neo-raised bg-[#E8EEF5] text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Clinic Cancellation & Arrival Policy:</p>
            <p>• Please arrive 10 minutes prior to your time slot for check-in and identity verification.</p>
            <p>• Cancellations must be made at least 24 hours in advance to release the slot for waitlisted patients.</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-300/40">
            <NeoButton variant="default" onClick={() => setStep(5)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </NeoButton>
            <NeoButton variant="primary" size="lg" onClick={handleConfirmBooking}>
              Confirm & Book Appointment <CheckCircle2 className="w-5 h-5 ml-1.5" />
            </NeoButton>
          </div>
        </NeoCard>
      )}

      {/* STEP 7: Confirmation & Notification Dispatch (Flowchart Output) */}
      {step === 7 && confirmedAppointment && (
        <NeoCard className="space-y-6 text-center py-8">
          <div className="w-20 h-20 rounded-3xl neo-raised mx-auto flex items-center justify-center text-emerald-600 bg-emerald-50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <NeoBadge variant="success" size="md">
              Status: Confirmed
            </NeoBadge>
            <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Appointment Successfully Confirmed!
            </h3>
            <p className="text-sm font-semibold text-blue-700">
              Reference #{confirmedAppointment.appointmentNumber}
            </p>
          </div>

          <div className="max-w-md mx-auto p-5 rounded-3xl neo-inset text-left text-xs space-y-3">
            <div className="flex justify-between border-b border-slate-300/40 pb-2">
              <span className="text-slate-500">Patient</span>
              <span className="font-bold text-slate-800">{selectedPatient?.fullName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-300/40 pb-2">
              <span className="text-slate-500">Dentist</span>
              <span className="font-bold text-slate-800">{selectedDentist.fullName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-300/40 pb-2">
              <span className="text-slate-500">Service</span>
              <span className="font-bold text-slate-800">{selectedService.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-300/40 pb-2">
              <span className="text-slate-500">Scheduled Time</span>
              <span className="font-bold text-blue-700">
                {confirmedAppointment.date} at {confirmedAppointment.startTime} - {confirmedAppointment.endTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Clinic Contact</span>
              <span className="font-bold text-slate-800">{settings.clinicPhone}</span>
            </div>
          </div>

          {/* Multi-Channel Simulation Feedback */}
          <div className="max-w-md mx-auto p-3 rounded-2xl neo-raised bg-[#E4ECF5] text-xs text-slate-600 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> In-App Notification
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> SMS Confirmation
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Email Receipt
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <NeoButton variant="default" onClick={handleAddToCalendar}>
              <CalendarCheck className="w-4 h-4 mr-1.5 text-blue-600" />
              Add to Calendar (.ics)
            </NeoButton>
            {onViewAppointments && (
              <NeoButton variant="primary" onClick={onViewAppointments}>
                <CalendarCheck className="w-4 h-4 mr-1.5" />
                View in My Appointments
              </NeoButton>
            )}
            {onCancel && (
              <NeoButton variant="default" onClick={onCancel}>
                Return to Dashboard
              </NeoButton>
            )}
            <NeoButton
              variant="default"
              onClick={() => {
                setConfirmedAppointment(null);
                setSelectedTime('');
                setStep(3);
              }}
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-blue-600" />
              Book Another Treatment
            </NeoButton>
          </div>
        </NeoCard>
      )}
    </div>
  );
};
