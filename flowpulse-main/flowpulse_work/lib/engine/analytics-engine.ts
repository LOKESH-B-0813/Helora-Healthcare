// ============================================================================
// FlowPulse AI — Advanced Healthcare Analytics & Throughput Engine
// Computes operational efficiency scores, doctor throughput, and peak arrival heatmaps.
// ============================================================================

import type { DepartmentId } from '../data/types'

export interface HourlyTrafficSlot {
  hour: number // 0-23
  label: string // e.g. "10:00 AM"
  arrivalVolume: number
  throughputVolume: number
  congestionRisk: 'low' | 'moderate' | 'high' | 'critical'
}

export interface DepartmentEfficiencyScore {
  departmentId: DepartmentId
  departmentName: string
  efficiencyScore: number // 0 - 100
  avgTurnaroundMinutes: number
  targetTurnaroundMinutes: number
  utilizationRate: number
  throughputPerHour: number
  grade: 'A+' | 'A' | 'B' | 'C' | 'D'
}

export interface PhysicianProductivityMetrics {
  doctorId: string
  doctorName: string
  departmentId: DepartmentId
  patientsSeenToday: number
  avgConsultMinutes: number
  onTimePunctualityScore: number // 0 - 100%
  patientSatisfactionRating: number // 0 - 5.0
}

/**
 * Computes hourly hospital arrival and throughput distribution across the clinical day.
 */
export function generateHourlyTrafficDistribution(): HourlyTrafficSlot[] {
  const slots: HourlyTrafficSlot[] = []

  const baseCurve = [
    { h: 8, arr: 18, thr: 12 },
    { h: 9, arr: 42, thr: 28 },
    { h: 10, arr: 64, thr: 46 },
    { h: 11, arr: 58, thr: 50 },
    { h: 12, arr: 35, thr: 42 },
    { h: 13, arr: 22, thr: 26 },
    { h: 14, arr: 48, thr: 38 },
    { h: 15, arr: 52, thr: 44 },
    { h: 16, arr: 38, thr: 40 },
    { h: 17, arr: 25, thr: 30 },
  ]

  for (const item of baseCurve) {
    const hours12 = item.h % 12 || 12
    const meridian = item.h >= 12 ? 'PM' : 'AM'
    const label = `${hours12}:00 ${meridian}`

    const netLoad = item.arr - item.thr
    let congestionRisk: HourlyTrafficSlot['congestionRisk'] = 'low'
    if (netLoad > 15) congestionRisk = 'critical'
    else if (netLoad > 8) congestionRisk = 'high'
    else if (netLoad > 3) congestionRisk = 'moderate'

    slots.push({
      hour: item.h,
      label,
      arrivalVolume: item.arr,
      throughputVolume: item.thr,
      congestionRisk,
    })
  }

  return slots
}

/**
 * Calculates operational performance and efficiency score for a department.
 */
export function calculateDepartmentEfficiency({
  departmentId,
  departmentName,
  currentOccupancy,
  capacity,
  avgWaitMinutes,
  nominalServiceMinutes = 18,
}: {
  departmentId: DepartmentId
  departmentName: string
  currentOccupancy: number
  capacity: number
  avgWaitMinutes: number
  nominalServiceMinutes?: number
}): DepartmentEfficiencyScore {
  const utilizationRate = Math.min(100, Math.round((currentOccupancy / Math.max(1, capacity)) * 100))
  
  // Score formula: balance utilization (ideal 70-85%) with low wait times
  let efficiency = 100
  if (utilizationRate > 90) efficiency -= 20
  else if (utilizationRate < 40) efficiency -= 15

  if (avgWaitMinutes > 30) efficiency -= 25
  else if (avgWaitMinutes > 20) efficiency -= 10

  const efficiencyScore = Math.max(20, Math.min(100, efficiency))

  let grade: DepartmentEfficiencyScore['grade'] = 'A'
  if (efficiencyScore >= 90) grade = 'A+'
  else if (efficiencyScore >= 80) grade = 'A'
  else if (efficiencyScore >= 70) grade = 'B'
  else if (efficiencyScore >= 60) grade = 'C'
  else grade = 'D'

  const throughputPerHour = Math.round((60 / Math.max(5, nominalServiceMinutes)) * (capacity * 0.7))

  return {
    departmentId,
    departmentName,
    efficiencyScore,
    avgTurnaroundMinutes: avgWaitMinutes + nominalServiceMinutes,
    targetTurnaroundMinutes: nominalServiceMinutes + 10,
    utilizationRate,
    throughputPerHour,
    grade,
  }
}
