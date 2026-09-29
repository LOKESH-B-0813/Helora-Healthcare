import type { FlowEdge, FlowGraph, FlowNode } from "./types"

// Connected patient-flow graph. Future screens render this with React Flow.
const nodes: FlowNode[] = [
  { id: "registration", label: "Registration", count: 12, status: "healthy" },
  { id: "emergency", label: "Emergency", count: 21, status: "warning" },
  { id: "opd", label: "OPD", count: 28, status: "healthy" },
  { id: "consultation", label: "Doctor Consultation", count: 17, status: "healthy" },
  { id: "laboratory", label: "Laboratory", count: 24, status: "healthy" },
  { id: "radiology", label: "Radiology", count: 15, status: "healthy" },
  { id: "review", label: "Doctor Review", count: 19, status: "warning" },
  { id: "ward", label: "Ward", count: 64, status: "healthy" },
  { id: "icu", label: "ICU", count: 14, status: "warning" },
  { id: "pharmacy", label: "Pharmacy", count: 19, status: "healthy" },
  { id: "discharge", label: "Discharge", count: 9, status: "healthy" },
]

const edges: FlowEdge[] = [
  { id: "e-reg-ed", from: "registration", to: "emergency", volume: 34, avgMinutes: 6 },
  { id: "e-reg-opd", from: "registration", to: "opd", volume: 58, avgMinutes: 4 },
  { id: "e-ed-cons", from: "emergency", to: "consultation", volume: 22, avgMinutes: 14 },
  { id: "e-ed-lab", from: "emergency", to: "laboratory", volume: 18, avgMinutes: 9 },
  { id: "e-ed-rad", from: "emergency", to: "radiology", volume: 12, avgMinutes: 11 },
  { id: "e-ed-icu", from: "emergency", to: "icu", volume: 5, avgMinutes: 18 },
  { id: "e-opd-cons", from: "opd", to: "consultation", volume: 46, avgMinutes: 22 },
  { id: "e-cons-lab", from: "consultation", to: "laboratory", volume: 31, avgMinutes: 8 },
  { id: "e-cons-rad", from: "consultation", to: "radiology", volume: 19, avgMinutes: 12 },
  { id: "e-lab-review", from: "laboratory", to: "review", volume: 38, avgMinutes: 26 },
  { id: "e-rad-review", from: "radiology", to: "review", volume: 24, avgMinutes: 21 },
  { id: "e-review-ward", from: "review", to: "ward", volume: 29, avgMinutes: 16 },
  { id: "e-review-pharm", from: "review", to: "pharmacy", volume: 27, avgMinutes: 7 },
  { id: "e-review-dc", from: "review", to: "discharge", volume: 14, avgMinutes: 19 },
  { id: "e-icu-ward", from: "icu", to: "ward", volume: 6, avgMinutes: 34 },
  { id: "e-ward-pharm", from: "ward", to: "pharmacy", volume: 21, avgMinutes: 9 },
  { id: "e-ward-dc", from: "ward", to: "discharge", volume: 18, avgMinutes: 28 },
  { id: "e-pharm-dc", from: "pharmacy", to: "discharge", volume: 33, avgMinutes: 11 },
]

export const flowGraph: FlowGraph = { nodes, edges }
