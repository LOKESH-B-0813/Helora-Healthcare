// ============================================================================
// FlowPulse Smart Queue Engine (Mobile Local)
// Centralized pure calculation utilities for queue position, wait times, and status.
// ============================================================================

import type { QueueStatus } from '../types'
import { QUEUE_THRESHOLDS } from '../constants/timings'

/**
 * Parses time string (e.g. "10:30 AM", "11:45") into total minutes from midnight.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 10 * 60 + 30
  const match = timeStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i)
  if (!match) return 10 * 60 + 30

  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const meridian = match[3]?.toUpperCase()

  if (meridian === 'PM' && hours < 12) hours += 12
  if (meridian === 'AM' && hours === 12) hours = 0

  return hours * 60 + minutes
}

/**
 * Formats total minutes from midnight into 12-hour string (e.g. "11:45 AM").
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60)
  const hours24 = Math.floor(normalized / 60)
  const minutes = normalized % 60
  const hours12 = hours24 % 12 || 12
  const meridian = hours24 >= 12 ? 'PM' : 'AM'
  return `${hours12}:${String(minutes).padStart(2, '0')} ${meridian}`
}

/**
 * Calculates number of patients ahead based on 1-indexed queue position.
 */
export function calculatePatientsAhead(queuePosition: number): number {
  return Math.max(0, queuePosition - 1)
}

/**
 * Calculates queue position given patients ahead.
 */
export function calculateQueuePosition(patientsAhead: number): number {
  return Math.max(1, patientsAhead + 1)
}

/**
 * Calculates estimated wait time in minutes:
 * wait = ((patientsAhead * averageServiceMinutes) / effectiveResources) + operationalDelay
 */
export function calculateEstimatedWait({
  patientsAhead,
  averageServiceMinutes = 18,
  activeResources = 3,
  operationalDelayMinutes = 0,
}: {
  patientsAhead: number
  averageServiceMinutes?: number
  activeResources?: number
  operationalDelayMinutes?: number
}): number {
  const effectiveResources = Math.max(1, activeResources)
  const baseWait = Math.round((patientsAhead * averageServiceMinutes) / effectiveResources)
  return Math.max(0, baseWait + operationalDelayMinutes)
}

/**
 * Calculates expected consultation / service time from arrival or reference time.
 */
export function calculateExpectedServiceTime(
  baseTimeStr: string,
  waitMinutes: number,
): string {
  const baseMinutes = parseTimeToMinutes(baseTimeStr)
  return formatMinutesToTime(baseMinutes + waitMinutes)
}

/**
 * Evaluates queue status category from wait time and capacity.
 */
export function calculateQueueStatus(
  waitMinutes: number,
  capacityRatio: number = 1.0,
): QueueStatus {
  if (waitMinutes >= QUEUE_THRESHOLDS.criticalMinWait || capacityRatio < 0.6) {
    return 'CRITICAL'
  }
  if (waitMinutes >= QUEUE_THRESHOLDS.warningMaxWait || capacityRatio < 0.75) {
    return 'WARNING'
  }
  if (waitMinutes >= QUEUE_THRESHOLDS.moderateMaxWait || capacityRatio < 0.9) {
    return 'MODERATE'
  }
  return 'HEALTHY'
}
