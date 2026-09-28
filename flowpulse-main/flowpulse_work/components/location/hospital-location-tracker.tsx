'use client'

import React, { useState, useMemo } from 'react'
import {
  Building2,
  Compass,
  Footprints,
  Hospital as HospitalIcon,
  Layers,
  MapPin,
  Navigation2,
  PhoneCall,
  Route,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  LocateFixed,
  ChevronRight,
  Clock3,
} from 'lucide-react'
import {
  HOSPITAL_NETWORKS,
  HospitalCampus,
  FloorDepartmentLocation,
} from '@/lib/data/hospital-locations'
import {
  calculateIndoorDirections,
  formatFloorLabel,
  getDepartmentLocationInfo,
  getLivePatientIndoorLocation,
  NavigationRoute,
} from '@/lib/engine/location-engine'
import type { DepartmentId } from '@/lib/data/types'
import { cn } from '@/lib/utils'

interface HospitalLocationTrackerProps {
  initialHospitalId?: string
  currentDepartmentId?: DepartmentId
  destinationDepartmentId?: DepartmentId
  patientName?: string
  interactive?: boolean
}

export function HospitalLocationTracker({
  initialHospitalId = 'metro-general',
  currentDepartmentId = 'cardiology',
  destinationDepartmentId = 'laboratory',
  patientName = 'Arjun Kumar',
  interactive = true,
}: HospitalLocationTrackerProps) {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(initialHospitalId)
  const [activeFloor, setActiveFloor] = useState<number>(2) // Default to Level 2 (Cardiology)
  const [originDept, setOriginDept] = useState<DepartmentId>(currentDepartmentId)
  const [destDept, setDestDept] = useState<DepartmentId>(destinationDepartmentId)
  const [selectedDeptDetail, setSelectedDeptDetail] = useState<FloorDepartmentLocation | null>(null)

  const activeHospital = useMemo(() => {
    return (
      HOSPITAL_NETWORKS.find((h) => h.id === selectedHospitalId) ||
      HOSPITAL_NETWORKS[0]
    )
  }, [selectedHospitalId])

  const route: NavigationRoute = useMemo(() => {
    return calculateIndoorDirections(selectedHospitalId, originDept, destDept)
  }, [selectedHospitalId, originDept, destDept])

  const liveLoc = useMemo(() => {
    return getLivePatientIndoorLocation(selectedHospitalId, originDept, destDept)
  }, [selectedHospitalId, originDept, destDept])

  // Get departments on the currently selected floor
  const floorDepartments = useMemo(() => {
    const list: {
      buildingName: string
      buildingCode: string
      dept: FloorDepartmentLocation
    }[] = []

    for (const building of activeHospital.buildings) {
      for (const floor of building.floors) {
        if (floor.floorNumber === activeFloor) {
          for (const dept of floor.departments) {
            list.push({
              buildingName: building.name,
              buildingCode: building.code,
              dept,
            })
          }
        }
      }
    }
    return list
  }, [activeHospital, activeFloor])

  return (
    <div className="space-y-6">
      {/* Top Hospital Switcher & Campus Identification Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
              <HospitalIcon className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  FlowPulse Health Network
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  GPS Live Synchronized
                </span>
              </div>
              <h2 className="mt-0.5 text-xl font-black text-slate-900 sm:text-2xl">
                {activeHospital.fullName}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                📍 {activeHospital.address}, {activeHospital.city}, {activeHospital.state} {activeHospital.postalCode}
              </p>
            </div>
          </div>

          {/* Hospital Switcher Dropdown */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
            <span className="text-xs font-bold text-slate-500">Switch Campus:</span>
            <select
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-primary focus:bg-white focus:outline-hidden"
            >
              {HOSPITAL_NETWORKS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Patient Indoor Geofence Status Strip */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl bg-slate-900 p-4 text-white">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Patient
            </span>
            <p className="mt-0.5 text-xs font-extrabold truncate text-white">{patientName}</p>
            <span className="text-[10px] text-emerald-400">● Inside Campus Perimeter</span>
          </div>

          <div className="border-l border-slate-800 pl-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current Location
            </span>
            <p className="mt-0.5 text-xs font-bold text-cyan-300 truncate">
              {liveLoc.buildingCode} • {liveLoc.floorLabel.split(' ')[0]}
            </p>
            <span className="text-[10px] text-slate-300 truncate">{liveLoc.roomNumber}</span>
          </div>

          <div className="border-l border-slate-800 pl-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Target Care Unit
            </span>
            <p className="mt-0.5 text-xs font-bold text-amber-300 truncate">
              {route.destinationDepartment}
            </p>
            <span className="text-[10px] text-slate-300">{route.destinationBuilding}</span>
          </div>

          <div className="border-l border-slate-800 pl-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Walking Distance & ETA
            </span>
            <p className="mt-0.5 text-xs font-extrabold text-emerald-400">
              {route.totalDistanceMeters}m • ~{route.totalWalkMinutes} min walk
            </p>
            <span className="text-[10px] text-slate-300">
              {route.requiresElevator ? '🛗 Elevator Required' : '🚶 Same Level'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map Visualizer & Step-by-Step Wayfinding */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Left Column: Multi-Floor Campus Visualizer */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                INTERACTIVE HOSPITAL FLOOR MAP
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                {formatFloorLabel(activeFloor)}
              </h3>
            </div>

            {/* Floor Selector Buttons */}
            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1">
              {[0, 1, 2].map((floorNum) => (
                <button
                  key={floorNum}
                  onClick={() => setActiveFloor(floorNum)}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-xs font-bold transition',
                    activeFloor === floorNum
                      ? 'bg-white text-primary shadow-xs'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  {floorNum === 0 ? 'Ground' : `Level ${floorNum}`}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Campus SVG Floor Blueprint */}
          <div className="relative mt-5 aspect-16/10 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-4 shadow-inner">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />

            {/* Campus Architectural Layout Zones */}
            <div className="relative h-full w-full">
              {/* Block A Zone: Emergency & Trauma */}
              <div className="absolute left-[5%] top-[10%] h-[80%] w-[22%] rounded-xl border border-rose-500/40 bg-rose-950/20 p-2 text-[10px] text-rose-300 backdrop-blur-xs">
                <span className="font-mono font-bold">BLOCK-A</span>
                <p className="text-[9px] text-slate-400">Emergency & ICU</p>
              </div>

              {/* Block B Zone: Diagnostics & Labs */}
              <div className="absolute left-[30%] top-[10%] h-[80%] w-[22%] rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-2 text-[10px] text-cyan-300 backdrop-blur-xs">
                <span className="font-mono font-bold">BLOCK-B</span>
                <p className="text-[9px] text-slate-400">Diagnostics & MRI</p>
              </div>

              {/* Block C Zone: Outpatient Specialty */}
              <div className="absolute left-[55%] top-[10%] h-[80%] w-[22%] rounded-xl border border-blue-500/40 bg-blue-950/20 p-2 text-[10px] text-blue-300 backdrop-blur-xs">
                <span className="font-mono font-bold">BLOCK-C</span>
                <p className="text-[9px] text-slate-400">OPD & Cardiology</p>
              </div>

              {/* Block D Zone: Inpatient & Pharmacy */}
              <div className="absolute left-[80%] top-[10%] h-[80%] w-[16%] rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-2 text-[10px] text-emerald-300 backdrop-blur-xs">
                <span className="font-mono font-bold">BLOCK-D</span>
                <p className="text-[9px] text-slate-400">Wards & Pharmacy</p>
              </div>

              {/* Central Concourse Walking Corridor */}
              <div className="absolute left-[5%] top-[50%] h-[12%] w-[91%] rounded-full border border-dashed border-slate-700 bg-slate-900/60 flex items-center justify-center">
                <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase">
                  ◄ Central Glass Concourse Wayfinding Corridor ►
                </span>
              </div>

              {/* Dynamic Department Hotspots on this Floor */}
              {floorDepartments.map(({ buildingCode, dept }) => {
                const isSelected = selectedDeptDetail?.departmentId === dept.departmentId
                const isCurrentPatientLocation =
                  activeFloor === liveLoc.floorNumber &&
                  dept.departmentName.includes(liveLoc.departmentName.split(' ')[0])

                return (
                  <div
                    key={dept.departmentId}
                    onClick={() => setSelectedDeptDetail(dept)}
                    style={{
                      left: `${dept.coordinates.x}%`,
                      top: `${dept.coordinates.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={cn(
                      'absolute cursor-pointer transition-all duration-200 group z-10',
                      isSelected ? 'scale-110' : 'hover:scale-105',
                    )}
                  >
                    {/* Live Radar Pulse Pin for Current Location */}
                    {isCurrentPatientLocation ? (
                      <div className="relative flex size-9 items-center justify-center">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/50">
                          <LocateFixed className="size-4 animate-spin" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-slate-200 shadow-md group-hover:border-primary">
                        <MapPin className="size-3 text-primary" />
                        <span className="text-[10px] font-bold">{dept.code}</span>
                      </div>
                    )}

                    {/* Department Tag Overlay */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/95 px-2 py-0.5 text-[9px] font-semibold text-slate-300 border border-slate-800 shadow-xs pointer-events-none">
                      {dept.roomNumber}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Department Selection Detail Drawer */}
          {selectedDeptDetail && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 animate-in fade-in duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Selected Care Unit
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {selectedDeptDetail.departmentName} ({selectedDeptDetail.roomNumber})
                  </h4>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    📍 {selectedDeptDetail.wing} • Nearest: {selectedDeptDetail.nearestElevator}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 italic">
                    ℹ️ {selectedDeptDetail.walkingNotes}
                  </p>
                </div>
                <button
                  onClick={() => setDestDept(selectedDeptDetail.departmentId)}
                  className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-hover"
                >
                  Set as Destination
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Turn-by-Turn Indoor Wayfinding */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  TURN-BY-TURN INDOOR NAVIGATION
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Step-by-Step Directions
                </h3>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-primary">
                {route.steps.length} Steps
              </span>
            </div>

            {/* Route Summary Selector */}
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
                <p className="font-bold text-slate-800 truncate">{route.originDepartment}</p>
              </div>
              <div className="border-l border-slate-200 pl-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
                <p className="font-bold text-primary truncate">{route.destinationDepartment}</p>
              </div>
            </div>

            {/* Step list */}
            <div className="mt-5 space-y-3">
              {route.steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition hover:bg-slate-50"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      {step.instruction}
                    </p>
                    {step.distanceMeters > 0 && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        Walk ~{step.distanceMeters}m ({step.estimatedSeconds}s)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Assistance Hotline in Campus */}
          <div className="mt-6 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-rose-800">
              <PhoneCall className="size-4 text-rose-600 animate-bounce" />
              <div>
                <p className="font-bold">Need Wayfinding Assistance?</p>
                <span className="text-[11px] text-rose-600 font-mono">
                  Call Hospital Desk: {activeHospital.emergencyPhone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
