import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseFHIRBundle,
  FHIRPatientResource,
  FHIREncounterResource,
} from '../lib/integrations/fhir-parser'

describe('FlowPulse EHR / FHIR HL7 Clinical Parser', () => {
  it('correctly maps FHIR R4 Patient and Encounter resources into internal models', () => {
    const fhirPatient: FHIRPatientResource = {
      resourceType: 'Patient',
      id: 'P9842',
      name: [{ family: 'Kumar', given: ['Arjun'] }],
      gender: 'male',
      birthDate: '1990-05-14',
      telecom: [{ system: 'phone', value: '+91 98450 12345' }],
    }

    const fhirEncounter: FHIREncounterResource = {
      resourceType: 'Encounter',
      id: 'ENC-01',
      status: 'in-progress',
      class: { code: 'AMB', display: 'ambulatory' },
      subject: { reference: 'Patient/P9842', display: 'Arjun Kumar' },
      serviceProvider: { display: 'Cardiology' },
    }

    const parsed = parseFHIRBundle(fhirPatient, fhirEncounter)

    assert.equal(parsed.id, 'FP-P9842')
    assert.equal(parsed.name, 'Arjun Kumar')
    assert.equal(parsed.gender, 'M')
    assert.equal(parsed.status, 'admitted')
    assert.equal(parsed.department, 'Cardiology')
    assert.equal(parsed.phoneNumber, '+91 98450 12345')
  })
})
