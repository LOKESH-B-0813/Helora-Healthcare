import { IMAGES } from "./images"
import type { Department, Hospital } from "./types"

export const hospital: Hospital = {
  id: "metro-general",
  name: "Metro General Hospital",
  region: "Bengaluru Central, Karnataka",
  totalBeds: 120,
  departmentCount: 10,
}

/** Additional facilities shown in the hospital selector. */
export const facilities: Hospital[] = [
  hospital,
  {
    id: "riverside",
    name: "Riverside Medical Center",
    region: "Whitefield Hub",
    totalBeds: 210,
    departmentCount: 14,
  },
  {
    id: "st-agnes",
    name: "St. Agnes Children's Hospital",
    region: "Indiranagar",
    totalBeds: 96,
    departmentCount: 9,
  },
  {
    id: "harbor-view",
    name: "Harbor View Specialty Trauma",
    region: "Koramangala",
    totalBeds: 158,
    departmentCount: 12,
  },
]

export const departments: Department[] = [
  {
    id: "cardiology",
    name: "Cardiology",
    code: "CARD",
    capacity: 18,
    currentOccupancy: 13,
    staffOnDuty: 9,
    utilization: 72,
    avgWaitMinutes: 26,
    status: "healthy",
    description:
      "Comprehensive cardiovascular consultation, preventive cardiac screening, and coordinated diagnostic care.",
    imageUrl: IMAGES.departments.cardiology,
    specialties: ["ECG", "Heart Care", "Cardiac Screening", "Holter"],
  },
  {
    id: "emergency",
    name: "Emergency Care",
    code: "ED",
    capacity: 24,
    currentOccupancy: 21,
    staffOnDuty: 14,
    utilization: 88,
    avgWaitMinutes: 18,
    status: "warning",
    description:
      "24/7 Level-1 rapid triage, acute resuscitation, and coordinated emergency trauma support.",
    imageUrl: IMAGES.departments.emergency,
    specialties: ["24/7 Care", "Rapid Assessment", "Trauma Bay", "Resuscitation"],
  },
  {
    id: "general-opd",
    name: "General Medicine (OPD)",
    code: "OPD",
    capacity: 40,
    currentOccupancy: 28,
    staffOnDuty: 16,
    utilization: 70,
    avgWaitMinutes: 22,
    status: "healthy",
    description:
      "Outpatient consultations, routine clinical evaluations, and chronic disease management with adaptive arrival times.",
    imageUrl: IMAGES.departments.generalOpd,
    specialties: ["Internal Medicine", "Consultation", "Preventive Health"],
  },
  {
    id: "laboratory",
    name: "Diagnostic Laboratory",
    code: "LAB",
    capacity: 60,
    currentOccupancy: 44,
    staffOnDuty: 11,
    utilization: 74,
    avgWaitMinutes: 31,
    status: "healthy",
    description:
      "Fully automated biochemistry, hematology, and pathology diagnostics connected directly to patient care pathways.",
    imageUrl: IMAGES.departments.laboratory,
    specialties: ["Blood Tests", "Health Panels", "Biochemistry", "Pathology"],
  },
  {
    id: "radiology",
    name: "Radiology & Imaging",
    code: "RAD",
    capacity: 30,
    currentOccupancy: 22,
    staffOnDuty: 8,
    utilization: 73,
    avgWaitMinutes: 28,
    status: "healthy",
    description:
      "Digital X-Ray, 128-slice CT, 3T MRI, and ultrasonography with real-time study queue optimization.",
    imageUrl: IMAGES.departments.radiology,
    specialties: ["Digital X-Ray", "128-Slice CT", "3T MRI", "Ultrasound"],
  },
  {
    id: "icu",
    name: "Critical Care (ICU)",
    code: "ICU",
    capacity: 16,
    currentOccupancy: 14,
    staffOnDuty: 18,
    utilization: 88,
    avgWaitMinutes: 0,
    status: "warning",
    description:
      "Multi-disciplinary intensive care unit with advanced invasive hemodynamic monitoring and continuous telemetry.",
    imageUrl: IMAGES.departments.icu,
    specialties: ["Intensive Care", "Mechanical Ventilation", "Continuous Telemetry"],
  },
  {
    id: "ward-a",
    name: "Inpatient Ward A",
    code: "WA",
    capacity: 42,
    currentOccupancy: 34,
    staffOnDuty: 15,
    utilization: 81,
    avgWaitMinutes: 0,
    status: "healthy",
    description:
      "Post-surgical recovery and acute inpatient medical ward coordinated with dynamic bed turnover scheduling.",
    imageUrl: IMAGES.departments.wardA,
    specialties: ["Post-Surgical", "Inpatient Care", "Nursing Rounds"],
  },
  {
    id: "ward-b",
    name: "Inpatient Ward B",
    code: "WB",
    capacity: 42,
    currentOccupancy: 30,
    staffOnDuty: 14,
    utilization: 71,
    avgWaitMinutes: 0,
    status: "healthy",
    description:
      "Step-down medical observation and recovery wing with streamlined discharge transition planning.",
    imageUrl: IMAGES.departments.wardB,
    specialties: ["Observation", "Step-Down", "Convalescence"],
  },
  {
    id: "pharmacy",
    name: "Hospital Pharmacy",
    code: "RX",
    capacity: 50,
    currentOccupancy: 19,
    staffOnDuty: 7,
    utilization: 38,
    avgWaitMinutes: 12,
    status: "healthy",
    description:
      "Centralized pharmacy dispensing integrated with electronic prescriptions for rapid medication delivery.",
    imageUrl: IMAGES.departments.pharmacy,
    specialties: ["E-Prescriptions", "Medication Dispense", "Clinical Counseling"],
  },
  {
    id: "discharge",
    name: "Discharge Coordination",
    code: "DC",
    capacity: 20,
    currentOccupancy: 9,
    staffOnDuty: 5,
    utilization: 45,
    avgWaitMinutes: 34,
    status: "healthy",
    description:
      "Expedited discharge planning, billing reconciliation, and rapid bed-sanitization turnover signaling.",
    imageUrl: IMAGES.departments.discharge,
    specialties: ["Discharge Clearance", "Bed Turnover", "Patient Follow-up"],
  },
]

export const departmentMap: Record<string, Department> = Object.fromEntries(
  departments.map((d) => [d.id, d]),
)
