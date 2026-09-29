import { createRng, rngInt, rngPick, rngWeighted } from "./rng"
import type {
  ClinicalPriority,
  DelayRisk,
  DepartmentId,
  Patient,
  PatientStatus,
} from "./types"

const FIRST_NAMES = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael",
  "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan",
  "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Aisha",
  "Omar", "Priya", "Wei", "Sofia", "Diego", "Fatima", "Chen", "Ravi",
  "Nadia", "Marcus", "Elena", "Hassan", "Grace", "Ibrahim", "Yuki",
  "Lucas", "Amara", "Noah", "Leila",
]

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
  "Ramirez", "Lewis", "Robinson", "Patel", "Nguyen", "Kim", "Okafor",
  "Ali", "Haddad", "Rossi", "Novak", "Abbas", "Cohen",
]

const DEPARTMENT_IDS: DepartmentId[] = [
  "emergency", "general-opd", "cardiology", "laboratory", "radiology",
  "icu", "ward-a", "ward-b", "pharmacy", "discharge",
]

// Realistic forward-flow relationships between departments.
const NEXT_STAGE: Record<DepartmentId, DepartmentId[]> = {
  emergency: ["laboratory", "radiology", "icu", "ward-a"],
  "general-opd": ["laboratory", "radiology", "pharmacy", "cardiology"],
  cardiology: ["laboratory", "ward-a", "icu", "discharge"],
  laboratory: ["cardiology", "general-opd", "emergency", "discharge"],
  radiology: ["cardiology", "emergency", "ward-b", "discharge"],
  icu: ["ward-a", "ward-b"],
  "ward-a": ["pharmacy", "discharge"],
  "ward-b": ["pharmacy", "discharge"],
  pharmacy: ["discharge"],
  discharge: ["discharge"],
}

const PREV_STAGE: Record<DepartmentId, (DepartmentId | null)[]> = {
  emergency: [null, "emergency"],
  "general-opd": [null, "general-opd"],
  cardiology: ["general-opd", "emergency"],
  laboratory: ["emergency", "general-opd", "cardiology"],
  radiology: ["emergency", "general-opd"],
  icu: ["emergency", "cardiology"],
  "ward-a": ["icu", "emergency", "cardiology"],
  "ward-b": ["radiology", "icu"],
  pharmacy: ["ward-a", "ward-b", "general-opd"],
  discharge: ["ward-a", "ward-b", "pharmacy"],
}

const STATUS_BY_DEPT: Record<DepartmentId, PatientStatus[]> = {
  emergency: ["waiting", "in-treatment", "awaiting-results"],
  "general-opd": ["waiting", "in-consultation"],
  cardiology: ["waiting", "in-consultation", "in-treatment"],
  laboratory: ["awaiting-results", "waiting"],
  radiology: ["awaiting-results", "waiting"],
  icu: ["in-treatment", "admitted"],
  "ward-a": ["admitted", "ready-for-discharge"],
  "ward-b": ["admitted", "ready-for-discharge"],
  pharmacy: ["waiting", "ready-for-discharge"],
  discharge: ["ready-for-discharge", "transferring"],
}

function minutesToClock(base: number, addMinutes: number): string {
  const total = (base + addMinutes) % (24 * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function generatePatients(): Patient[] {
  const next = createRng(20260828)
  const list: Patient[] = []

  for (let i = 0; i < 112; i++) {
    const first = rngPick(next, FIRST_NAMES)
    const last = rngPick(next, LAST_NAMES)
    const currentDepartment = rngPick(next, DEPARTMENT_IDS)
    const previousDepartment = rngPick(next, PREV_STAGE[currentDepartment])
    const nextDepartment =
      currentDepartment === "discharge"
        ? null
        : rngPick(next, NEXT_STAGE[currentDepartment])

    // Arrival within the last ~6 hours, starting from 06:00.
    const arrivalOffset = rngInt(next, 0, 360)
    const arrivalMinutes = 6 * 60 + arrivalOffset
    const waitingMinutes = rngInt(next, 3, 95)

    const delayRisk = rngWeighted<DelayRisk>(next, [
      ["low", 5],
      ["moderate", 3],
      ["high", 2],
    ])
    const delayRiskScore =
      delayRisk === "high"
        ? rngInt(next, 68, 94)
        : delayRisk === "moderate"
          ? rngInt(next, 38, 67)
          : rngInt(next, 6, 37)

    const clinicalPriority = rngWeighted<ClinicalPriority>(next, [
      ["critical", 1],
      ["urgent", 3],
      ["standard", 5],
      ["low", 2],
    ])

    const status = rngPick(next, STATUS_BY_DEPT[currentDepartment])

    list.push({
      id: `PT-${String(1042 + i).padStart(5, "0")}`,
      name: `${first} ${last}`,
      age: rngInt(next, 2, 92),
      gender: next() > 0.5 ? "M" : "F",
      currentDepartment,
      previousDepartment,
      nextDepartment,
      arrivalTime: minutesToClock(arrivalMinutes, 0),
      waitingMinutes,
      status,
      predictedCompletionTime: minutesToClock(
        arrivalMinutes,
        waitingMinutes + rngInt(next, 20, 140),
      ),
      delayRisk,
      delayRiskScore,
      clinicalPriority,
    })
  }

  return list
}

export const patients: Patient[] = generatePatients()

export function patientsByDepartment(dept: DepartmentId): Patient[] {
  return patients.filter((p) => p.currentDepartment === dept)
}
