import {
  User,
  Patient,
  Dentist,
  DentalService,
  DentistSchedule,
  BlockedSchedule,
  Appointment,
  WaitlistEntry,
  Consultation,
  Payment,
  AppNotification,
  AuditLog,
  SystemSettings
} from '../types';

export const initialSettings: SystemSettings = {
  clinicName: 'DentCare Dental Clinic & Specialties',
  clinicPhone: '+1 (555) 248-3688',
  clinicEmail: 'care@dentcare-clinic.com',
  clinicAddress: '450 Health Sciences Parkway, Suite 300, Metro City',
  clinicOpenTime: '08:30',
  clinicCloseTime: '17:30',
  defaultSlotDurationMinutes: 45,
  bufferTimeMinutes: 10,
  pendingHoldMinutes: 15,
  maxNoShowsBeforeLock: 2,
  requireStaffReviewOnNoShow: true,
  reminderLeadHours: 24,
  autoNotifyWaitlistOnCancel: true,
  emergencyBufferShiftMinutes: 20
};

export const initialUsers: User[] = [
  {
    id: 'user-admin',
    role: 'admin',
    fullName: 'Dr. Eleanor Vance',
    email: 'admin@dentcare.com',
    phone: '+1 (555) 019-2831',
    status: 'active',
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-frontdesk',
    role: 'front_desk',
    fullName: 'Clara Mendez',
    email: 'reception@dentcare.com',
    phone: '+1 (555) 019-4455',
    status: 'active',
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-dentist-1',
    role: 'dentist',
    fullName: 'Dr. Marcus Vance, DDS',
    email: 'marcus.vance@dentcare.com',
    phone: '+1 (555) 019-7711',
    status: 'active',
    createdAt: '2025-01-05T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-dentist-2',
    role: 'dentist',
    fullName: 'Dr. Sarah Lin, DMD',
    email: 'sarah.lin@dentcare.com',
    phone: '+1 (555) 019-9922',
    status: 'active',
    createdAt: '2025-02-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813686-26154b52b362?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-patient-1',
    role: 'patient',
    fullName: 'James Wilson',
    email: 'james.wilson@example.com',
    phone: '+1 (555) 321-7890',
    status: 'active',
    createdAt: '2025-03-12T09:30:00Z',
    updatedAt: '2026-09-05T14:20:00Z'
  },
  {
    id: 'user-patient-2',
    role: 'patient',
    fullName: 'Emily Chen',
    email: 'emily.chen@example.com',
    phone: '+1 (555) 432-8901',
    status: 'active',
    createdAt: '2025-04-18T11:00:00Z',
    updatedAt: '2026-09-10T10:00:00Z'
  },
  {
    id: 'user-patient-3',
    role: 'patient',
    fullName: 'Robert Taylor',
    email: 'robert.taylor@example.com',
    phone: '+1 (555) 543-9012',
    status: 'active',
    createdAt: '2025-05-22T13:45:00Z',
    updatedAt: '2026-09-08T09:15:00Z'
  }
];

export const initialDentists: Dentist[] = [
  {
    id: 'dentist-1',
    userId: 'user-dentist-1',
    fullName: 'Dr. Marcus Vance, DDS',
    licenseReference: 'DDS-CA-84920',
    specialization: 'Orthodontics & General Dentistry',
    contact: '+1 (555) 019-7711',
    email: 'marcus.vance@dentcare.com',
    status: 'active',
    colorCode: '#2563EB',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'dentist-2',
    userId: 'user-dentist-2',
    fullName: 'Dr. Sarah Lin, DMD',
    licenseReference: 'DMD-CA-93012',
    specialization: 'Endodontics & Restorative Surgery',
    contact: '+1 (555) 019-9922',
    email: 'sarah.lin@dentcare.com',
    status: 'active',
    colorCode: '#0D9488',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813686-26154b52b362?w=150&auto=format&fit=crop&q=80'
  }
];

export const initialPatients: Patient[] = [
  {
    id: 'pat-001',
    userId: 'user-patient-1',
    patientNumber: 'DC-P-10024',
    fullName: 'James Wilson',
    dateOfBirth: '1988-04-14',
    sex: 'Male',
    phone: '+1 (555) 321-7890',
    email: 'james.wilson@example.com',
    address: '742 Evergreen Terrace, Springfield',
    emergencyContact: {
      name: 'Sarah Wilson',
      relationship: 'Spouse',
      phone: '+1 (555) 321-7899'
    },
    identificationReference: 'ID-992-41-884',
    medicalAlerts: ['Hypertension controlled'],
    allergies: ['None declared'],
    noShowCount: 0,
    requiresStaffReviewForBooking: false,
    createdAt: '2025-03-12T09:30:00Z',
    updatedAt: '2026-09-05T14:20:00Z'
  },
  {
    id: 'pat-002',
    userId: 'user-patient-2',
    patientNumber: 'DC-P-10089',
    fullName: 'Emily Chen',
    dateOfBirth: '1995-11-23',
    sex: 'Female',
    phone: '+1 (555) 432-8901',
    email: 'emily.chen@example.com',
    address: '124 Blossom Hill Road, Apt 4B',
    emergencyContact: {
      name: 'David Chen',
      relationship: 'Brother',
      phone: '+1 (555) 432-8911'
    },
    identificationReference: 'ID-734-82-192',
    medicalAlerts: ['Asthmatic', 'Sensitive Gums'],
    allergies: ['Penicillin', 'Latex (mild)'],
    noShowCount: 0,
    requiresStaffReviewForBooking: false,
    createdAt: '2025-04-18T11:00:00Z',
    updatedAt: '2026-09-10T10:00:00Z'
  },
  {
    id: 'pat-003',
    userId: 'user-patient-3',
    patientNumber: 'DC-P-10142',
    fullName: 'Robert Taylor',
    dateOfBirth: '1976-08-09',
    sex: 'Male',
    phone: '+1 (555) 543-9012',
    email: 'robert.taylor@example.com',
    address: '88 Oakridge Boulevard, Metro City',
    emergencyContact: {
      name: 'Brenda Taylor',
      relationship: 'Wife',
      phone: '+1 (555) 543-9099'
    },
    identificationReference: 'ID-482-11-509',
    medicalAlerts: ['Type 2 Diabetes'],
    allergies: ['Aspirin'],
    noShowCount: 1,
    requiresStaffReviewForBooking: false,
    createdAt: '2025-05-22T13:45:00Z',
    updatedAt: '2026-09-08T09:15:00Z'
  },
  {
    id: 'pat-004',
    patientNumber: 'DC-P-10190',
    fullName: 'Sophia Martinez',
    dateOfBirth: '2001-02-17',
    sex: 'Female',
    phone: '+1 (555) 654-0123',
    email: 'sophia.m@example.com',
    address: '310 Riverview Terrace, East Bay',
    emergencyContact: {
      name: 'Maria Martinez',
      relationship: 'Mother',
      phone: '+1 (555) 654-0199'
    },
    identificationReference: 'ID-619-33-821',
    medicalAlerts: [],
    allergies: ['None'],
    noShowCount: 0,
    requiresStaffReviewForBooking: false,
    createdAt: '2025-06-15T10:00:00Z',
    updatedAt: '2026-09-09T16:00:00Z'
  },
  {
    id: 'pat-005',
    patientNumber: 'DC-P-10205',
    fullName: 'Michael Ross',
    dateOfBirth: '1982-10-30',
    sex: 'Male',
    phone: '+1 (555) 765-1234',
    email: 'michael.ross@example.com',
    address: '502 Pine Street, Metro City',
    emergencyContact: {
      name: 'Rachel Ross',
      relationship: 'Sister',
      phone: '+1 (555) 765-1288'
    },
    identificationReference: 'ID-881-22-440',
    medicalAlerts: ['Cardiac Pacemaker (2020)'],
    allergies: ['Codeine'],
    noShowCount: 2,
    requiresStaffReviewForBooking: true,
    createdAt: '2025-07-01T08:30:00Z',
    updatedAt: '2026-09-02T11:00:00Z'
  }
];

export const initialServices: DentalService[] = [
  {
    id: 'serv-1',
    name: 'Check-up & Comprehensive Cleaning',
    description: 'Full oral examination, ultrasonic plaque & tartar scaling, polish, and diagnostic digital X-rays if needed.',
    category: 'General',
    durationMinutes: 45,
    price: 95,
    active: true,
    iconName: 'Sparkles'
  },
  {
    id: 'serv-2',
    name: 'Composite Dental Filling',
    description: 'Tooth-colored resin filling to restore cavity decay with minimal tooth removal and natural aesthetics.',
    category: 'Restorative',
    durationMinutes: 45,
    price: 160,
    active: true,
    iconName: 'ShieldCheck'
  },
  {
    id: 'serv-3',
    name: 'Tooth Extraction (Simple / Surgical)',
    description: 'Safe extraction of damaged, non-restorable teeth or impacted wisdom teeth with local anaesthesia.',
    category: 'Surgery',
    durationMinutes: 60,
    price: 210,
    active: true,
    iconName: 'Activity'
  },
  {
    id: 'serv-4',
    name: 'Root Canal Therapy (Endodontics)',
    description: 'Removal of infected pulp, thorough disinfection, shaped canal filling, and temporary restoration seal.',
    category: 'Endodontics',
    durationMinutes: 90,
    price: 780,
    active: true,
    iconName: 'HeartPulse'
  },
  {
    id: 'serv-5',
    name: 'Orthodontic Consultation & Adjustment',
    description: 'Assessment for clear aligners or traditional braces, progress check-up, archwire replacement, and tightening.',
    category: 'Orthodontics',
    durationMinutes: 30,
    price: 130,
    active: true,
    iconName: 'Smile'
  },
  {
    id: 'serv-6',
    name: 'Emergency Dental Exam & Pain Triage',
    description: 'Same-day urgent assessment for severe dental trauma, acute pulpitis, knocked-out teeth, or facial swelling.',
    category: 'General',
    durationMinutes: 30,
    price: 120,
    active: true,
    iconName: 'AlertTriangle'
  },
  {
    id: 'serv-7',
    name: 'Teeth Whitening & Enamel Care',
    description: 'Professional in-chair light-activated bleaching treatment followed by remineralizing fluoride glaze.',
    category: 'Cosmetic',
    durationMinutes: 60,
    price: 290,
    active: true,
    iconName: 'Sun'
  }
];

export const initialSchedules: DentistSchedule[] = [
  // Dr. Marcus Vance: Mon (1) to Fri (5), 08:30 - 17:30
  ...[1, 2, 3, 4, 5].map((dayOfWeek) => ({
    id: `sched-m-${dayOfWeek}`,
    dentistId: 'dentist-1',
    dayOfWeek,
    startTime: '08:30',
    endTime: '17:30',
    breakStart: '12:30',
    breakEnd: '13:30',
    active: true
  })),
  // Dr. Sarah Lin: Tue (2) to Sat (6), 09:00 - 17:00
  ...[2, 3, 4, 5, 6].map((dayOfWeek) => ({
    id: `sched-s-${dayOfWeek}`,
    dentistId: 'dentist-2',
    dayOfWeek,
    startTime: '09:00',
    endTime: '17:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    active: true
  }))
];

export const initialBlockedSchedules: BlockedSchedule[] = [
  {
    id: 'block-1',
    date: '2026-09-25',
    reason: 'Clinic Staff Continuing Education & Dental Symposium',
    isAllDay: true
  }
];

// Helper to generate ISO dates relative to current date (e.g. today, tomorrow)
export const getTodayDateString = (): string => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export const getOffsetDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const todayStr = getTodayDateString();
const tomorrowStr = getOffsetDateString(1);
const dayAfterStr = getOffsetDateString(2);
const yesterdayStr = getOffsetDateString(-1);

export const initialAppointments: Appointment[] = [
  {
    id: 'apt-001',
    appointmentNumber: 'DC-2026-9001',
    patientId: 'pat-001',
    dentistId: 'dentist-1',
    serviceId: 'serv-1',
    date: todayStr,
    startTime: '09:00',
    endTime: '09:45',
    status: 'In-Consultation',
    bookingSource: 'online_form',
    queueNumber: 1,
    notes: 'Routine 6-month checkup and prophylaxis.',
    createdAt: `${yesterdayStr}T10:00:00Z`,
    updatedAt: `${todayStr}T09:05:00Z`,
    confirmedAt: `${yesterdayStr}T14:00:00Z`,
    arrivedAt: `${todayStr}T08:50:00Z`,
    consultationStartedAt: `${todayStr}T09:05:00Z`
  },
  {
    id: 'apt-002',
    appointmentNumber: 'DC-2026-9002',
    patientId: 'pat-002',
    dentistId: 'dentist-1',
    serviceId: 'serv-2',
    date: todayStr,
    startTime: '10:00',
    endTime: '10:45',
    status: 'Waiting',
    bookingSource: 'app',
    queueNumber: 2,
    notes: 'Lower left molar filling restoration.',
    createdAt: `${yesterdayStr}T11:20:00Z`,
    updatedAt: `${todayStr}T09:40:00Z`,
    confirmedAt: `${yesterdayStr}T15:00:00Z`,
    arrivedAt: `${todayStr}T09:40:00Z`
  },
  {
    id: 'apt-003',
    appointmentNumber: 'DC-2026-9003',
    patientId: 'pat-004',
    dentistId: 'dentist-2',
    serviceId: 'serv-4',
    date: todayStr,
    startTime: '10:30',
    endTime: '12:00',
    status: 'Checked-In',
    bookingSource: 'phone_call',
    queueNumber: 3,
    notes: 'Root canal stage 2 cleaning & canal medication.',
    createdAt: `${yesterdayStr}T09:00:00Z`,
    updatedAt: `${todayStr}T10:10:00Z`,
    confirmedAt: `${yesterdayStr}T16:00:00Z`,
    arrivedAt: `${todayStr}T10:10:00Z`
  },
  {
    id: 'apt-004',
    appointmentNumber: 'DC-2026-9004',
    patientId: 'pat-003',
    dentistId: 'dentist-1',
    serviceId: 'serv-5',
    date: todayStr,
    startTime: '14:00',
    endTime: '14:30',
    status: 'Confirmed',
    bookingSource: 'online_form',
    notes: 'Aligner check-up tray #12.',
    createdAt: `${yesterdayStr}T15:30:00Z`,
    updatedAt: `${yesterdayStr}T15:30:00Z`,
    confirmedAt: `${yesterdayStr}T15:30:00Z`
  },
  {
    id: 'apt-005',
    appointmentNumber: 'DC-2026-9005',
    patientId: 'pat-005',
    dentistId: 'dentist-2',
    serviceId: 'serv-3',
    date: todayStr,
    startTime: '15:00',
    endTime: '16:00',
    status: 'Confirmed',
    bookingSource: 'walk_in',
    notes: 'Surgical extraction consultation.',
    createdAt: `${yesterdayStr}T16:00:00Z`,
    updatedAt: `${yesterdayStr}T16:00:00Z`,
    confirmedAt: `${yesterdayStr}T16:00:00Z`
  },
  // Past completed appointment with full consultation and payment
  {
    id: 'apt-000-hist',
    appointmentNumber: 'DC-2026-8990',
    patientId: 'pat-001',
    dentistId: 'dentist-1',
    serviceId: 'serv-2',
    date: yesterdayStr,
    startTime: '11:00',
    endTime: '11:45',
    status: 'Completed',
    bookingSource: 'app',
    notes: 'Upper right premolar restoration completed successfully.',
    createdAt: `${getOffsetDateString(-5)}T10:00:00Z`,
    updatedAt: `${yesterdayStr}T12:00:00Z`,
    confirmedAt: `${getOffsetDateString(-5)}T10:05:00Z`,
    arrivedAt: `${yesterdayStr}T10:50:00Z`,
    consultationStartedAt: `${yesterdayStr}T11:00:00Z`,
    completedAt: `${yesterdayStr}T11:45:00Z`
  },
  // Upcoming tomorrow
  {
    id: 'apt-006',
    appointmentNumber: 'DC-2026-9006',
    patientId: 'pat-002',
    dentistId: 'dentist-1',
    serviceId: 'serv-7',
    date: tomorrowStr,
    startTime: '11:00',
    endTime: '12:00',
    status: 'Confirmed',
    bookingSource: 'online_form',
    notes: 'Follow-up cosmetic whitening polish.',
    createdAt: `${todayStr}T08:00:00Z`,
    updatedAt: `${todayStr}T08:00:00Z`,
    confirmedAt: `${todayStr}T08:00:00Z`
  }
];

export const initialWaitlist: WaitlistEntry[] = [
  {
    id: 'wait-001',
    patientId: 'pat-004',
    preferredDentistId: 'dentist-1',
    serviceId: 'serv-1',
    preferredDate: todayStr,
    preferredTimeRange: 'afternoon',
    priority: 'normal',
    status: 'active',
    notes: 'Looking for any cancellation between 13:30 and 16:30.',
    createdAt: `${yesterdayStr}T16:00:00Z`
  },
  {
    id: 'wait-002',
    patientId: 'pat-003',
    preferredDentistId: 'dentist-2',
    serviceId: 'serv-3',
    preferredDate: tomorrowStr,
    preferredTimeRange: 'morning',
    priority: 'high',
    status: 'active',
    notes: 'Moderate discomfort on lower molar, requested morning.',
    createdAt: `${todayStr}T07:30:00Z`
  }
];

export const initialConsultations: Consultation[] = [
  {
    id: 'cons-001',
    appointmentId: 'apt-000-hist',
    dentistId: 'dentist-1',
    patientId: 'pat-001',
    examinationFindings: 'Tooth #14 exhibited occlusal surface caries extending into the dentino-enamel junction. Vitality test normal with no lingering percussion sensitivity.',
    diagnosis: 'Class I Dental Caries (#14)',
    treatmentPlan: 'Composite restoration under localized infiltration, occlusal equilibration, and remineralization counseling.',
    proceduresPerformed: [
      'Local infiltration anaesthesia (2% Lidocaine with 1:100k epinephrine)',
      'Cavity debridement & selective enamel etching',
      'Bonding agent application and incremental micro-hybrid composite placement (#14)',
      'High-gloss finishing and articulating paper check'
    ],
    prescriptions: [
      {
        id: 'rx-1',
        medication: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'Every 6-8 hours as needed for mild sensitivity',
        duration: '3 days',
        instructions: 'Take with food or a glass of milk.'
      }
    ],
    aftercareInstructions: 'Refrain from eating hard or crunchy foods for the next 24 hours. Normal gentle brushing may resume this evening. Contact clinic if bite feels elevated.',
    followUpRecommendation: {
      required: true,
      timeframeWeeks: 24,
      recommendedDate: getOffsetDateString(180),
      notes: 'Routine 6-month preventive cleaning and bitewing check.'
    },
    createdAt: `${yesterdayStr}T11:45:00Z`,
    updatedAt: `${yesterdayStr}T11:45:00Z`
  }
];

export const initialPayments: Payment[] = [
  {
    id: 'pay-001',
    appointmentId: 'apt-000-hist',
    patientId: 'pat-001',
    subtotal: 160,
    discount: 15, // loyalty discount
    insuranceCoverage: 50, // 50%
    insuranceProvider: 'Delta Dental Premier',
    insurancePolicyNumber: 'POL-884-219',
    amountPaid: 72.5,
    balance: 0,
    paymentMethod: 'Credit Card',
    paymentStatus: 'Paid',
    receiptNumber: 'REC-2026-0419',
    notes: 'Co-pay settled via terminal. Insurance claim submitted.',
    createdAt: `${yesterdayStr}T11:55:00Z`
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'user-patient-1',
    patientId: 'pat-001',
    type: 'appointment_confirmed',
    title: 'Appointment Confirmed',
    message: `Your visit for Check-up & Cleaning with Dr. Marcus Vance is scheduled for today at 09:00 AM.`,
    channel: 'in_app',
    read: false,
    sentAt: `${yesterdayStr}T14:00:00Z`,
    relatedAppointmentId: 'apt-001'
  },
  {
    id: 'notif-2',
    userId: 'user-patient-2',
    patientId: 'pat-002',
    type: 'reminder',
    title: 'Reminder: Upcoming Dental Visit',
    message: 'Your dental filling procedure is coming up today at 10:00 AM. Please arrive 10 minutes early.',
    channel: 'sms',
    read: false,
    sentAt: `${todayStr}T07:00:00Z`,
    relatedAppointmentId: 'apt-002'
  },
  {
    id: 'notif-3',
    userId: 'user-patient-4',
    patientId: 'pat-004',
    type: 'waitlist_slot_available',
    title: 'Waitlist Notification',
    message: 'You have been enrolled in the priority waitlist for today afternoon with Dr. Marcus Vance.',
    channel: 'in_app',
    read: true,
    sentAt: `${yesterdayStr}T16:05:00Z`
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    actorId: 'user-frontdesk',
    actorName: 'Clara Mendez',
    actorRole: 'front_desk',
    action: 'Appointment Check-In',
    entityType: 'appointment',
    entityId: 'apt-001',
    beforeValue: 'Confirmed',
    afterValue: 'In-Consultation',
    details: 'Verified patient ID-992-41-884, escorted to Operatory 1 with Dr. Marcus.',
    timestamp: `${todayStr}T09:05:00Z`
  },
  {
    id: 'log-2',
    actorId: 'user-patient-2',
    actorName: 'Emily Chen',
    actorRole: 'patient',
    action: 'Appointment Created',
    entityType: 'appointment',
    entityId: 'apt-002',
    afterValue: 'Confirmed',
    details: 'Booked online for Composite Dental Filling.',
    timestamp: `${yesterdayStr}T11:20:00Z`
  }
];
