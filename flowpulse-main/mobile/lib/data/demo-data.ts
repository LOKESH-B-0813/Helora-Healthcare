// ============================================================================
// FlowPulse AI — High-Fidelity Patient Mobile Demo Data
// Realistic clinical data for demo resilience and offline hackathon testing.
// ============================================================================

import type {
  DepartmentInfo,
  Doctor,
  MobileNotification,
  PatientLiveQueue,
  PatientProfile,
  PatientVisitJourney,
  UserAppointment,
} from '../types'

export const DEMO_PATIENT: PatientProfile = {
  id: 'FP-P10023',
  name: 'Arjun Kumar',
  age: 34,
  gender: 'M',
  phone: '+91 98450 12345',
  email: 'arjun.kumar@flowpulse.demo',
  bloodGroup: 'B+ Positive',
  emergencyContact: {
    name: 'Sneha Kumar',
    relationship: 'Spouse',
    phone: '+91 98450 54321',
  },
  notificationPreferences: {
    pushEnabled: true,
    smsEnabled: true,
    queueAlerts: true,
    estimateUpdates: true,
  },
}

export const DEMO_DOCTORS: Doctor[] = [
  {
    id: 'DOC-101',
    name: 'Dr. Ananya Rao',
    departmentId: 'cardiology',
    departmentName: 'Cardiology Clinic',
    qualification: 'MD, DM Cardiology (AIIMS New Delhi)',
    skills: ['echocardiography', 'cardiac-mri', 'hypertension-management', 'preventive-cardiology'],
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&h=800&q=80',
    yearsExperience: 12,
    education: 'AIIMS New Delhi • Fellowship in Preventive Cardiology',
    languages: ['English', 'Hindi', 'Kannada'],
    nextAvailableSlot: 'Today, 10:30 AM',
    rating: 4.9,
    biography: 'Dr. Ananya Rao leads outpatient cardiology with specialized expertise in non-invasive cardiovascular screening and coordinated care.',
    specialtyTags: ['Heart Care', 'ECG', 'Cardiac Screening', 'Preventive'],
  },
  {
    id: 'DOC-102',
    name: 'Dr. Arjun Mehta',
    departmentId: 'general-opd',
    departmentName: 'General Medicine (OPD)',
    qualification: 'MBBS, MD Internal Medicine (CMC Vellore)',
    skills: ['preventive-health', 'chronic-disease-management', 'comprehensive-triage'],
    imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&h=800&q=80',
    yearsExperience: 9,
    education: 'CMC Vellore • Senior Consultant Physician',
    languages: ['English', 'Hindi', 'Marathi'],
    nextAvailableSlot: 'Today, 11:40 AM',
    rating: 4.9,
    biography: 'Dr. Arjun Mehta specializes in complex multi-system evaluations, lifestyle wellness, and rapid outpatient diagnostic review.',
    specialtyTags: ['Internal Medicine', 'Routine Consults', 'Chronic Care'],
  },
  {
    id: 'DOC-103',
    name: 'Dr. Meera Iyer',
    departmentId: 'radiology',
    departmentName: 'Radiology & Imaging',
    qualification: 'MD Radiodiagnosis (PGIMER), FRCR (London)',
    skills: ['ct-interpretation', 'mri-neuroimaging', 'ultrasonography'],
    imageUrl: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=600&h=800&q=80',
    yearsExperience: 14,
    education: 'PGIMER Chandigarh • Royal College of Radiologists (UK)',
    languages: ['English', 'Tamil', 'Hindi'],
    nextAvailableSlot: 'Today, 3:15 PM',
    rating: 4.8,
    biography: 'Dr. Meera Iyer directs advanced digital diagnostic cross-sectional imaging with high-throughput reporting.',
    specialtyTags: ['Digital X-Ray', '128-Slice CT', '3T MRI', 'Ultrasound'],
  },
  {
    id: 'DOC-104',
    name: 'Dr. Vikram Shah',
    departmentId: 'emergency',
    departmentName: 'Emergency Care',
    qualification: 'MD Emergency Medicine, MRCEM (UK)',
    skills: ['trauma-resuscitation', 'rapid-triage', 'acute-cardiac-care'],
    imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&h=800&q=80',
    yearsExperience: 11,
    education: 'KMC Manipal • Emergency Medicine Lead',
    languages: ['English', 'Hindi', 'Gujarati'],
    nextAvailableSlot: 'Walk-in (24/7 Available)',
    rating: 4.9,
    biography: 'Dr. Vikram Shah oversees the Level-1 emergency trauma bay and acute intake stabilization.',
    specialtyTags: ['24/7 Care', 'Trauma Bay', 'Rapid Resuscitation'],
  },
  {
    id: 'DOC-105',
    name: 'Dr. Priya Nair',
    departmentId: 'general-opd',
    departmentName: 'Pediatrics & Child Care',
    qualification: 'MD Pediatrics (JIPMER Puducherry)',
    skills: ['pediatric-care', 'neonatal-screening', 'child-development'],
    imageUrl: 'https://images.unsplash.com/photo-1594824813576-96b6cfa4c6db?auto=format&fit=crop&w=600&h=800&q=80',
    yearsExperience: 8,
    education: 'JIPMER Puducherry',
    languages: ['English', 'Malayalam', 'Hindi'],
    nextAvailableSlot: 'Tomorrow, 9:30 AM',
    rating: 4.9,
    biography: 'Dr. Priya Nair provides compassionate pediatric consultations, developmental screenings, and immunization care.',
    specialtyTags: ['Pediatrics', 'Immunization', 'Child Wellness'],
  },
  {
    id: 'DOC-106',
    name: 'Dr. Rahul Menon',
    departmentId: 'general-opd',
    departmentName: 'Orthopedics & Joint Care',
    qualification: 'MS Orthopedics, Fellowship in Arthroscopy',
    skills: ['joint-reconstruction', 'sports-injury', 'musculoskeletal-care'],
    imageUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&h=800&q=80',
    yearsExperience: 15,
    education: "St. John's Medical College Bengaluru",
    languages: ['English', 'Hindi', 'Kannada'],
    nextAvailableSlot: 'Tomorrow, 11:00 AM',
    rating: 4.8,
    biography: 'Dr. Rahul Menon brings deep expertise in sports medicine, joint preservation, and post-injury musculoskeletal rehabilitation.',
    specialtyTags: ['Orthopedics', 'Joint Care', 'Sports Injury'],
  },
]

export const DEMO_DEPARTMENTS: DepartmentInfo[] = [
  {
    id: 'cardiology',
    name: 'Cardiology',
    code: 'CARD',
    avgWaitMinutes: 18,
    status: 'healthy',
    description: 'Comprehensive heart care, preventive screening, ECG, and echocardiography.',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    specialties: ['Heart Care', 'ECG', 'Cardiac Screening', 'Holter'],
    activeDoctorsCount: 4,
  },
  {
    id: 'general-opd',
    name: 'General Medicine',
    code: 'OPD',
    avgWaitMinutes: 16,
    status: 'healthy',
    description: 'Routine consultations, multi-system checks, and chronic care management.',
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
    specialties: ['Internal Medicine', 'Consultation', 'Preventive Health'],
    activeDoctorsCount: 6,
  },
  {
    id: 'laboratory',
    name: 'Diagnostic Laboratory',
    code: 'LAB',
    avgWaitMinutes: 14,
    status: 'healthy',
    description: 'Automated blood biochemistry, hematology, and rapid pathology reporting.',
    imageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80',
    specialties: ['Blood Tests', 'Health Panels', 'Biochemistry'],
    activeDoctorsCount: 3,
  },
  {
    id: 'radiology',
    name: 'Radiology & Imaging',
    code: 'RAD',
    avgWaitMinutes: 11,
    status: 'healthy',
    description: 'Digital X-Ray, 128-Slice CT, 3T MRI, and high-resolution ultrasonography.',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    specialties: ['Digital X-Ray', '128-Slice CT', '3T MRI', 'Ultrasound'],
    activeDoctorsCount: 3,
  },
  {
    id: 'emergency',
    name: 'Emergency Department',
    code: 'ED',
    avgWaitMinutes: 12,
    status: 'warning',
    description: '24/7 Level-1 triage, acute resuscitation bay, and emergency trauma intake.',
    imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
    specialties: ['24/7 Care', 'Rapid Assessment', 'Trauma Bay'],
    activeDoctorsCount: 5,
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    code: 'PHARM',
    avgWaitMinutes: 8,
    status: 'healthy',
    description: 'Automated medication dispensing, prescription verification, and counseling.',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    specialties: ['Dispensing', 'Prescription Care', 'Medication Guide'],
    activeDoctorsCount: 2,
  },
]

export const DEMO_ACTIVE_APPOINTMENT: UserAppointment = {
  id: 'FP-2026-10482',
  patientId: 'FP-P10023',
  patientName: 'Arjun Kumar',
  departmentId: 'cardiology',
  departmentName: 'Cardiology',
  doctorId: 'DOC-101',
  doctorName: 'Dr. Ananya Rao',
  doctorQualification: 'MD, DM Cardiology (AIIMS)',
  doctorImageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&h=800&q=80',
  scheduledDate: 'Today, 28 Aug 2026',
  scheduledTime: '10:30 AM',
  recommendedArrivalWindow: '10:40–10:45 AM',
  expectedQueueWaitMinutes: 14,
  expectedConsultationTime: '10:52 AM',
  estimatedVisitDuration: '1 hr 25 min',
  estimatedCompletionTime: '12:05 PM',
  token: 'C-023',
  status: 'confirmed',
  createdAt: '2026-08-28T09:15:00Z',
}

export const DEMO_LIVE_QUEUE: PatientLiveQueue = {
  departmentId: 'cardiology',
  departmentName: 'Cardiology Clinic',
  doctorId: 'DOC-101',
  doctorName: 'Dr. Ananya Rao',
  myToken: 'C-023',
  myPosition: 3,
  patientsAhead: 2,
  estimatedWaitMinutes: 14,
  expectedConsultationTime: '10:52 AM',
  currentToken: 'C-021',
  nextToken: 'C-022',
  status: 'HEALTHY',
  lastUpdated: 'Moments ago',
  isLive: true,
  queueStream: [
    {
      token: 'C-021',
      patientName: 'Rajesh Nair',
      isSelf: false,
      position: 1,
      estimatedWaitMinutes: 0,
      expectedServiceTime: '10:38 AM',
      status: 'SERVING',
    },
    {
      token: 'C-022',
      patientName: 'Priya Sharma',
      isSelf: false,
      position: 2,
      estimatedWaitMinutes: 7,
      expectedServiceTime: '10:45 AM',
      status: 'NEXT',
    },
    {
      token: 'C-023',
      patientName: 'Arjun Kumar',
      isSelf: true,
      position: 3,
      estimatedWaitMinutes: 14,
      expectedServiceTime: '10:52 AM',
      status: 'WAITING',
    },
    {
      token: 'C-024',
      patientName: 'Fatima Sheikh',
      isSelf: false,
      position: 4,
      estimatedWaitMinutes: 22,
      expectedServiceTime: '11:00 AM',
      status: 'WAITING',
    },
    {
      token: 'C-025',
      patientName: 'Vikram Sengupta',
      isSelf: false,
      position: 5,
      estimatedWaitMinutes: 30,
      expectedServiceTime: '11:08 AM',
      status: 'WAITING',
    },
  ],
}

export function getDemoPatientJourney(
  scenario: 'NORMAL' | 'LAB_INCIDENT' | 'STAFF_RECOVERY' = 'NORMAL',
): PatientVisitJourney {
  let labTime = '11:15 AM'
  let labWait = 14
  let reviewTime = '11:42 AM'
  let pharmacyTime = '11:57 AM'
  let completionTime = '12:07 PM'
  let alertMessage: string | null = null
  let hasDelay = false
  let delayMinutes = 0
  let isRecovered = false
  let recoveredMinutes = 0

  if (scenario === 'LAB_INCIDENT') {
    labTime = '11:31 AM'
    labWait = 34
    reviewTime = '11:58 AM'
    pharmacyTime = '12:10 PM'
    completionTime = '12:16 PM'
    hasDelay = true
    delayMinutes = 16
    alertMessage =
      'Your visit estimate has been updated (+16m) because Diagnostic Laboratory analyzer LAB-AN-02 is experiencing temporary maintenance. Care team is coordinating backup throughput.'
  } else if (scenario === 'STAFF_RECOVERY') {
    labTime = '11:18 AM'
    labWait = 20
    reviewTime = '11:45 AM'
    pharmacyTime = '11:58 AM'
    completionTime = '12:07 PM'
    isRecovered = true
    recoveredMinutes = 9
    alertMessage =
      'Hospital flow improving: Backup analyzer activated by hospital operations. Your expected completion is now 12:07 PM (9 minutes earlier than previous estimate).'
  }

  return {
    patientId: 'FP-P10023',
    patientName: 'Arjun Kumar',
    appointmentId: 'FP-2026-10482',
    departmentName: 'Cardiology',
    doctorName: 'Dr. Ananya Rao',
    doctorImageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&h=800&q=80',
    appointmentTime: '10:30 AM',
    recommendedArrival: '10:40 AM',
    currentQueuePosition: 3,
    patientsAhead: 2,
    currentWaitMinutes: 14,
    estimatedCompletionTime: completionTime,
    remainingVisitTime: scenario === 'LAB_INCIDENT' ? '1 hr 29 min' : '1 hr 13 min',
    alertMessage,
    hasDiagnosticDelay: hasDelay,
    diagnosticDelayMinutes: delayMinutes,
    isRecovered,
    recoveredMinutes,
    stages: [
      {
        id: 'stg-1',
        stageId: 'registration',
        name: 'Registration & Triage',
        status: 'completed',
        scheduledTime: '10:30 AM',
        actualOrEstimatedTime: '10:34 AM',
        location: 'Ground Floor • Desk 3',
        note: 'Completed on-time. Vitals recorded.',
        badgeLabel: 'Completed',
        badgeTone: 'healthy',
      },
      {
        id: 'stg-2',
        stageId: 'consultation',
        name: 'Cardiology Consultation',
        status: 'in-progress',
        scheduledTime: '10:40 AM',
        actualOrEstimatedTime: '10:48 AM',
        waitMinutes: 14,
        location: '2nd Floor • Suite 204',
        note: 'Current Stage • Token C-023 • Dr. Ananya Rao',
        badgeLabel: 'Current Stage',
        badgeTone: 'healthy',
      },
      {
        id: 'stg-3',
        stageId: 'laboratory',
        name: 'Diagnostic Laboratory',
        status: 'upcoming',
        scheduledTime: '11:05 AM',
        actualOrEstimatedTime: labTime,
        waitMinutes: labWait,
        location: '1st Floor • Central Lab (Blood Panel)',
        note: hasDelay ? 'Expected wait increased due to analyzer maintenance' : 'Standard blood chemistry & lipid profile',
        badgeLabel: hasDelay ? `+${delayMinutes}m delay` : undefined,
        badgeTone: hasDelay ? 'warning' : 'neutral',
      },
      {
        id: 'stg-4',
        stageId: 'review',
        name: 'Doctor Review',
        status: 'upcoming',
        scheduledTime: '11:30 AM',
        actualOrEstimatedTime: reviewTime,
        location: '2nd Floor • Suite 204',
        note: 'Consultation & lab report discussion with Dr. Ananya Rao',
        badgeLabel: undefined,
        badgeTone: 'neutral',
      },
      {
        id: 'stg-5',
        stageId: 'pharmacy',
        name: 'Pharmacy Dispensing',
        status: 'upcoming',
        scheduledTime: '11:45 AM',
        actualOrEstimatedTime: pharmacyTime,
        location: 'Ground Floor • Pharmacy Counter B',
        note: 'Prescription pickup & dosage guidelines',
        badgeLabel: undefined,
        badgeTone: 'neutral',
      },
      {
        id: 'stg-6',
        stageId: 'discharge',
        name: 'Visit Complete',
        status: 'upcoming',
        scheduledTime: '12:00 PM',
        actualOrEstimatedTime: completionTime,
        location: 'Exit Lounge',
        note: 'Digital visit summary and receipt sent to mobile app',
        badgeLabel: isRecovered ? `${recoveredMinutes}m Recovered` : undefined,
        badgeTone: isRecovered ? 'healthy' : 'neutral',
      },
    ],
  }
}

export const INITIAL_NOTIFICATIONS: MobileNotification[] = [
  {
    id: 'notif-1',
    category: 'queue',
    title: 'Queue Position Update',
    message: 'You are now #3 in the Cardiology queue (Token C-023). Estimated wait is 14 minutes.',
    timestamp: '10:35 AM',
    read: false,
    tone: 'healthy',
    actionRoute: '/(tabs)/queue',
  },
  {
    id: 'notif-2',
    category: 'appointment',
    title: 'Appointment Confirmed',
    message: 'Your Cardiology visit with Dr. Ananya Rao is scheduled for today at 10:30 AM.',
    timestamp: '09:15 AM',
    read: true,
    tone: 'healthy',
    actionRoute: '/(tabs)/appointments',
  },
]
