// ============================================================================
// FlowPulse Hospital Indoor Location & Wayfinding Engine
// Computes real-time patient indoor positioning, geofencing, and step-by-step navigation.
// ============================================================================

import {
  HOSPITAL_NETWORKS,
  HospitalCampus,
  FloorDepartmentLocation,
} from '../data/hospital-locations'
import type { DepartmentId } from '../data/types'

export interface WayfindingStep {
  stepNumber: number
  instruction: string
  distanceMeters: number
  estimatedSeconds: number
  iconType: 'start' | 'walk' | 'elevator' | 'turn-left' | 'turn-right' | 'arrive'
  floorTransition?: {
    fromFloor: number
    toFloor: number
    elevatorName: string
  }
}

export interface NavigationRoute {
  hospitalName: string
  originDepartment: string
  destinationDepartment: string
  originBuilding: string
  destinationBuilding: string
  totalDistanceMeters: number
  totalWalkMinutes: number
  estimatedCaloriesBurned: number
  requiresElevator: boolean
  steps: WayfindingStep[]
}

export interface LiveLocationStatus {
  hospitalId: string
  hospitalName: string
  buildingName: string
  buildingCode: string
  floorNumber: number
  floorLabel: string
  departmentName: string
  roomNumber: string
  coordinates: { x: number; y: number }
  geofenceState: 'inside-room' | 'in-transit-corridor' | 'campus-perimeter' | 'approaching'
  distanceToDestinationMeters: number
  walkingEtaMinutes: number
}

/**
 * Returns the hospital campus details by ID (defaults to Metro General).
 */
export function getHospitalCampus(hospitalId: string = 'metro-general'): HospitalCampus {
  const found = HOSPITAL_NETWORKS.find((h) => h.id === hospitalId)
  return found || HOSPITAL_NETWORKS[0]
}

/**
 * Retrieves the exact indoor location details for a given department.
 */
export function getDepartmentLocationInfo(
  hospitalId: string = 'metro-general',
  departmentId: DepartmentId,
): {
  buildingId: string
  buildingName: string
  buildingCode: string
  floorNumber: number
  floorName: string
  location: FloorDepartmentLocation
} | null {
  const campus = getHospitalCampus(hospitalId)

  for (const building of campus.buildings) {
    for (const floor of building.floors) {
      const dept = floor.departments.find((d) => d.departmentId === departmentId)
      if (dept) {
        return {
          buildingId: building.id,
          buildingName: building.name,
          buildingCode: building.code,
          floorNumber: floor.floorNumber,
          floorName: floor.floorName,
          location: dept,
        }
      }
    }
  }

  return null
}

/**
 * Formats floor integer into human-readable label.
 */
export function formatFloorLabel(floorNumber: number): string {
  if (floorNumber === 0) return 'Ground Floor (Level 0)'
  if (floorNumber === 1) return '1st Floor (Level 1)'
  if (floorNumber === 2) return '2nd Floor (Level 2)'
  if (floorNumber === 3) return '3rd Floor (Level 3)'
  return `Floor ${floorNumber}`
}

/**
 * Computes turn-by-turn indoor wayfinding instructions between two hospital units.
 */
export function calculateIndoorDirections(
  hospitalId: string = 'metro-general',
  fromDeptId: DepartmentId = 'general-opd',
  toDeptId: DepartmentId = 'cardiology',
): NavigationRoute {
  const campus = getHospitalCampus(hospitalId)
  const fromInfo = getDepartmentLocationInfo(hospitalId, fromDeptId)
  const toInfo = getDepartmentLocationInfo(hospitalId, toDeptId)

  const originName = fromInfo ? fromInfo.location.departmentName : 'Hospital Entrance'
  const destName = toInfo ? toInfo.location.departmentName : 'Destination Department'
  const originBuilding = fromInfo ? fromInfo.buildingName : 'Main Hospital Atrium'
  const destBuilding = toInfo ? toInfo.buildingName : 'Main Hospital Atrium'

  const sameBuilding = fromInfo && toInfo && fromInfo.buildingId === toInfo.buildingId
  const sameFloor = fromInfo && toInfo && fromInfo.floorNumber === toInfo.floorNumber

  const steps: WayfindingStep[] = []
  let stepCount = 1

  // Step 1: Start
  steps.push({
    stepNumber: stepCount++,
    instruction: `Start at ${originName} (${fromInfo ? fromInfo.location.roomNumber : 'Main Reception Desk'}).`,
    distanceMeters: 0,
    estimatedSeconds: 0,
    iconType: 'start',
  })

  // Step 2: Corridors / Building Transition
  if (!sameBuilding && fromInfo && toInfo) {
    steps.push({
      stepNumber: stepCount++,
      instruction: `Exit ${fromInfo.buildingCode} via the central glass connector concourse towards ${toInfo.buildingCode}.`,
      distanceMeters: 45,
      estimatedSeconds: 35,
      iconType: 'walk',
    })
  }

  // Step 3: Vertical Floor Transition (Elevator / Stairs)
  if (fromInfo && toInfo && !sameFloor) {
    steps.push({
      stepNumber: stepCount++,
      instruction: `Take ${toInfo.location.nearestElevator} from ${formatFloorLabel(fromInfo.floorNumber)} up to ${formatFloorLabel(toInfo.floorNumber)}.`,
      distanceMeters: 20,
      estimatedSeconds: 45,
      iconType: 'elevator',
      floorTransition: {
        fromFloor: fromInfo.floorNumber,
        toFloor: toInfo.floorNumber,
        elevatorName: toInfo.location.nearestElevator,
      },
    })
  }

  // Step 4: Floor Level Hallway Walking
  if (toInfo) {
    steps.push({
      stepNumber: stepCount++,
      instruction: `Follow the blue directional signage along ${toInfo.location.wing}.`,
      distanceMeters: 30,
      estimatedSeconds: 25,
      iconType: 'walk',
    })

    // Step 5: Arrival
    steps.push({
      stepNumber: stepCount++,
      instruction: `Arrive at ${destName} (${toInfo.location.roomNumber}). Check in at the digital kiosk.`,
      distanceMeters: 10,
      estimatedSeconds: 15,
      iconType: 'arrive',
    })
  }

  const totalDistanceMeters = steps.reduce((sum, s) => sum + s.distanceMeters, 0)
  const totalSeconds = steps.reduce((sum, s) => sum + s.estimatedSeconds, 0)
  const totalWalkMinutes = Math.max(1, Math.ceil(totalSeconds / 60))

  return {
    hospitalName: campus.fullName,
    originDepartment: originName,
    destinationDepartment: destName,
    originBuilding,
    destinationBuilding: destBuilding,
    totalDistanceMeters,
    totalWalkMinutes,
    estimatedCaloriesBurned: Math.round(totalDistanceMeters * 0.05),
    requiresElevator: !sameFloor,
    steps,
  }
}

/**
 * Calculates current live patient location in real-time.
 */
export function getLivePatientIndoorLocation(
  hospitalId: string = 'metro-general',
  currentDepartmentId: DepartmentId = 'cardiology',
  nextDepartmentId: DepartmentId = 'laboratory',
): LiveLocationStatus {
  const campus = getHospitalCampus(hospitalId)
  const currentInfo = getDepartmentLocationInfo(hospitalId, currentDepartmentId)
  const route = calculateIndoorDirections(hospitalId, currentDepartmentId, nextDepartmentId)

  return {
    hospitalId: campus.id,
    hospitalName: campus.name,
    buildingName: currentInfo ? currentInfo.buildingName : 'Specialty Wing',
    buildingCode: currentInfo ? currentInfo.buildingCode : 'BLOCK-C',
    floorNumber: currentInfo ? currentInfo.floorNumber : 2,
    floorLabel: formatFloorLabel(currentInfo ? currentInfo.floorNumber : 2),
    departmentName: currentInfo ? currentInfo.location.departmentName : 'Cardiology',
    roomNumber: currentInfo ? currentInfo.location.roomNumber : 'Suite 204',
    coordinates: currentInfo ? currentInfo.location.coordinates : { x: 75, y: 32 },
    geofenceState: 'inside-room',
    distanceToDestinationMeters: route.totalDistanceMeters,
    walkingEtaMinutes: route.totalWalkMinutes,
  }
}
