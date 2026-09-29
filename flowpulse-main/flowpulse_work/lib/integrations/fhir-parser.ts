// ============================================================================
// FlowPulse AI — EHR / FHIR HL7 R4 Ingestion & Clinical Resource Parser
// Parses HL7 FHIR Patient, Encounter, and Appointment resources into FlowPulse state.
// ============================================================================

export interface FHIRPatientResource {
  resourceType: 'Patient'
  id: string
  name: [{ family: string; given: string[] }]
  gender: string
  birthDate: string
  telecom?: [{ system: string; value: string }]
}

export interface FHIREncounterResource {
  resourceType: 'Encounter'
  id: string
  status: 'planned' | 'arrived' | 'in-progress' | 'finished'
  class: { code: string; display: string }
  subject: { reference: string; display: string }
  serviceProvider?: { display: string }
  period?: { start: string; end?: string }
}

export interface FlowPulsePatientIngest {
  id: string
  name: string
  gender: string
  birthDate: string
  phoneNumber?: string
  status: 'admitted' | 'in-transit' | 'waiting' | 'discharged'
  department: string
}

/**
 * Parses a standard FHIR Patient & Encounter bundle into FlowPulse internal data model.
 */
export function parseFHIRBundle(
  patient: FHIRPatientResource,
  encounter?: FHIREncounterResource,
): FlowPulsePatientIngest {
  const given = patient.name[0]?.given?.join(' ') || ''
  const family = patient.name[0]?.family || ''
  const fullName = `${given} ${family}`.trim() || 'Anonymous Patient'

  const phone = patient.telecom?.find((t) => t.system === 'phone')?.value

  let status: FlowPulsePatientIngest['status'] = 'waiting'
  if (encounter) {
    if (encounter.status === 'in-progress') status = 'admitted'
    else if (encounter.status === 'arrived') status = 'waiting'
    else if (encounter.status === 'finished') status = 'discharged'
  }

  const department = encounter?.serviceProvider?.display || 'General Medicine'

  return {
    id: `FP-${patient.id}`,
    name: fullName,
    gender: patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : 'Other',
    birthDate: patient.birthDate,
    phoneNumber: phone,
    status,
    department,
  }
}
