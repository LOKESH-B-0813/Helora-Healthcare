'use client'

import React, { useState, useMemo } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Sparkles,
  User,
  Users,
  Waypoints,
  X,
} from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { DemoController } from '@/components/staff/demo-controller'
import type { DepartmentId, DelayRisk, Patient } from '@/lib/data/types'
import { cn } from '@/lib/utils'

export default function PatientFlowPage() {
  const { state } = useFlowPulse()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDept, setSelectedDept] = useState<DepartmentId | 'all'>('all')
  const [selectedRisk, setSelectedRisk] = useState<DelayRisk | 'all'>('all')
  const [activePatient, setActivePatient] = useState<Patient | null>(null)

  const patients = state.patients

  // Top metric counters
  const counts = useMemo(() => {
    return {
      total: 186,
      waiting: 38,
      inTreatment: 42,
      awaitingDiagnostics: 31,
      awaitingReview: 18,
      awaitingDischarge: 9,
      highRisk: patients.filter((p) => p.delayRisk === 'high').length || 7,
    }
  }, [patients])

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (selectedDept !== 'all' && p.currentDepartment !== selectedDept) return false
      if (selectedRisk !== 'all' && p.delayRisk !== selectedRisk) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.currentDepartment.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [patients, selectedDept, selectedRisk, searchQuery])

  // Patients at risk list
  const riskPatients = useMemo(() => {
    return patients.filter((p) => p.delayRisk === 'high' || p.waitingMinutes > 25).slice(0, 4)
  }, [patients])

  return (
    <div className="space-y-6 pb-12">
      {/* Demo Controls */}
      <DemoController />

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Waypoints className="size-3" /> Real-Time Tracking
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Patient Flow & Operational Journey Pipeline
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Track admission-to-discharge transit across all 11 care stages. Identify operational delay risks before patients experience hold-ups.
          </p>
        </div>
      </div>

      {/* Top Metrics Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Patients Today</span>
          <p className="mt-1 text-xl font-extrabold text-foreground">{counts.total}</p>
          <span className="text-[10px] text-muted-foreground">Active tracked census</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Waiting in Queue</span>
          <p className="mt-1 text-xl font-extrabold text-warning-dark">{counts.waiting}</p>
          <span className="text-[10px] text-muted-foreground">In waiting areas</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">In Treatment</span>
          <p className="mt-1 text-xl font-extrabold text-foreground">{counts.inTreatment}</p>
          <span className="text-[10px] text-success font-medium">Under active care</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Awaiting Diagnostics</span>
          <p className="mt-1 text-xl font-extrabold text-foreground">{counts.awaitingDiagnostics}</p>
          <span className="text-[10px] text-muted-foreground">Lab / Imaging tests</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Awaiting Review</span>
          <p className="mt-1 text-xl font-extrabold text-foreground">{counts.awaitingReview}</p>
          <span className="text-[10px] text-muted-foreground">Doctor review queue</span>
        </div>

        <div className="rounded-2xl border border-critical/30 bg-critical-muted/20 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-critical">Awaiting Discharge</span>
          <p className="mt-1 text-xl font-extrabold text-critical">{counts.awaitingDischarge}</p>
          <span className="text-[10px] text-critical font-medium">Bed release pending</span>
        </div>
      </div>

      {/* PATIENTS AT OPERATIONAL DELAY RISK (High Visibility Showcase) */}
      <div className="rounded-3xl border border-critical/30 bg-critical-muted/10 p-5 shadow-xs sm:p-6">
        <div className="flex items-center justify-between border-b border-critical/20 pb-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="size-4 text-critical animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-critical">
              PATIENTS AT OPERATIONAL DELAY RISK ({counts.highRisk} DETECTED)
            </h2>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">
            Risk Score &gt; 70%
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {riskPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => setActivePatient(patient)}
              className="group cursor-pointer rounded-2xl border border-critical/30 bg-card p-4 shadow-2xs transition-all hover:border-critical hover:shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-muted-foreground">
                    {patient.id}
                  </span>
                  <h3 className="text-xs font-bold text-foreground">{patient.name}</h3>
                </div>
                <span className="rounded-full bg-critical-muted px-2 py-0.5 text-[10px] font-bold text-critical">
                  +{patient.waitingMinutes}m Hold
                </span>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Current Unit:</span>
                  <strong className="capitalize text-foreground">{patient.currentDepartment}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Next Stage:</span>
                  <span className="capitalize text-foreground">{patient.nextDepartment ?? 'Discharge'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Est. Completion:</span>
                  <span className="font-mono font-bold text-critical">{patient.predictedCompletionTime}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] font-bold text-primary">
                <span>Inspect Journey Timeline</span>
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <Search className="size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patient name, ID, or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value as any)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground outline-none"
          >
            <option value="all">All Departments</option>
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Delay Risk Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value as any)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground outline-none"
          >
            <option value="all">All Delay Risks</option>
            <option value="high">High Delay Risk</option>
            <option value="moderate">Moderate Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Patient Table */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Patient ID / Name</th>
                <th className="px-4 py-3.5">Current Stage</th>
                <th className="px-4 py-3.5">Current Queue</th>
                <th className="px-4 py-3.5 text-center">Queue Pos</th>
                <th className="px-4 py-3.5 text-center">Ahead</th>
                <th className="px-4 py-3.5">Current Wait</th>
                <th className="px-4 py-3.5">Next Stage</th>
                <th className="px-4 py-3.5">Est. Completion</th>
                <th className="px-4 py-3.5">Delay Risk</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPatients.slice(0, 20).map((patient, index) => {
                const queuePos = (index % 5) + 1
                const ahead = Math.max(0, queuePos - 1)
                return (
                  <tr
                    key={patient.id}
                    onClick={() => setActivePatient(patient)}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      <p className="font-bold">{patient.name}</p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {patient.id} · {patient.age}y {patient.gender}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-semibold capitalize text-foreground">
                      {patient.currentDepartment.replace('-', ' ')}
                    </td>

                    <td className="px-4 py-3.5 font-medium text-foreground capitalize">
                      <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground mr-1.5">
                        {patient.currentDepartment.substring(0, 3).toUpperCase()}
                      </span>
                      {patient.currentDepartment.replace('-', ' ')} Queue
                    </td>

                    <td className="px-4 py-3.5 text-center font-bold text-foreground">
                      #{queuePos}
                    </td>

                    <td className="px-4 py-3.5 text-center text-muted-foreground">
                      {ahead}
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-foreground">
                      {patient.waitingMinutes} min
                    </td>

                    <td className="px-4 py-3.5 font-medium text-foreground capitalize">
                      {patient.nextDepartment?.replace('-', ' ') ?? 'Discharge'}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-muted-foreground">
                      {patient.predictedCompletionTime}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          patient.delayRisk === 'high'
                            ? 'bg-critical-muted text-critical'
                            : patient.delayRisk === 'moderate'
                              ? 'bg-warning-muted text-warning-dark'
                              : 'bg-success-muted text-success',
                        )}
                      >
                        {patient.delayRisk}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase',
                          patient.clinicalPriority === 'critical'
                            ? 'bg-critical/20 text-critical'
                            : patient.clinicalPriority === 'urgent'
                              ? 'bg-warning/20 text-warning-dark'
                              : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {patient.clinicalPriority}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActivePatient(patient)
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        Inspect Journey <ArrowRight className="size-3" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
          <span>Showing {Math.min(20, filteredPatients.length)} of {filteredPatients.length} patients</span>
          <span>Click any row to inspect operational journey timeline</span>
        </div>
      </div>

      {/* Patient Detail Drawer with Visual Care Steps */}
      {activePatient && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Operational Journey Timeline
              </span>
              <h2 className="text-base font-bold text-foreground">
                {activePatient.name} ({activePatient.id})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActivePatient(null)}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* Operational Summary */}
            <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Arrival Clock Time:</span>
                <span className="font-bold text-foreground">{activePatient.arrivalTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Stage:</span>
                <span className="font-bold text-foreground capitalize">
                  {activePatient.currentDepartment.replace('-', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Wait Time:</span>
                <span className="font-bold text-foreground">{activePatient.waitingMinutes} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Operational Delay Risk:</span>
                <span className="font-bold capitalize text-primary">{activePatient.delayRisk}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Clinical Priority (Staff-assigned):</span>
                <span className="font-bold uppercase text-foreground">{activePatient.clinicalPriority}</span>
              </div>
            </div>

            {/* 6-Stage Care Journey */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                6-Stage Care Journey (Registration → Discharge)
              </h3>
              <div className="mt-3 space-y-2.5">
                {[
                  { name: '1. Registration', status: 'completed', actual: activePatient.arrivalTime, expected: '10:00 AM', wait: '0m' },
                  { name: '2. Consultation', status: 'completed', actual: '10:20 AM', expected: '10:15 AM', wait: '5m' },
                  { name: '3. Laboratory Testing', status: activePatient.currentDepartment === 'laboratory' ? 'in-progress' : 'completed', actual: '11:00 AM', expected: '10:45 AM', wait: '15m' },
                  { name: '4. Doctor Review', status: activePatient.currentDepartment === 'laboratory' ? 'upcoming' : 'in-progress', actual: 'Pending', expected: '11:30 AM', wait: '+25m risk' },
                  { name: '5. Pharmacy Dispensing', status: 'upcoming', actual: 'Pending', expected: '12:00 PM', wait: '5m' },
                  { name: '6. Discharge Summary', status: 'upcoming', actual: 'Pending', expected: activePatient.predictedCompletionTime, wait: '10m' },
                ].map((step, idx) => (
                  <div
                    key={step.name}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border p-3 shadow-2xs transition-colors',
                      step.status === 'completed'
                        ? 'border-border bg-card'
                        : step.status === 'in-progress'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border/60 bg-muted/20 opacity-75',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                        step.status === 'completed'
                          ? 'bg-success text-success-foreground'
                          : step.status === 'in-progress'
                            ? 'bg-primary text-primary-foreground animate-pulse'
                            : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {step.status === 'completed' ? '✓' : idx + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{step.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">Exp: {step.expected}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Actual: {step.actual}</span>
                        <span className={cn('font-bold', step.wait.includes('risk') ? 'text-critical' : 'text-foreground')}>
                          Wait: {step.wait}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground">
              <strong>Notice:</strong> FlowPulse tracks operational transit delays and capacity timing. Clinical triage determinations are made strictly by medical personnel.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
