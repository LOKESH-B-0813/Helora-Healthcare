import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getHospitalCampus,
  getDepartmentLocationInfo,
  formatFloorLabel,
  calculateIndoorDirections,
  getLivePatientIndoorLocation,
} from '../lib/engine/location-engine'
import { HOSPITAL_NETWORKS } from '../lib/data/hospital-locations'

describe('FlowPulse Hospital Location & Wayfinding Engine', () => {
  it('returns valid hospital campus metadata with full names and address', () => {
    const campus = getHospitalCampus('metro-general')
    assert.equal(campus.id, 'metro-general')
    assert.equal(campus.name, 'Metro General Hospital')
    assert.ok(campus.address.includes('Victoria Road'))
    assert.ok(campus.totalBeds > 0)
    assert.ok(campus.buildings.length > 0)
  })

  it('lists all hospital campuses in the healthcare network', () => {
    assert.ok(HOSPITAL_NETWORKS.length >= 4)
    const names = HOSPITAL_NETWORKS.map((h) => h.name)
    assert.ok(names.includes('Metro General Hospital'))
    assert.ok(names.includes('Riverside Medical Center'))
    assert.ok(names.includes("St. Agnes Children's & Specialty Hospital"))
    assert.ok(names.includes('Harbor View Specialty Trauma Center'))
  })

  it('locates department indoor positioning with floor and room info', () => {
    const cardLoc = getDepartmentLocationInfo('metro-general', 'cardiology')
    assert.ok(cardLoc !== null)
    assert.equal(cardLoc?.buildingCode, 'BLOCK-C')
    assert.equal(cardLoc?.floorNumber, 2)
    assert.ok(cardLoc?.location.roomNumber.includes('204'))
    assert.ok(cardLoc?.location.nearestElevator !== undefined)
  })

  it('formats floor labels accurately', () => {
    assert.equal(formatFloorLabel(0), 'Ground Floor (Level 0)')
    assert.equal(formatFloorLabel(1), '1st Floor (Level 1)')
    assert.equal(formatFloorLabel(2), '2nd Floor (Level 2)')
  })

  it('calculates turn-by-turn indoor route between departments', () => {
    const route = calculateIndoorDirections('metro-general', 'cardiology', 'laboratory')
    assert.ok(route.steps.length >= 3)
    assert.ok(route.totalDistanceMeters > 0)
    assert.ok(route.totalWalkMinutes >= 1)
    assert.equal(route.requiresElevator, true)
    assert.ok(route.steps.some((s) => s.iconType === 'elevator'))
  })

  it('computes live patient indoor geolocation status', () => {
    const liveLoc = getLivePatientIndoorLocation('metro-general', 'cardiology', 'laboratory')
    assert.equal(liveLoc.departmentName, 'Cardiology Institute & ECG Bay')
    assert.equal(liveLoc.floorNumber, 2)
    assert.equal(liveLoc.geofenceState, 'inside-room')
    assert.ok(liveLoc.distanceToDestinationMeters > 0)
  })
})
