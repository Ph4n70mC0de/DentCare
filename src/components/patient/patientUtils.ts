import { getTodayDateString } from '../../data/seedData';
import { Appointment, WaitlistEntry } from '../../types';

export const getTomorrowDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const downloadICS = (
  apt: Appointment,
  settings: { clinicName: string; clinicAddress: string },
  services: { id: string; name: string }[],
  dentists: { id: string; fullName: string }[]
) => {
  const s = services.find((srv) => srv.id === apt.serviceId);
  const d = dentists.find((dnt) => dnt.id === apt.dentistId);
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:DentCare: ${s?.name || 'Dental Visit'}
DESCRIPTION:Appointment #${apt.appointmentNumber} with ${d?.fullName || 'Dentist'} at ${settings.clinicName}
LOCATION:${settings.clinicAddress}
DTSTART:${apt.date.replace(/-/g, '')}T${apt.startTime.replace(':', '')}00
DTEND:${apt.date.replace(/-/g, '')}T${apt.endTime.replace(':', '')}00
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Appointment-${apt.appointmentNumber}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getRelativeDay = (dateStr: string, today: string, tomorrow: string): string => {
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date(today + 'T00:00:00');
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return `In ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago`;
  return dateStr;
};

export const getPatientAge = (dob: string): string => {
  const birthYear = new Date(dob).getFullYear();
  const currentYear = new Date().getFullYear();
  return isNaN(birthYear) ? '' : `${currentYear - birthYear} yrs`;
};

export const exportVisitsCSV = (
  myAppointments: any[],
  services: any[],
  dentists: any[],
  currentPatient: { patientNumber?: string }
) => {
  const headers = [
    'Appointment #',
    'Date',
    'Time',
    'Treatment / Service',
    'Dentist',
    'Duration (mins)',
    'Est. Fee ($)',
    'Status'
  ];
  const rows = myAppointments.map((apt) => {
    const s = services.find((srv) => srv.id === apt.serviceId);
    const d = dentists.find((dnt) => dnt.id === apt.dentistId);
    return [
      apt.appointmentNumber,
      apt.date,
      `${apt.startTime}-${apt.endTime}`,
      `"${s?.name || 'Dental Visit'}"`,
      `"Dr. ${d?.fullName || ''}"`,
      s?.durationMinutes || 30,
      s?.price || 0,
      apt.status
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `DentCare-Records-${currentPatient.patientNumber || 'patient'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const toothNames: Record<number, string> = {
  1: 'Upper Right 3rd Molar (Wisdom)',
  2: 'Upper Right 2nd Molar',
  3: 'Upper Right 1st Molar',
  4: 'Upper Right 2nd Premolar',
  5: 'Upper Right 1st Premolar',
  6: 'Upper Right Canine',
  7: 'Upper Right Lateral Incisor',
  8: 'Upper Right Central Incisor',
  9: 'Upper Left Central Incisor',
  10: 'Upper Left Lateral Incisor',
  11: 'Upper Left Canine',
  12: 'Upper Left 1st Premolar',
  13: 'Upper Left 2nd Premolar',
  14: 'Upper Left 1st Molar (Maxillary)',
  15: 'Upper Left 2nd Molar',
  16: 'Upper Left 3rd Molar (Wisdom)',
  17: 'Lower Left 3rd Molar (Wisdom)',
  18: 'Lower Left 2nd Molar',
  19: 'Lower Left 1st Molar',
  20: 'Lower Left 2nd Premolar',
  21: 'Lower Left 1st Premolar',
  22: 'Lower Left Canine',
  23: 'Lower Left Lateral Incisor',
  24: 'Lower Left Central Incisor',
  25: 'Lower Right Central Incisor',
  26: 'Lower Right Lateral Incisor',
  27: 'Lower Right Canine',
  28: 'Lower Right 1st Premolar',
  29: 'Lower Right 2nd Premolar',
  30: 'Lower Right 1st Molar',
  31: 'Lower Right 2nd Molar',
  32: 'Lower Right 3rd Molar (Wisdom)'
};

export const defaultTeethConditions: Record<
  number,
  { status: 'healthy' | 'filling' | 'caries' | 'crown' | 'missing'; notes?: string }
> = {
  14: {
    status: 'filling',
    notes: 'Class I Occlusal composite restoration placed by Dr. Marcus Vance, DDS. Natural aesthetic shading (A2), marginal seal intact.'
  },
  3: {
    status: 'healthy',
    notes: 'Healthy tooth with intact fissure sealants. No tenderness or mobility.'
  },
  19: {
    status: 'healthy',
    notes: 'Probing depths within normal 2-3mm physiological limits. No bleeding.'
  },
  30: {
    status: 'healthy',
    notes: 'Superficial anatomical staining on buccal pit, remineralization counseling provided.'
  }
};
