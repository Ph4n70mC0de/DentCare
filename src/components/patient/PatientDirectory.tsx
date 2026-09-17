import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Pill,
  FileText,
  CreditCard,
  CheckCircle2,
  Edit3,
  Lock,
  Unlock,
  RotateCcw,
  Trash2,
  Eye,
  ArrowRight,
  CalendarPlus,
  LayoutGrid,
  List,
  Sparkles,
  UserCheck,
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
import { NeoModal } from '../common/NeoModal';
import { Patient, Appointment, Consultation, Payment } from '../../types';
import { getTodayDateString } from '../../data/seedData';

interface PatientDirectoryProps {
  onStartBooking?: (patientId?: string) => void;
  onNavigateToWaitingRoom?: () => void;
  onNavigateToSchedule?: () => void;
  onStartConsultation?: (appointmentId: string) => void;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({
  onStartBooking,
  onNavigateToWaitingRoom,
  onNavigateToSchedule,
  onStartConsultation
}) => {
  const {
    patients,
    dentists,
    services,
    appointments,
    consultations,
    payments,
    settings,
    registerPatient,
    updatePatient,
    updateAppointmentStatus,
    sendNotification
  } = useDentalStore();

  const today = getTodayDateString();

  // Search, Filters & View Mode
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'alerts' | 'flagged' | 'upcoming' | 'male' | 'female'>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'id-desc' | 'noshow-desc' | 'recent'>('name-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<Patient | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [detailActiveTab, setDetailActiveTab] = useState<'demographics' | 'alerts' | 'appointments' | 'clinical' | 'billing'>('demographics');

  // Quick Notification Banner
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // 1. Filtered & Sorted Patients
  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = p.fullName.toLowerCase().includes(q);
          const matchesId = p.patientNumber.toLowerCase().includes(q);
          const matchesPhone = p.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''));
          const matchesEmail = p.email.toLowerCase().includes(q);
          const matchesRef = p.identificationReference.toLowerCase().includes(q);
          const matchesAlert = p.medicalAlerts.some((a) => a.toLowerCase().includes(q)) ||
                               p.allergies.some((a) => a.toLowerCase().includes(q));

          if (!matchesName && !matchesId && !matchesPhone && !matchesEmail && !matchesRef && !matchesAlert) {
            return false;
          }
        }

        // Category filters
        if (filterCategory === 'alerts') {
          const hasAlerts = (p.medicalAlerts && p.medicalAlerts.length > 0 && !p.medicalAlerts.includes('None declared')) ||
                            (p.allergies && p.allergies.length > 0 && !p.allergies.includes('None declared') && !p.allergies.includes('None'));
          if (!hasAlerts) return false;
        }

        if (filterCategory === 'flagged') {
          if (p.noShowCount === 0 && !p.requiresStaffReviewForBooking) return false;
        }

        if (filterCategory === 'upcoming') {
          const hasUpcoming = appointments.some(
            (a) => a.patientId === p.id && a.date >= today && !['Completed', 'Cancelled', 'No-Show'].includes(a.status)
          );
          if (!hasUpcoming) return false;
        }

        if (filterCategory === 'male' && p.sex !== 'Male') return false;
        if (filterCategory === 'female' && p.sex !== 'Female') return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.fullName.localeCompare(b.fullName);
        if (sortBy === 'name-desc') return b.fullName.localeCompare(a.fullName);
        if (sortBy === 'id-desc') return b.patientNumber.localeCompare(a.patientNumber);
        if (sortBy === 'noshow-desc') return b.noShowCount - a.noShowCount;
        if (sortBy === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
      });
  }, [patients, searchQuery, filterCategory, sortBy, appointments, today]);

  // Statistics Metrics
  const totalCount = patients.length;
  const alertCount = patients.filter((p) =>
    (p.medicalAlerts && p.medicalAlerts.length > 0 && !p.medicalAlerts.includes('None declared')) ||
    (p.allergies && p.allergies.length > 0 && !p.allergies.includes('None declared') && !p.allergies.includes('None'))
  ).length;
  const flaggedCount = patients.filter(
    (p) => p.noShowCount >= settings.maxNoShowsBeforeLock || p.requiresStaffReviewForBooking
  ).length;
  const activeWithUpcomingCount = patients.filter((p) =>
    appointments.some((a) => a.patientId === p.id && a.date >= today && !['Completed', 'Cancelled', 'No-Show'].includes(a.status))
  ).length;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Patient Number',
      'Full Name',
      'Date of Birth',
      'Gender',
      'Phone',
      'Email',
      'Address',
      'Emergency Contact Name',
      'Emergency Phone',
      'Identification Reference',
      'Medical Alerts',
      'Allergies',
      'No-Show Count',
      'Requires Staff Review',
      'Created Date'
    ];

    const rows = filteredPatients.map((p) => [
      `"${p.patientNumber}"`,
      `"${p.fullName}"`,
      `"${p.dateOfBirth}"`,
      `"${p.sex}"`,
      `"${p.phone}"`,
      `"${p.email}"`,
      `"${p.address.replace(/"/g, '""')}"`,
      `"${p.emergencyContact.name}"`,
      `"${p.emergencyContact.phone}"`,
      `"${p.identificationReference}"`,
      `"${p.medicalAlerts.join('; ')}"`,
      `"${p.allergies.join('; ')}"`,
      p.noShowCount,
      p.requiresStaffReviewForBooking ? 'YES' : 'NO',
      `"${new Date(p.createdAt).toLocaleDateString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DentCare-PatientDirectory-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported patient directory to CSV');
  };

  // Check-In Patient for today if appointment exists
  const handleQuickCheckIn = (patient: Patient) => {
    const todayApt = appointments.find(
      (a) => a.patientId === patient.id && a.date === today && ['Confirmed', 'Pending', 'Requested'].includes(a.status)
    );
    if (todayApt) {
      updateAppointmentStatus(todayApt.id, 'Checked-In');
      showToast(`${patient.fullName} checked in for today's appointment!`);
      if (onNavigateToWaitingRoom) {
        onNavigateToWaitingRoom();
      }
    } else {
      showToast(`No pending appointment scheduled for ${patient.fullName} today.`);
    }
  };

  // Calculate age helper
  const getAge = (dob: string) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl neo-raised bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="neo-raised p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl neo-raised flex items-center justify-center text-blue-700 bg-blue-50 shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Patient Directory</h2>
              <NeoBadge variant="primary" size="sm">{totalCount} Patients</NeoBadge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive electronic dental health records, medical alerts, contact rosters, and clinical history.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <NeoButton
            variant="default"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-4 h-4 text-emerald-700" />}
          >
            Export CSV
          </NeoButton>
          <NeoButton
            variant="primary"
            onClick={() => setIsRegisterModalOpen(true)}
            icon={<UserPlus className="w-4 h-4" />}
          >
            New Patient Registration
          </NeoButton>
        </div>
      </div>

      {/* Key Metric Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setFilterCategory('all')}
          className={`neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all ${
            filterCategory === 'all' ? 'ring-2 ring-blue-500 bg-blue-50/20' : 'hover:bg-slate-50/50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Enrolled</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-800">{totalCount}</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        <div
          onClick={() => setFilterCategory('alerts')}
          className={`neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all ${
            filterCategory === 'alerts' ? 'ring-2 ring-amber-500 bg-amber-50/20' : 'hover:bg-amber-50/30'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-amber-700">Medical / Allergy Alerts</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-700">{alertCount}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
        </div>

        <div
          onClick={() => setFilterCategory('flagged')}
          className={`neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all ${
            filterCategory === 'flagged' ? 'ring-2 ring-rose-500 bg-rose-50/20' : 'hover:bg-rose-50/30'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-rose-700">Flagged / No-Show Risk</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-rose-700">{flaggedCount}</span>
            <Lock className="w-4 h-4 text-rose-600" />
          </div>
        </div>

        <div
          onClick={() => setFilterCategory('upcoming')}
          className={`neo-raised p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all ${
            filterCategory === 'upcoming' ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : 'hover:bg-emerald-50/30'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-emerald-700">Upcoming Appointments</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-700">{activeWithUpcomingCount}</span>
            <CalendarPlus className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <NeoCard className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 max-w-lg">
            <NeoInput
              placeholder="Search by name, patient ID (DC-P-...), phone, email, policy ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <NeoSelect
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
            >
              <option value="all">All Patients ({totalCount})</option>
              <option value="alerts">Medical / Allergy Alerts ({alertCount})</option>
              <option value="flagged">Flagged / No-Show Strikes ({flaggedCount})</option>
              <option value="upcoming">Has Upcoming Visit ({activeWithUpcomingCount})</option>
              <option value="male">Male Patients</option>
              <option value="female">Female Patients</option>
            </NeoSelect>

            <NeoSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="name-asc">Sort: Name (A to Z)</option>
              <option value="name-desc">Sort: Name (Z to A)</option>
              <option value="id-desc">Sort: Patient ID (Newest)</option>
              <option value="noshow-desc">Sort: Most No-Shows</option>
              <option value="recent">Sort: Recently Added</option>
            </NeoSelect>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl neo-inset bg-[#E8EEF5]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'neo-raised bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table' ? 'neo-raised bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(searchQuery || filterCategory !== 'all') && (
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
            <span>Showing <strong>{filteredPatients.length}</strong> of {totalCount} patients</span>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
              }}
              className="text-blue-600 hover:underline cursor-pointer font-semibold ml-2"
            >
              Reset Filters
            </button>
          </div>
        )}
      </NeoCard>

      {/* Patient List Content */}
      {filteredPatients.length === 0 ? (
        <NeoCard className="p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">No Patients Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find any patient matching "{searchQuery}". Try modifying your search keywords or clear current filters.
          </p>
          <div className="pt-2">
            <NeoButton variant="default" size="sm" onClick={() => { setSearchQuery(''); setFilterCategory('all'); }}>
              Clear Search Filters
            </NeoButton>
          </div>
        </NeoCard>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const patientApts = appointments.filter((a) => a.patientId === patient.id);
            const upcomingApt = patientApts
              .filter((a) => a.date >= today && !['Completed', 'Cancelled', 'No-Show'].includes(a.status))
              .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))[0];
            const todayApt = patientApts.find((a) => a.date === today && ['Confirmed', 'Pending', 'Requested'].includes(a.status));
            const pastConsultations = consultations.filter((c) => c.patientId === patient.id);
            const age = getAge(patient.dateOfBirth);

            const hasMedicalAlerts = patient.medicalAlerts.length > 0 && !patient.medicalAlerts.includes('None declared');
            const hasAllergies = patient.allergies.length > 0 && !patient.allergies.includes('None declared') && !patient.allergies.includes('None');
            const isRestricted = patient.noShowCount >= settings.maxNoShowsBeforeLock || patient.requiresStaffReviewForBooking;

            return (
              <div
                key={patient.id}
                className="neo-raised p-5 rounded-3xl flex flex-col justify-between gap-4 transition-all hover:translate-y-[-2px] hover:shadow-lg bg-[#E8EEF5]"
              >
                {/* Top Card Bar */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl neo-raised flex items-center justify-center font-bold text-blue-700 bg-blue-50 text-sm shrink-0">
                        {patient.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm leading-tight hover:text-blue-700 transition-colors">
                          {patient.fullName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded-md">
                            {patient.patientNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {patient.sex}, {age ? `${age}y` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* No-Show / Restriction Pill */}
                    {isRestricted ? (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full" title="Exceeded clinic no-show threshold">
                        <Lock className="w-3 h-3" />
                        <span>Restricted</span>
                      </span>
                    ) : patient.noShowCount > 0 ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        {patient.noShowCount} No-Show
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                        Clean Record
                      </span>
                    )}
                  </div>

                  {/* Contact Snippets */}
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`tel:${patient.phone}`} className="hover:text-blue-700 font-medium truncate">
                        {patient.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`mailto:${patient.email}`} className="hover:text-blue-700 truncate text-[11px]">
                        {patient.email}
                      </a>
                    </div>
                    {patient.identificationReference && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Policy / ID: <strong>{patient.identificationReference}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Clinical Alert Tags */}
                  {(hasMedicalAlerts || hasAllergies) && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {patient.medicalAlerts.filter(a => a !== 'None declared').map((alert, idx) => (
                        <span
                          key={`alert-${idx}`}
                          className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg flex items-center gap-1"
                        >
                          <HeartPulse className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[150px]">{alert}</span>
                        </span>
                      ))}
                      {patient.allergies.filter(a => a !== 'None declared' && a !== 'None').map((allergy, idx) => (
                        <span
                          key={`allergy-${idx}`}
                          className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1"
                        >
                          <Pill className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[150px]">{allergy}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Upcoming Visit Banner */}
                  {upcomingApt && (
                    <div className="p-2.5 rounded-2xl neo-inset bg-[#EFF4FA] text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between text-blue-700 font-bold">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Upcoming Visit:
                        </span>
                        <span>{upcomingApt.date} at {upcomingApt.startTime}</span>
                      </div>
                      <p className="text-slate-500 text-[10px] truncate">
                        Procedure: {services.find(s => s.id === upcomingApt.serviceId)?.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-2 border-t border-slate-300/40 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedPatientForDetail(patient);
                        setDetailActiveTab('demographics');
                      }}
                      className="p-2 rounded-xl neo-btn text-blue-700 hover:text-blue-900 cursor-pointer text-xs font-bold flex items-center gap-1"
                      title="View Complete Clinical Chart"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chart</span>
                    </button>

                    <button
                      onClick={() => setSelectedPatientForEdit(patient)}
                      className="p-2 rounded-xl neo-btn text-slate-600 hover:text-slate-900 cursor-pointer text-xs font-bold flex items-center gap-1"
                      title="Edit Patient Demographics & Alerts"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {todayApt ? (
                      <NeoButton
                        size="sm"
                        variant="primary"
                        onClick={() => handleQuickCheckIn(patient)}
                        icon={<UserCheck className="w-3.5 h-3.5" />}
                      >
                        Check-In
                      </NeoButton>
                    ) : onStartBooking ? (
                      <NeoButton
                        size="sm"
                        variant="default"
                        onClick={() => onStartBooking(patient.id)}
                        icon={<CalendarPlus className="w-3.5 h-3.5 text-blue-600" />}
                      >
                        Book Appt
                      </NeoButton>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT CLINICAL TABLE VIEW */
        <NeoCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-300/40 bg-slate-100/50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-3.5 pl-5">Patient Name & ID</th>
                  <th className="p-3.5">Contact Information</th>
                  <th className="p-3.5">Age / Sex</th>
                  <th className="p-3.5">Medical Alerts & Allergies</th>
                  <th className="p-3.5">No-Show Status</th>
                  <th className="p-3.5">Next Appointment</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300/30 text-slate-700">
                {filteredPatients.map((patient) => {
                  const patientApts = appointments.filter((a) => a.patientId === patient.id);
                  const upcomingApt = patientApts
                    .filter((a) => a.date >= today && !['Completed', 'Cancelled', 'No-Show'].includes(a.status))
                    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))[0];
                  const age = getAge(patient.dateOfBirth);
                  const isRestricted = patient.noShowCount >= settings.maxNoShowsBeforeLock || patient.requiresStaffReviewForBooking;

                  return (
                    <tr key={patient.id} className="hover:bg-slate-100/50 transition-all">
                      <td className="p-3.5 pl-5">
                        <div className="font-extrabold text-slate-900 text-sm">{patient.fullName}</div>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded-md">
                          {patient.patientNumber}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold">{patient.phone}</div>
                        <div className="text-[11px] text-slate-500">{patient.email}</div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold">{patient.sex}</span>
                        {age && <span className="text-slate-500 block text-[11px]">{age} years old</span>}
                      </td>

                      <td className="p-3.5 max-w-[220px]">
                        <div className="flex flex-wrap gap-1">
                          {patient.medicalAlerts.filter(a => a !== 'None declared').map((alert, i) => (
                            <span key={i} className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              {alert}
                            </span>
                          ))}
                          {patient.allergies.filter(a => a !== 'None declared' && a !== 'None').map((allg, i) => (
                            <span key={i} className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {allg}
                            </span>
                          ))}
                          {patient.medicalAlerts.length === 0 && patient.allergies.length === 0 && (
                            <span className="text-slate-400 text-[11px] italic">None declared</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        {isRestricted ? (
                          <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Restricted
                          </span>
                        ) : patient.noShowCount > 0 ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            {patient.noShowCount} Strike{patient.noShowCount > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                            Clean
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {upcomingApt ? (
                          <div className="text-[11px]">
                            <span className="font-bold text-blue-700 block">{upcomingApt.date}</span>
                            <span className="text-slate-500">{upcomingApt.startTime} ({services.find(s => s.id === upcomingApt.serviceId)?.name})</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">None scheduled</span>
                        )}
                      </td>

                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedPatientForDetail(patient);
                              setDetailActiveTab('demographics');
                            }}
                            className="p-1.5 rounded-xl neo-btn text-blue-700 hover:text-blue-900 cursor-pointer font-bold text-xs"
                            title="View Chart"
                          >
                            Chart
                          </button>

                          <button
                            onClick={() => setSelectedPatientForEdit(patient)}
                            className="p-1.5 rounded-xl neo-btn text-slate-600 hover:text-slate-900 cursor-pointer font-bold text-xs"
                            title="Edit Record"
                          >
                            Edit
                          </button>

                          {onStartBooking && (
                            <NeoButton
                              size="sm"
                              variant="default"
                              onClick={() => onStartBooking(patient.id)}
                            >
                              Book
                            </NeoButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </NeoCard>
      )}

      {/* MODAL 1: COMPREHENSIVE PATIENT CHART MODAL */}
      {selectedPatientForDetail && (
        <PatientDetailModal
          patient={selectedPatientForDetail}
          activeTab={detailActiveTab}
          onSelectTab={setDetailActiveTab}
          onClose={() => setSelectedPatientForDetail(null)}
          onStartBooking={onStartBooking}
          onUpdatePatient={(updated) => {
            setSelectedPatientForDetail(updated);
            showToast('Updated patient clinical record');
          }}
          onStartConsultation={onStartConsultation}
        />
      )}

      {/* MODAL 2: EDIT PATIENT DEMOGRAPHICS & CLINICAL ALERTS */}
      {selectedPatientForEdit && (
        <PatientEditModal
          patient={selectedPatientForEdit}
          onClose={() => setSelectedPatientForEdit(null)}
          onSave={(updated) => {
            setSelectedPatientForEdit(null);
            showToast(`Successfully updated record for ${updated.fullName}`);
          }}
        />
      )}

      {/* MODAL 3: NEW PATIENT REGISTRATION */}
      {isRegisterModalOpen && (
        <PatientRegistrationModal
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={(newPatient) => {
            setIsRegisterModalOpen(false);
            showToast(`Enrolled new patient: ${newPatient.fullName} (${newPatient.patientNumber})`);
          }}
          onBookImmediate={(patientId) => {
            setIsRegisterModalOpen(false);
            if (onStartBooking) onStartBooking(patientId);
          }}
        />
      )}
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT: PatientDetailModal (Comprehensive Electronic Dental Chart)
   ========================================================================= */
interface PatientDetailModalProps {
  patient: Patient;
  activeTab: 'demographics' | 'alerts' | 'appointments' | 'clinical' | 'billing';
  onSelectTab: (tab: any) => void;
  onClose: () => void;
  onStartBooking?: (patientId: string) => void;
  onUpdatePatient: (patient: Patient) => void;
  onStartConsultation?: (appointmentId: string) => void;
}

const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  activeTab,
  onSelectTab,
  onClose,
  onStartBooking,
  onUpdatePatient,
  onStartConsultation
}) => {
  const {
    appointments,
    dentists,
    services,
    consultations,
    payments,
    settings,
    updatePatient
  } = useDentalStore();

  const patientApts = appointments.filter((a) => a.patientId === patient.id);
  const patientConsultations = consultations.filter((c) => c.patientId === patient.id);
  const patientPayments = payments.filter((p) => p.patientId === patient.id);

  // New alert input
  const [newAlertText, setNewAlertText] = useState<string>('');
  const [newAllergyText, setNewAllergyText] = useState<string>('');

  const handleAddAlert = () => {
    if (!newAlertText.trim()) return;
    const current = patient.medicalAlerts.filter(a => a !== 'None declared');
    const updated = updatePatient(patient.id, {
      medicalAlerts: [...current, newAlertText.trim()]
    });
    if (updated) onUpdatePatient(updated);
    setNewAlertText('');
  };

  const handleRemoveAlert = (alert: string) => {
    const updated = updatePatient(patient.id, {
      medicalAlerts: patient.medicalAlerts.filter(a => a !== alert)
    });
    if (updated) onUpdatePatient(updated);
  };

  const handleAddAllergy = () => {
    if (!newAllergyText.trim()) return;
    const current = patient.allergies.filter(a => a !== 'None declared' && a !== 'None');
    const updated = updatePatient(patient.id, {
      allergies: [...current, newAllergyText.trim()]
    });
    if (updated) onUpdatePatient(updated);
    setNewAllergyText('');
  };

  const handleRemoveAllergy = (allergy: string) => {
    const updated = updatePatient(patient.id, {
      allergies: patient.allergies.filter(a => a !== allergy)
    });
    if (updated) onUpdatePatient(updated);
  };

  const handleResetNoShowStrikes = () => {
    const updated = updatePatient(patient.id, {
      noShowCount: 0,
      requiresStaffReviewForBooking: false
    });
    if (updated) onUpdatePatient(updated);
  };

  const handleToggleRestriction = () => {
    const updated = updatePatient(patient.id, {
      requiresStaffReviewForBooking: !patient.requiresStaffReviewForBooking
    });
    if (updated) onUpdatePatient(updated);
  };

  return (
    <NeoModal
      isOpen={true}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-blue-700">
          <FileText className="w-5 h-5" />
          <span>Patient Electronic Health Chart: {patient.fullName}</span>
        </div>
      }
      subtitle={`ID: ${patient.patientNumber} • DOB: ${patient.dateOfBirth} (${patient.sex})`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Top Clinical Banner */}
        <div className="p-4 rounded-2xl neo-raised bg-[#EFF4FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl neo-raised flex items-center justify-center text-blue-700 bg-white font-extrabold text-sm shrink-0">
              {patient.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800 text-sm">{patient.fullName}</span>
                <NeoBadge variant="primary" size="sm">{patient.patientNumber}</NeoBadge>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Contact: {patient.phone} • {patient.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onStartBooking && (
              <NeoButton
                size="sm"
                variant="primary"
                onClick={() => {
                  onClose();
                  onStartBooking(patient.id);
                }}
                icon={<CalendarPlus className="w-3.5 h-3.5" />}
              >
                Book Appointment
              </NeoButton>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1.5 p-1 neo-inset-sm rounded-2xl">
          {[
            { id: 'demographics', label: '1. Demographics & Emergency', icon: Users },
            { id: 'alerts', label: `2. Medical Alerts & Rx (${patient.medicalAlerts.length + patient.allergies.length})`, icon: HeartPulse },
            { id: 'appointments', label: `3. Appointments Flow (${patientApts.length})`, icon: Calendar },
            { id: 'clinical', label: `4. Dental Consultations (${patientConsultations.length})`, icon: Stethoscope },
            { id: 'billing', label: `5. Payments & Invoices (${patientPayments.length})`, icon: CreditCard }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'neo-raised bg-[#E8EEF5] text-blue-700 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: Demographics & Policy */}
        {activeTab === 'demographics' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl neo-inset space-y-2.5">
                <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px] text-blue-700">
                  Patient Profile Information
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Legal Name:</span>
                  <span className="font-semibold text-slate-800">{patient.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date of Birth:</span>
                  <span className="font-semibold text-slate-800">{patient.dateOfBirth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gender / Sex:</span>
                  <span className="font-semibold text-slate-800">{patient.sex}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone Contact:</span>
                  <span className="font-semibold text-slate-800">{patient.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Address:</span>
                  <span className="font-semibold text-slate-800">{patient.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Residential Address:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[200px]">{patient.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Insurance / National ID:</span>
                  <span className="font-semibold text-blue-700">{patient.identificationReference || 'Unspecified'}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl neo-inset space-y-2.5">
                <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px] text-blue-700">
                  Emergency Contact Details
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Name:</span>
                  <span className="font-semibold text-slate-800">{patient.emergencyContact?.name || 'None listed'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Relationship:</span>
                  <span className="font-semibold text-slate-800">{patient.emergencyContact?.relationship || 'Family'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Emergency Phone:</span>
                  <span className="font-semibold text-slate-800">{patient.emergencyContact?.phone || 'None'}</span>
                </div>

                <div className="pt-3 border-t border-slate-300/40 space-y-2">
                  <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px] text-rose-700">
                    Clinic Attendance & No-Show Governance
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Recorded No-Shows:</span>
                    <span className="font-extrabold text-slate-800">{patient.noShowCount} Strike(s)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Restricted Booking Status:</span>
                    <span className={`font-bold ${patient.requiresStaffReviewForBooking ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {patient.requiresStaffReviewForBooking ? 'Restricted (Staff Approval Required)' : 'Active / Allowed'}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <NeoButton size="sm" variant="default" onClick={handleResetNoShowStrikes} icon={<RotateCcw className="w-3 h-3" />}>
                      Reset Strikes (0)
                    </NeoButton>
                    <NeoButton
                      size="sm"
                      variant={patient.requiresStaffReviewForBooking ? 'primary' : 'danger'}
                      onClick={handleToggleRestriction}
                      icon={patient.requiresStaffReviewForBooking ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    >
                      {patient.requiresStaffReviewForBooking ? 'Lift Restriction' : 'Restrict Patient'}
                    </NeoButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Medical Alerts & Allergies */}
        {activeTab === 'alerts' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl neo-raised bg-amber-50/60 border-l-4 border-amber-500 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900">Clinical Safety Notice:</span>
                <p className="text-slate-600 mt-0.5">
                  Pre-existing conditions, cardiac devices, anticoagulants, and drug allergies alert the dentist prior to local anesthesia and surgical procedures.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Medical Alerts */}
              <div className="p-4 rounded-2xl neo-inset space-y-3">
                <span className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  <span>Medical Conditions & Alerts ({patient.medicalAlerts.length})</span>
                </span>

                <div className="space-y-1.5">
                  {patient.medicalAlerts.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px]">No medical alerts recorded.</p>
                  ) : (
                    patient.medicalAlerts.map((alert, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/70 text-slate-800">
                        <span className="font-semibold text-rose-700">{alert}</span>
                        <button
                          onClick={() => handleRemoveAlert(alert)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="e.g. Hypertension, Diabetes, Pacemaker"
                    value={newAlertText}
                    onChange={(e) => setNewAlertText(e.target.value)}
                    className="flex-1 p-2 text-xs rounded-xl neo-inset bg-[#EFF4FA] outline-none"
                  />
                  <NeoButton size="sm" variant="default" onClick={handleAddAlert}>
                    Add
                  </NeoButton>
                </div>
              </div>

              {/* Drug / Substance Allergies */}
              <div className="p-4 rounded-2xl neo-inset space-y-3">
                <span className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-amber-600" />
                  <span>Known Drug & Material Allergies ({patient.allergies.length})</span>
                </span>

                <div className="space-y-1.5">
                  {patient.allergies.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px]">No allergies declared.</p>
                  ) : (
                    patient.allergies.map((allergy, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/70 text-slate-800">
                        <span className="font-semibold text-amber-800">{allergy}</span>
                        <button
                          onClick={() => handleRemoveAllergy(allergy)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Latex, Codeine"
                    value={newAllergyText}
                    onChange={(e) => setNewAllergyText(e.target.value)}
                    className="flex-1 p-2 text-xs rounded-xl neo-inset bg-[#EFF4FA] outline-none"
                  />
                  <NeoButton size="sm" variant="default" onClick={handleAddAllergy}>
                    Add
                  </NeoButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Appointments Flow */}
        {activeTab === 'appointments' && (
          <div className="space-y-3 text-xs">
            {patientApts.length === 0 ? (
              <div className="p-8 neo-inset rounded-2xl text-center text-slate-400 italic">
                No appointment history on file for this patient.
              </div>
            ) : (
              <div className="space-y-2">
                {patientApts
                  .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`))
                  .map((apt) => {
                    const dentist = dentists.find(d => d.id === apt.dentistId);
                    const service = services.find(s => s.id === apt.serviceId);

                    return (
                      <div key={apt.id} className="p-3.5 rounded-2xl neo-raised bg-[#EFF4FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{apt.date} at {apt.startTime} - {apt.endTime}</span>
                            <NeoStatusPill status={apt.status} />
                            {apt.queueNumber && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                                Queue #{apt.queueNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Procedure: <strong>{service?.name}</strong> • Attending: Dr. {dentist?.fullName} • Ref #{apt.appointmentNumber}
                          </p>
                          {apt.cancellationReason && (
                            <p className="text-[11px] text-rose-600 italic mt-0.5">
                              Cancellation Reason: "{apt.cancellationReason}"
                            </p>
                          )}
                        </div>

                        {apt.status === 'Waiting' && onStartConsultation && (
                          <NeoButton size="sm" variant="primary" onClick={() => { onClose(); onStartConsultation(apt.id); }}>
                            Enter Operatory
                          </NeoButton>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Dental Consultations */}
        {activeTab === 'clinical' && (
          <div className="space-y-3 text-xs">
            {patientConsultations.length === 0 ? (
              <div className="p-8 neo-inset rounded-2xl text-center text-slate-400 italic">
                No past dental clinical consultations recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {patientConsultations.map((rec) => (
                  <div key={rec.id} className="p-4 rounded-2xl neo-inset space-y-2 bg-[#EFF4FA]">
                    <div className="flex items-center justify-between border-b border-slate-300/30 pb-1.5">
                      <span className="font-bold text-blue-700">Record Ref: #{rec.appointmentId}</span>
                      <span className="text-slate-400 text-[11px]">{new Date(rec.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-700"><strong>Diagnosis:</strong> {rec.diagnosis}</p>
                    <p className="text-slate-700"><strong>Treatment Plan:</strong> {rec.treatmentPlan}</p>
                    {rec.examinationFindings && (
                      <p className="text-slate-600"><strong>Clinical Notes:</strong> {rec.examinationFindings}</p>
                    )}
                    {rec.prescriptions && rec.prescriptions.length > 0 && (
                      <div className="pt-1">
                        <span className="font-bold text-slate-800 block text-[11px]">Prescribed Medications:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.prescriptions.map((rx, idx) => (
                            <span key={idx} className="p-1 px-2 rounded-lg neo-raised bg-white text-blue-800 text-[10px] font-bold">
                              {rx.medication} ({rx.dosage}, {rx.frequency})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {rec.followUpRecommendation?.required && (
                      <p className="text-blue-700 text-[11px] font-semibold pt-1">
                        Follow-Up Recommendation: {rec.followUpRecommendation.timeframeWeeks} weeks ({rec.followUpRecommendation.notes})
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Billing & Invoices */}
        {activeTab === 'billing' && (
          <div className="space-y-3 text-xs">
            {patientPayments.length === 0 ? (
              <div className="p-8 neo-inset rounded-2xl text-center text-slate-400 italic">
                No payment or settlement invoices found.
              </div>
            ) : (
              <div className="space-y-2">
                {patientPayments.map((pmt) => (
                  <div key={pmt.id} className="p-3.5 rounded-2xl neo-raised bg-[#EFF4FA] flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800">Receipt #{pmt.receiptNumber}</span>
                        <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-md text-[10px]">
                          {pmt.paymentStatus}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Method: <strong>{pmt.paymentMethod}</strong> • Subtotal: ${pmt.subtotal.toFixed(2)} • Ins. Covered: ${pmt.insuranceCoverage.toFixed(2)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Amount Paid</span>
                      <span className="text-base font-extrabold text-blue-700">${pmt.amountPaid.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-300/40">
          <NeoButton variant="default" onClick={onClose}>
            Close Chart
          </NeoButton>
        </div>
      </div>
    </NeoModal>
  );
};

/* =========================================================================
   SUB-COMPONENT: PatientEditModal (Update Patient Records)
   ========================================================================= */
interface PatientEditModalProps {
  patient: Patient;
  onClose: () => void;
  onSave: (patient: Patient) => void;
}

const PatientEditModal: React.FC<PatientEditModalProps> = ({
  patient,
  onClose,
  onSave
}) => {
  const { updatePatient } = useDentalStore();

  const [fullName, setFullName] = useState<string>(patient.fullName);
  const [phone, setPhone] = useState<string>(patient.phone);
  const [email, setEmail] = useState<string>(patient.email);
  const [address, setAddress] = useState<string>(patient.address);
  const [dateOfBirth, setDateOfBirth] = useState<string>(patient.dateOfBirth);
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>(patient.sex);
  const [identificationReference, setIdentificationReference] = useState<string>(patient.identificationReference);
  const [emergencyName, setEmergencyName] = useState<string>(patient.emergencyContact?.name || '');
  const [emergencyRelationship, setEmergencyRelationship] = useState<string>(patient.emergencyContact?.relationship || 'Family');
  const [emergencyPhone, setEmergencyPhone] = useState<string>(patient.emergencyContact?.phone || '');
  const [medicalAlertsStr, setMedicalAlertsStr] = useState<string>(patient.medicalAlerts.join(', '));
  const [allergiesStr, setAllergiesStr] = useState<string>(patient.allergies.join(', '));
  const [noShowCount, setNoShowCount] = useState<number>(patient.noShowCount);
  const [requiresStaffReview, setRequiresStaffReview] = useState<boolean>(patient.requiresStaffReviewForBooking || false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const alerts = medicalAlertsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const allgs = allergiesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updated = updatePatient(patient.id, {
      fullName,
      phone,
      email,
      address,
      dateOfBirth,
      sex,
      identificationReference,
      emergencyContact: {
        name: emergencyName,
        relationship: emergencyRelationship,
        phone: emergencyPhone
      },
      medicalAlerts: alerts,
      allergies: allgs,
      noShowCount: Number(noShowCount),
      requiresStaffReviewForBooking: requiresStaffReview
    });

    if (updated) {
      onSave(updated);
    }
  };

  return (
    <NeoModal
      isOpen={true}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-blue-700">
          <Edit3 className="w-5 h-5" />
          <span>Edit Patient Record: {patient.patientNumber}</span>
        </div>
      }
      subtitle="Modify patient demographic details, emergency contacts, alerts, and attendance policies."
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NeoInput
            label="Full Legal Name *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <NeoSelect
            label="Gender / Sex"
            value={sex}
            onChange={(e) => setSex(e.target.value as any)}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </NeoSelect>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NeoInput
            label="Date of Birth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
          <NeoInput
            label="Insurance / National ID Policy"
            value={identificationReference}
            onChange={(e) => setIdentificationReference(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NeoInput
            label="Phone Number *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <NeoInput
            label="Email Address *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <NeoInput
          label="Home Residential Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className="p-3.5 rounded-2xl neo-inset space-y-2.5">
          <span className="font-bold text-slate-800 block text-xs">Emergency Contact Details</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <NeoInput
              label="Contact Name"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
            />
            <NeoInput
              label="Relationship"
              value={emergencyRelationship}
              onChange={(e) => setEmergencyRelationship(e.target.value)}
            />
            <NeoInput
              label="Emergency Phone"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NeoInput
            label="Medical Alerts (comma separated)"
            value={medicalAlertsStr}
            onChange={(e) => setMedicalAlertsStr(e.target.value)}
            helperText="e.g. Hypertension, Cardiac device, Diabetes"
          />
          <NeoInput
            label="Known Allergies (comma separated)"
            value={allergiesStr}
            onChange={(e) => setAllergiesStr(e.target.value)}
            helperText="e.g. Penicillin, Latex, Codeine"
          />
        </div>

        <div className="p-3 rounded-2xl neo-inset flex items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-800 block text-xs">Attendance & No-Show Policy</span>
            <span className="text-[11px] text-slate-500">Current Strikes: {noShowCount}</span>
          </div>

          <div className="flex items-center gap-3">
            <NeoInput
              label="No-Show Count"
              type="number"
              value={noShowCount}
              onChange={(e) => setNoShowCount(Number(e.target.value))}
            />
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 mt-4">
              <input
                type="checkbox"
                checked={requiresStaffReview}
                onChange={(e) => setRequiresStaffReview(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>Restrict</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-300/40">
          <NeoButton variant="default" onClick={onClose}>
            Cancel
          </NeoButton>
          <NeoButton variant="primary" type="submit">
            Save Record Changes
          </NeoButton>
        </div>
      </form>
    </NeoModal>
  );
};

/* =========================================================================
   SUB-COMPONENT: PatientRegistrationModal (Add New Patient Roster)
   ========================================================================= */
interface PatientRegistrationModalProps {
  onClose: () => void;
  onSuccess: (newPatient: Patient) => void;
  onBookImmediate?: (patientId: string) => void;
}

const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  onClose,
  onSuccess,
  onBookImmediate
}) => {
  const { registerPatient, patients } = useDentalStore();

  const [fullName, setFullName] = useState<string>('');
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dateOfBirth, setDateOfBirth] = useState<string>('1996-06-15');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [identificationReference, setIdentificationReference] = useState<string>('');
  const [emergencyName, setEmergencyName] = useState<string>('');
  const [emergencyRelationship, setEmergencyRelationship] = useState<string>('Spouse / Partner');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('');
  const [medicalAlertsStr, setMedicalAlertsStr] = useState<string>('');
  const [allergiesStr, setAllergiesStr] = useState<string>('');
  const [bookAfterEnroll, setBookAfterEnroll] = useState<boolean>(false);

  const previewPatientNumber = `DC-P-${10000 + patients.length + 1}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !email.trim()) return;

    const alerts = medicalAlertsStr
      ? medicalAlertsStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const allgs = allergiesStr
      ? allergiesStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const newPat = registerPatient({
      fullName: fullName.trim(),
      dateOfBirth,
      sex,
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      address: address.trim() || '123 Health Ave, Clinic District',
      emergencyContact: {
        name: emergencyName.trim() || 'Emergency Contact',
        relationship: emergencyRelationship,
        phone: emergencyPhone.trim() || phone.trim()
      },
      identificationReference: identificationReference.trim() || `ID-${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`,
      medicalAlerts: alerts,
      allergies: allgs
    });

    onSuccess(newPat);
    if (bookAfterEnroll && onBookImmediate) {
      onBookImmediate(newPat.id);
    }
  };

  return (
    <NeoModal
      isOpen={true}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-blue-700">
          <UserPlus className="w-5 h-5" />
          <span>New Patient Enrollment</span>
        </div>
      }
      subtitle={`Enrolling under Electronic Patient ID: #${previewPatientNumber}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NeoInput
            label="Full Legal Name *"
            placeholder="e.g. Victoria Sterling"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <NeoSelect
            label="Gender / Sex *"
            value={sex}
            onChange={(e) => setSex(e.target.value as any)}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </NeoSelect>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NeoInput
            label="Date of Birth *"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          />
          <NeoInput
            label="Insurance / National ID Policy"
            placeholder="e.g. INS-984-219"
            value={identificationReference}
            onChange={(e) => setIdentificationReference(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NeoInput
            label="Mobile Phone *"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <NeoInput
            label="Email Address *"
            type="email"
            placeholder="patient@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <NeoInput
          label="Home Street Address"
          placeholder="e.g. 450 Medical Plaza, Suite 2B"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className="p-3.5 rounded-2xl neo-inset space-y-2.5">
          <span className="font-bold text-slate-800 block text-xs">Emergency Contact Details</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <NeoInput
              label="Contact Name"
              placeholder="e.g. David Sterling"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
            />
            <NeoInput
              label="Relationship"
              placeholder="e.g. Spouse, Parent"
              value={emergencyRelationship}
              onChange={(e) => setEmergencyRelationship(e.target.value)}
            />
            <NeoInput
              label="Contact Phone"
              placeholder="+1 (555) 000-1111"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NeoInput
            label="Pre-existing Conditions / Medical Alerts"
            placeholder="e.g. Hypertension, Pacemaker"
            value={medicalAlertsStr}
            onChange={(e) => setMedicalAlertsStr(e.target.value)}
            helperText="Separate multiple with commas"
          />
          <NeoInput
            label="Drug & Material Allergies"
            placeholder="e.g. Penicillin, Latex"
            value={allergiesStr}
            onChange={(e) => setAllergiesStr(e.target.value)}
            helperText="Separate multiple with commas"
          />
        </div>

        <div className="p-3 rounded-2xl neo-inset flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
            <input
              type="checkbox"
              checked={bookAfterEnroll}
              onChange={(e) => setBookAfterEnroll(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span>Immediately schedule an appointment after enrollment</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-300/40">
          <NeoButton variant="default" onClick={onClose}>
            Cancel
          </NeoButton>
          <NeoButton variant="primary" type="submit" icon={<CheckCircle2 className="w-4 h-4" />}>
            Complete Enrollment & Save
          </NeoButton>
        </div>
      </form>
    </NeoModal>
  );
};
