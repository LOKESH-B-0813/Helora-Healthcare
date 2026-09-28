# 📡 FlowPulse API & Data Contracts Reference

FlowPulse operates on a distributed real-time data architecture connecting the Hospital Web Command Center and the Patient Mobile Application. This document defines the payload contracts, event streams, and calculation signatures.

---

## 1. Real-Time WebSocket / Supabase Broadcast Channels

### Channel: `hospital:flow-updates`
Broadcasts hospital-wide operational state shifts, scenario phase adjustments, and global bottleneck triggers.

#### Event: `STATE_CHANGE`
```typescript
interface HospitalStateChangeEvent {
  timestamp: string              // ISO-8601 UTC
  scenarioId: 'normal' | 'lab-analyzer-failure' | 'er-surge' | 'ot-delayed'
  phase: number                  // 0 = baseline, 1-5 = escalating, 6 = recovery
  timeHorizon: 'now' | '30m' | '60m' | '120m'
  hospitalHealthScore: number    // 0 - 100
  hospitalStatus: 'Stable' | 'Elevated' | 'Strained' | 'Critical'
  kpis: {
    activePatients: number
    waitingPatients: number
    labAvgWait: number
    emergencyOccupancy: number
    availableBeds: number
    activeBottlenecks: number
    rippleRiskScore: number
  }
}
```

---

### Channel: `department:queue-updates`
Streams per-department token progression, queue lengths, and doctor calling events.

#### Event: `TOKEN_CALLED`
```typescript
interface TokenCalledEvent {
  departmentId: 'emergency' | 'laboratory' | 'cardiology' | 'general-opd' | 'radiology' | 'pharmacy'
  tokenId: string                // e.g. "CARD-042"
  counterId: string              // e.g. "ROOM-203"
  patientId: string
  calledAt: string               // ISO-8601 UTC
  estimatedServiceMinutes: number
}
```

---

## 2. Smart Queue Engine Function Signatures

All core queuing algorithms are pure, stateless functions located in [`flowpulse_work/lib/engine/queue-engine.ts`](../flowpulse_work/lib/engine/queue-engine.ts).

### `calculateEstimatedWait`
Computes estimated waiting time in minutes given current queue depth and operational capacity.
```typescript
function calculateEstimatedWait(params: {
  patientsAhead: number
  averageServiceMinutes: number
  activeResources: number
  operationalDelayMinutes?: number
  resourcePenaltyMinutes?: number
}): number
```

### `calculateAdaptiveArrivalWindow`
Calculates dynamic arrival recommendations to smooth out peak waiting room congestion.
```typescript
function calculateAdaptiveArrivalWindow(
  scheduledTimeStr: string,
  predictedDelayMinutes?: number,
  registrationBuffer?: number,
  safetyBuffer?: number
): {
  recommendedArrivalWindow: string  // e.g. "10:35–10:45 AM"
  arrivalStartMinutes: number
  arrivalEndMinutes: number
  targetArrivalMinutes: number
  isAdjusted: boolean
  explanation: string
}
```

### `calculatePatientJourneyEstimate`
Generates end-to-end door-to-door visit timeline for the Patient Mobile App.
```typescript
function calculatePatientJourneyEstimate(params: {
  departmentId: DepartmentId
  scheduledTime?: string
  currentQueueWait?: number
  includeDiagnostics?: boolean
  isDiagnosticDelayed?: boolean
  diagnosticDelayMinutes?: number
}): {
  scheduledTime: string
  recommendedArrivalWindow: string
  expectedConsultation: string
  expectedWaitingMinutes: number
  totalDurationMinutes: number
  totalDurationFormatted: string
  expectedCompletionTime: string
  isAdjusted: boolean
  explanation: string
  stageBreakdown: {
    registrationMinutes: number
    queueWaitMinutes: number
    consultationMinutes: number
    diagnosticsMinutes: number
    reviewMinutes: number
    pharmacyMinutes: number
  }
}
```

---

## 3. Storage & Persistence Schema

### Local Storage Keys (Web & Mobile)

| Storage Key | Type | Description |
| :--- | :--- | :--- |
| `flowpulse_role_view` | `string` | Active staff operational persona (e.g. `operations-manager`) |
| `flowpulse_user_appointments` | `UserAppointment[]` | Patient appointment records booked via mobile or web |
| `flowpulse_theme` | `'light' \| 'dark'` | Interface theme preference |
| `flowpulse_last_synced_token` | `string` | Most recent active queue token for push updates |
