// ============================================================================
// FlowPulse AI — Doctor Shift & On-Call Clinical Schedule Matrix
// Defines weekly clinical rosters, on-call trauma surgeons, and OPD consulting hours.
// ============================================================================

import type { DepartmentId } from './types'

export type ShiftType = 'morning' | 'evening' | 'night-oncall' | 'trauma-standby'

export interface DoctorScheduleSlot {
  doctorId: string
  doctorName: string
  departmentId: DepartmentId
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  shift: ShiftType
  startTime: string
  endTime: string
  roomNumber: string
  maxAppointmentCapacity: number
  isAcceptingWalkIns: boolean
}

export const DOCTOR_SCHEDULES: DoctorScheduleSlot[] = [
  {
    doctorId: 'DOC-101',
    doctorName: 'Dr. Ananya Rao',
    departmentId: 'cardiology',
    dayOfWeek: 'Monday',
    shift: 'morning',
    startTime: '09:00 AM',
    endTime: '01:30 PM',
    roomNumber: 'Suite 204',
    maxAppointmentCapacity: 16,
    isAcceptingWalkIns: true,
  },
  {
    doctorId: 'DOC-101',
    doctorName: 'Dr. Ananya Rao',
    departmentId: 'cardiology',
    dayOfWeek: 'Wednesday',
    shift: 'evening',
    startTime: '02:30 PM',
    endTime: '07:00 PM',
    roomNumber: 'Suite 204',
    maxAppointmentCapacity: 14,
    isAcceptingWalkIns: false,
  },
  {
    doctorId: 'DOC-102',
    doctorName: 'Dr. Arjun Mehta',
    departmentId: 'general-opd',
    dayOfWeek: 'Monday',
    shift: 'morning',
    startTime: '08:30 AM',
    endTime: '01:00 PM',
    roomNumber: 'Room 102',
    maxAppointmentCapacity: 24,
    isAcceptingWalkIns: true,
  },
  {
    doctorId: 'DOC-104',
    doctorName: 'Dr. Vikram Shah',
    departmentId: 'emergency',
    dayOfWeek: 'Monday',
    shift: 'night-oncall',
    startTime: '08:00 PM',
    endTime: '08:00 AM',
    roomNumber: 'Trauma Bay 1',
    maxAppointmentCapacity: 40,
    isAcceptingWalkIns: true,
  },
]

/**
 * Returns available doctors for a specific department and day.
 */
export function getDoctorsByRoster(
  departmentId: DepartmentId,
  day: DoctorScheduleSlot['dayOfWeek'] = 'Monday',
): DoctorScheduleSlot[] {
  return DOCTOR_SCHEDULES.filter(
    (s) => s.departmentId === departmentId && s.dayOfWeek === day,
  )
}
