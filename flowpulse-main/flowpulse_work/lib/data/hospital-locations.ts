// ============================================================================
// FlowPulse Multi-Hospital Network & Campus Location Directory
// Comprehensive building, floor, room, and GPS coordinate definitions.
// ============================================================================

import type { DepartmentId } from './types'

export interface HospitalCampus {
  id: string
  name: string
  fullName: string
  network: string
  address: string
  city: string
  state: string
  postalCode: string
  coordinates: {
    lat: number
    lng: number
  }
  emergencyPhone: string
  generalPhone: string
  totalBeds: number
  buildings: CampusBuilding[]
}

export interface CampusBuilding {
  id: string
  name: string
  code: string
  description: string
  floors: BuildingFloor[]
}

export interface BuildingFloor {
  floorNumber: number // 0 = Ground, 1 = 1st Floor, etc.
  floorName: string
  departments: FloorDepartmentLocation[]
}

export interface FloorDepartmentLocation {
  departmentId: DepartmentId
  departmentName: string
  code: string
  roomNumber: string
  wing: string
  coordinates: { x: number; y: number } // Percentage on floor map (0-100)
  nearestElevator: string
  nearestEntrance: string
  walkingNotes: string
}

export const HOSPITAL_NETWORKS: HospitalCampus[] = [
  {
    id: 'metro-general',
    name: 'Metro General Hospital',
    fullName: 'Metro General Super Specialty Hospital & Research Institute',
    network: 'FlowPulse Apex Health Network',
    address: '120 Victoria Road, Ashok Nagar, Outer Ring Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560025',
    coordinates: {
      lat: 12.9716,
      lng: 77.5946,
    },
    emergencyPhone: '+91 1800-356-9785',
    generalPhone: '+91 080-2558-9000',
    totalBeds: 180,
    buildings: [
      {
        id: 'block-a',
        name: 'Trauma & Emergency Pavilion',
        code: 'BLOCK-A',
        description: 'Level-1 Emergency Resuscitation, Rapid Triage Bay, and Acute Intake',
        floors: [
          {
            floorNumber: 0,
            floorName: 'Ground Floor',
            departments: [
              {
                departmentId: 'emergency',
                departmentName: 'Emergency Care & Trauma Bay',
                code: 'ED',
                roomNumber: 'Bay 1–12',
                wing: 'Red Alert Zone (West Entrance)',
                coordinates: { x: 22, y: 72 },
                nearestElevator: 'Elevator A-1',
                nearestEntrance: 'Emergency Ambulance Gate 1',
                walkingNotes: 'Direct ambulance bay drive-in. Follow red floor striping directly to Triage.',
              },
            ],
          },
          {
            floorNumber: 1,
            floorName: 'Level 1 (Critical)',
            departments: [
              {
                departmentId: 'icu',
                departmentName: 'Critical Care Unit (ICU)',
                code: 'ICU',
                roomNumber: 'ICU-101 to 120',
                wing: 'North Sterile Wing',
                coordinates: { x: 25, y: 30 },
                nearestElevator: 'Dedicated Trauma Elevator A-2',
                nearestEntrance: 'Main Lobby North',
                walkingNotes: 'Take Trauma Elevator A-2 to Level 1. Restricted access beyond double doors.',
              },
            ],
          },
        ],
      },
      {
        id: 'block-b',
        name: 'Diagnostic & Imaging Tower',
        code: 'BLOCK-B',
        description: 'Advanced Automated Pathology Labs, 3T MRI, 128-Slice CT, and Phlebotomy',
        floors: [
          {
            floorNumber: 0,
            floorName: 'Ground Floor',
            departments: [
              {
                departmentId: 'laboratory',
                departmentName: 'Central Diagnostic Laboratory & Phlebotomy',
                code: 'LAB',
                roomNumber: 'Lab Suite 04–08',
                wing: 'East Diagnostic Wing',
                coordinates: { x: 48, y: 75 },
                nearestElevator: 'Elevator B-1',
                nearestEntrance: 'East Diagnostic Atrium',
                walkingNotes: 'From Main Lobby, turn right past the central reception. Phlebotomy is at Counter 4.',
              },
            ],
          },
          {
            floorNumber: 1,
            floorName: 'Level 1',
            departments: [
              {
                departmentId: 'radiology',
                departmentName: 'Radiology & Advanced Cross-Sectional Imaging',
                code: 'RAD',
                roomNumber: 'RAD-105 (MRI/CT Suites)',
                wing: 'Central Shielded Zone',
                coordinates: { x: 50, y: 35 },
                nearestElevator: 'Elevator B-1 / B-2',
                nearestEntrance: 'East Diagnostic Atrium',
                walkingNotes: 'Take Elevator B to Floor 1. Turn left at the Imaging reception desk.',
              },
            ],
          },
        ],
      },
      {
        id: 'block-c',
        name: 'Outpatient Specialty Center',
        code: 'BLOCK-C',
        description: 'General OPD, Cardiology Institute, Consultation Suites, and Preventive Care',
        floors: [
          {
            floorNumber: 1,
            floorName: 'Level 1',
            departments: [
              {
                departmentId: 'general-opd',
                departmentName: 'General Medicine (OPD) & Triage',
                code: 'OPD',
                roomNumber: 'Consultation Rooms 101–114',
                wing: 'Main Outpatient Atrium',
                coordinates: { x: 74, y: 72 },
                nearestElevator: 'Elevator C-1',
                nearestEntrance: 'Main Hospital Entrance Gate 2',
                walkingNotes: 'Enter via Main Gate 2. General OPD registration desk is directly ahead.',
              },
            ],
          },
          {
            floorNumber: 2,
            floorName: 'Level 2',
            departments: [
              {
                departmentId: 'cardiology',
                departmentName: 'Cardiology Institute & ECG Bay',
                code: 'CARD',
                roomNumber: 'Suite 204 (Echo & ECG Bay)',
                wing: 'South Heart Care Gallery',
                coordinates: { x: 75, y: 32 },
                nearestElevator: 'Express Elevator C-3',
                nearestEntrance: 'Main Hospital Entrance Gate 2',
                walkingNotes: 'Take Express Elevator C-3 to 2nd Floor. Proceed straight to Heart Institute Suite 204.',
              },
            ],
          },
        ],
      },
      {
        id: 'block-d',
        name: 'Inpatient Suites & Discharge Plaza',
        code: 'BLOCK-D',
        description: 'Surgical Recovery, Inpatient Wards, Central Pharmacy, and Discharge Lounge',
        floors: [
          {
            floorNumber: 0,
            floorName: 'Ground Floor',
            departments: [
              {
                departmentId: 'pharmacy',
                departmentName: 'Central Hospital Pharmacy',
                code: 'RX',
                roomNumber: 'Dispense Counter 1–6',
                wing: 'South Exit Arcade',
                coordinates: { x: 88, y: 80 },
                nearestElevator: 'Elevator D-1',
                nearestEntrance: 'South Garden Exit',
                walkingNotes: 'Located on the ground floor adjacent to the main billing and prescription clearance counter.',
              },
              {
                departmentId: 'discharge',
                departmentName: 'Discharge Coordination Lounge',
                code: 'DC',
                roomNumber: 'Lounge DC-02',
                wing: 'South Exit Arcade',
                coordinates: { x: 92, y: 55 },
                nearestElevator: 'Elevator D-1',
                nearestEntrance: 'South Garden Exit',
                walkingNotes: 'Exit lounge featuring rapid transport assistance and discharge paperwork review.',
              },
            ],
          },
          {
            floorNumber: 1,
            floorName: 'Level 1',
            departments: [
              {
                departmentId: 'ward-a',
                departmentName: 'Inpatient Recovery Ward A',
                code: 'WA',
                roomNumber: 'Rooms 120–145',
                wing: 'Quiet Recovery Concourse',
                coordinates: { x: 85, y: 28 },
                nearestElevator: 'Elevator D-2',
                nearestEntrance: 'South Inpatient Lobby',
                walkingNotes: 'Level 1 Inpatient concourse with continuous telemetry nursing station.',
              },
            ],
          },
          {
            floorNumber: 2,
            floorName: 'Level 2',
            departments: [
              {
                departmentId: 'ward-b',
                departmentName: 'Inpatient Recovery Ward B',
                code: 'WB',
                roomNumber: 'Rooms 220–245',
                wing: 'Step-Down Observation Wing',
                coordinates: { x: 88, y: 20 },
                nearestElevator: 'Elevator D-2',
                nearestEntrance: 'South Inpatient Lobby',
                walkingNotes: 'Level 2 post-acute monitoring suites.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'riverside',
    name: 'Riverside Medical Center',
    fullName: 'Riverside Comprehensive Health & Innovation Center',
    network: 'FlowPulse Apex Health Network',
    address: '45 ITPL Main Road, Whitefield Tech Zone',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560066',
    coordinates: {
      lat: 12.9856,
      lng: 77.7335,
    },
    emergencyPhone: '+91 1800-442-1920',
    generalPhone: '+91 080-6677-8899',
    totalBeds: 210,
    buildings: [],
  },
  {
    id: 'st-agnes',
    name: "St. Agnes Children's & Specialty Hospital",
    fullName: "St. Agnes Women, Children & Super Specialty Hospital",
    network: 'FlowPulse Apex Health Network',
    address: '80 Feet Road, HAL 2nd Stage, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    coordinates: {
      lat: 12.9784,
      lng: 77.6408,
    },
    emergencyPhone: '+91 1800-888-2432',
    generalPhone: '+91 080-4122-3344',
    totalBeds: 120,
    buildings: [],
  },
  {
    id: 'harbor-view',
    name: 'Harbor View Specialty Trauma Center',
    fullName: 'Harbor View Level-1 Regional Trauma & Critical Care Center',
    network: 'FlowPulse Apex Health Network',
    address: '100 Feet Ring Road, 4th Block, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560034',
    coordinates: {
      lat: 12.9352,
      lng: 77.6245,
    },
    emergencyPhone: '+91 1800-911-0000',
    generalPhone: '+91 080-2553-7711',
    totalBeds: 160,
    buildings: [],
  },
  {
    id: 'apex-memorial',
    name: 'FlowPulse Apex Memorial Healthcare',
    fullName: 'FlowPulse Apex Multi-Speciality Medical Research Institute',
    network: 'FlowPulse Global Health Systems',
    address: 'Park Street Medical Corridor, Central Enclave',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    coordinates: {
      lat: 12.9698,
      lng: 77.6012,
    },
    emergencyPhone: '+91 1800-777-1000',
    generalPhone: '+91 080-4000-8000',
    totalBeds: 350,
    buildings: [],
  },
]
