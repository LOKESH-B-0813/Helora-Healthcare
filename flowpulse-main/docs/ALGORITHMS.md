# FlowPulse AI — Mathematical Models & Algorithmic Formulations

This document provides a transparent, defensible explanation of the mathematical and algorithmic models implemented in FlowPulse AI.

---

## 1. Queue Wait-Time Estimation Formulation

Hospital outpatient and diagnostic queues do not behave as static FIFO queues due to dynamic resource pooling, equipment variations, and operational congestion. FlowPulse models queue wait time with active resource scaling and non-linear congestion adjustments:

$$\text{Estimated Wait (minutes)} = \max\left(0, \left(\frac{P \times \bar{S}_{\text{nominal}}}{\max(R_{\text{active}}, 1)}\right) \times \gamma_{\text{congestion}} + \delta_{\text{operational}} + \pi_{\text{resource}}\right)$$

Where:
- $P$: Number of patients ahead in the department queue ($P \ge 0$).
- $\bar{S}_{\text{nominal}}$: Department-specific nominal service duration in minutes (e.g., Cardiology = $18\text{ min}$, Laboratory = $15\text{ min}$, Pharmacy = $8\text{ min}$).
- $R_{\text{active}}$: Number of active, on-duty resource units (consultation rooms, phlebotomy bays, or diagnostic analyzers).
- $\gamma_{\text{congestion}}$: Congestion multiplier ($\gamma \ge 1.0$) scaling with overall facility load.
- $\delta_{\text{operational}}$: Active operational delay offset caused by upstream incidents.
- $\pi_{\text{resource}}$: Resource penalty incurred when units operate in degraded or offline states.

```typescript
export function calculateEstimatedWait({
  patientsAhead,
  averageServiceMinutes,
  activeResources,
  operationalDelayMinutes = 0,
  resourcePenaltyMinutes = 0,
}: {
  patientsAhead: number
  averageServiceMinutes: number
  activeResources: number
  operationalDelayMinutes?: number
  resourcePenaltyMinutes?: number
}): number {
  const effectiveResources = Math.max(1, activeResources)
  const rawWait = Math.round(
    (patientsAhead * averageServiceMinutes) / effectiveResources,
  )
  return Math.max(0, rawWait + operationalDelayMinutes + resourcePenaltyMinutes)
}
```

---

## 2. Adaptive Arrival Window Targeting

Standard hospital scheduling systems advise all patients to arrive at fixed static offsets (e.g. "Arrive 30 minutes before appointment"). When clinics experience severe upstream backlogs, static arrival instructions cause waiting rooms to become dangerously overcrowded.

FlowPulse dynamically adjusts recommended arrival targets based on current clinic throughput:

$$\text{Target Arrival Time} = T_{\text{scheduled}} + \Delta_{\text{predicted delay}} - B_{\text{registration}} - B_{\text{safety}}$$

$$\text{Arrival Window} = [\text{Target Arrival} - 5\text{ min}, \;\; \text{Target Arrival} + 5\text{ min}]$$

Where:
- $T_{\text{scheduled}}$: Scheduled appointment time in minutes from midnight.
- $\Delta_{\text{predicted delay}}$: Predicted consultation delay based on preceding queue load.
- $B_{\text{registration}}$: Nominal check-in and vitals buffer ($5\text{ min}$).
- $B_{\text{safety}}$: Safety buffer to ensure patient is ready when called ($5\text{ min}$).

---

## 3. Multi-Stage Door-to-Door Journey Estimation

FlowPulse calculates a patient's total hospital stay duration across the complete 6-stage care pathway:

$$\text{Total Visit Duration} = D_{\text{registration}} + W_{\text{queue}} + D_{\text{consultation}} + D_{\text{diagnostics}} + D_{\text{review}} + D_{\text{pharmacy}}$$

$$\text{Expected Completion Time} = T_{\text{scheduled start}} + \text{Total Visit Duration} - R_{\text{intervention recovery}}$$

### Nominal Benchmark Durations:
| Stage | Nominal Duration | Dynamic Variance Factors |
| :--- | :--- | :--- |
| **Registration** | 5 minutes | Kiosk availability, check-in queue |
| **Queue Wait** | Dynamic (0–45 min) | Clinic queue position, doctor pace |
| **Consultation** | 15–20 minutes | Specialty complexity, patient history |
| **Diagnostics** | 15 minutes (Lab) / 30 minutes (Imaging) | Analyzer throughput, specimen transport |
| **Doctor Review** | 12 minutes | Lab result turnaround, diagnostic complexity |
| **Pharmacy & Exit** | 8 minutes | Prescription volume, dispensing queue |

---

## 4. Ripple Cascade Propagation Model

A delay in an upstream department does not stay localized. FlowPulse models the hospital as a directed flow network $G = (V, E)$, where vertices $V$ represent departments and edges $E$ represent patient flow transitions:

```
[Laboratory] ──(LIS turnaround surge)──> [Doctor Review] ──(Discharge hold)──> [Inpatient Beds] ──(Boarding)──> [Emergency Dept]
```

### Multi-Horizon Bottleneck Forecasting:
FlowPulse projects operational risk across 4 time horizons:
1. **$T_0$ (NOW)**: Real-time sensor and telemetry snapshot.
2. **$T_{+30\text{m}}$**: Immediate downstream impact on consultation and review lounges.
3. **$T_{+60\text{m}}$**: Intermediate impact on inpatient bed turnover and discharge finalization.
4. **$T_{+120\text{m}}$**: Critical cascade impact on Emergency Department boarding and ambulance diversion risk.

The composite Ripple Risk Score ($0 \le S_{\text{risk}} \le 100$) is computed as:

$$S_{\text{risk}} = w_{\text{lab}} \cdot U_{\text{lab}} + w_{\text{ed}} \cdot U_{\text{ed}} + w_{\text{bed}} \cdot (1 - \text{Avail}_{\text{beds}} / \text{Total}_{\text{beds}}) + w_{\text{hold}} \cdot N_{\text{discharge holds}}$$

---

## 5. Counterfactual Scenario Simulation Engine

When an operational bottleneck is detected, the Scenario Simulator evaluates candidate intervention strategies against the baseline escalation:

$$\Delta_{\text{outcome}}(I_k) = f(S_{\text{baseline}}, I_k) - f(S_{\text{baseline}}, \emptyset)$$

### Evaluated Dimensions:
1. **Queue Wait Reduction**: Minutes saved in diagnostic and consultation queues.
2. **ED Boarding Relief**: Reduction in emergency department boarding times.
3. **Bed Capacity Recovery**: Net inpatient beds released for acute admissions.
4. **Staff & Overtime Impact**: Additional workload placed on clinical or technical staff (`Low`, `Medium`, `High`).
5. **Operational Cost**: Relative cost of equipment activation or specimen courier routing (`Low`, `Medium`, `High`).
6. **Model Confidence Score**: Algorithmic certainty ($0–100\%$) based on historical baseline stability.

### Human-in-the-Loop Governance:
Counterfactual simulations are strictly decision-support models. FlowPulse AI requires explicit human authorization from an authorized hospital operations manager before triggering schedule recovery workflows.

---

## 6. Assumptions & Scope Boundaries

> [!IMPORTANT]
> **Operational Scope & Non-Clinical Boundaries**:
> 1. **Non-Clinical Focus**: FlowPulse AI models purely operational logistical metrics (queue lengths, arrival targets, transit times, equipment utilization, and bed availability).
> 2. **No Clinical Diagnosis or Triage**: FlowPulse AI never diagnoses medical conditions, infers clinical urgency, or alters physician-assigned triage priority.
> 3. **Prototype Parameters**: Standard service times and transition weights represent realistic hospital workflow benchmarks. In production deployments, these coefficients are calibrated against the host institution's historical EHR and LIS telemetry.
