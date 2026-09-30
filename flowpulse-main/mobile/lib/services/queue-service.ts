// ============================================================================
// FlowPulse Live Queue Service
// Fetches live queue metrics, patient token position, and manages live queue progression.
// ============================================================================

import { DEMO_LIVE_QUEUE } from '../data/demo-data'
import { calculateEstimatedWait, calculateExpectedServiceTime, calculatePatientsAhead, calculateQueueStatus } from '../engines/queue-engine'
import { supabase, isSupabaseConfigured } from '../supabase/client'
import type { DepartmentId, PatientLiveQueue, QueuePatientPosition } from '../types'

export async function getLiveQueue(
  departmentId: DepartmentId = 'cardiology',
  myToken: string = 'C-023',
  overridePosition?: number,
): Promise<PatientLiveQueue> {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('department_metrics')
        .select('*')
        .eq('department_id', departmentId)
        .single()

      if (!error && data) {
        const position = overridePosition !== undefined ? overridePosition : (data.queue_position || 3)
        const ahead = calculatePatientsAhead(position)
        const wait = calculateEstimatedWait({
          patientsAhead: ahead,
          averageServiceMinutes: data.avg_service_minutes || 18,
          activeResources: data.active_resources || 3,
        })
        const serviceTime = calculateExpectedServiceTime('10:38 AM', wait)
        const status = calculateQueueStatus(wait)

        return {
          departmentId,
          departmentName: data.department_name || 'Cardiology Clinic',
          doctorId: data.doctor_id || 'DOC-101',
          doctorName: data.doctor_name || 'Dr. Ananya Rao',
          myToken,
          myPosition: position,
          patientsAhead: ahead,
          estimatedWaitMinutes: wait,
          expectedConsultationTime: serviceTime,
          currentToken: data.current_token || 'C-021',
          nextToken: data.next_token || 'C-022',
          status,
          lastUpdated: 'Live Stream',
          isLive: true,
          queueStream: DEMO_LIVE_QUEUE.queueStream,
        }
      }
    }

    if (overridePosition !== undefined) {
      const ahead = calculatePatientsAhead(overridePosition)
      const wait = calculateEstimatedWait({ patientsAhead: ahead, averageServiceMinutes: 18, activeResources: 3 })
      const serviceTime = calculateExpectedServiceTime('10:38 AM', wait)

      // Adjust queue stream based on current position
      const stream: QueuePatientPosition[] = [
        {
          token: overridePosition <= 1 ? myToken : 'C-021',
          patientName: overridePosition <= 1 ? 'Arjun Kumar' : 'Rajesh Nair',
          isSelf: overridePosition <= 1,
          position: 1,
          estimatedWaitMinutes: 0,
          expectedServiceTime: '10:38 AM',
          status: 'SERVING',
        },
        {
          token: overridePosition === 2 ? myToken : 'C-022',
          patientName: overridePosition === 2 ? 'Arjun Kumar' : 'Priya Sharma',
          isSelf: overridePosition === 2,
          position: 2,
          estimatedWaitMinutes: 7,
          expectedServiceTime: '10:45 AM',
          status: 'NEXT',
        },
        {
          token: overridePosition === 3 ? myToken : 'C-023',
          patientName: overridePosition === 3 ? 'Arjun Kumar' : 'Sunita Rao',
          isSelf: overridePosition === 3,
          position: 3,
          estimatedWaitMinutes: 14,
          expectedServiceTime: '10:52 AM',
          status: 'WAITING',
        },
        {
          token: overridePosition === 4 ? myToken : 'C-024',
          patientName: overridePosition === 4 ? 'Arjun Kumar' : 'Fatima Sheikh',
          isSelf: overridePosition === 4,
          position: 4,
          estimatedWaitMinutes: 22,
          expectedServiceTime: '11:00 AM',
          status: 'WAITING',
        },
      ]

      return {
        ...DEMO_LIVE_QUEUE,
        myPosition: overridePosition,
        patientsAhead: ahead,
        estimatedWaitMinutes: wait,
        expectedConsultationTime: serviceTime,
        status: calculateQueueStatus(wait),
        queueStream: stream,
      }
    }

    return DEMO_LIVE_QUEUE
  } catch {
    return DEMO_LIVE_QUEUE
  }
}
