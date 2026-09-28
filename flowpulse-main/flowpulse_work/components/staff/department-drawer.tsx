'use client'

import React from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Building2,
  CheckCircle2,
  Clock,
  DoorOpen,
  HardDrive,
  HeartPulse,
  Sparkles,
  Users,
  Waves,
  X,
  Zap,
} from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import type { DepartmentId } from '@/lib/data/types'
import { cn } from '@/lib/utils'

export function DepartmentDrawer({
  departmentId,
  onClose,
}: {
  departmentId: DepartmentId | null
  onClose: () => void
}) {
  const { state } = useFlowPulse()

  if (!departmentId) return null

  const dept = state.departments.find((d) => d.id === departmentId)
  if (!dept) return null

  const deptStaff = state.staff.filter((s) => s.department === departmentId)
  const deptDiagnostics = state.diagnosticResources.filter(
    (d) => d.department === departmentId,
  )
  const deptPatients = state.patients.filter(
    (p) => p.currentDepartment === departmentId,
  )

  const isLab = departmentId === 'laboratory'
  const isLabFailure =
    isLab &&
    state.activeScenario === 'lab-analyzer-failure' &&
    state.scenarioPhase >= 1

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-card shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{dept.name}</h2>
            <span className="text-xs text-muted-foreground">
              Code: {dept.code} · Normal Capacity: {dept.capacity}/hr
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* DEDICATED DEPARTMENT QUEUE SECTION */}
        <div className="rounded-3xl border border-primary/20 bg-primary/[0.03] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {dept.name} Live Queue
              </h4>
            </div>
            <span className="font-mono text-xs font-bold text-primary">
              Serving: <strong>{dept.id === 'laboratory' ? 'LAB-041' : dept.id === 'cardiology' ? 'C-021' : `${dept.code}-012`}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 text-xs">
            <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Waiting</span>
              <p className="mt-1 text-lg font-bold text-foreground">
                {dept.id === 'laboratory' ? (isLabFailure ? 21 : 11) : dept.id === 'cardiology' ? 8 : 6}
              </p>
              <span className="text-[10px] text-muted-foreground">Patients</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Average Wait</span>
              <p className={cn('mt-1 text-lg font-bold', dept.avgWaitMinutes >= 30 ? 'text-critical' : 'text-foreground')}>
                {dept.avgWaitMinutes} min
              </p>
              <span className="text-[10px] text-muted-foreground">Current hold</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Pred +30m</span>
              <p className={cn('mt-1 text-lg font-bold', dept.id === 'laboratory' && isLabFailure ? 'text-critical' : 'text-foreground')}>
                {dept.id === 'laboratory' ? (isLabFailure ? 43 : 24) : Math.round(dept.avgWaitMinutes * 1.2)} min
              </p>
              <span className="text-[10px] text-muted-foreground">Forecast</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Staff / Res</span>
              <p className="mt-1 text-lg font-bold text-foreground">
                {deptStaff.length || 3} / {dept.capacity || 4}
              </p>
              <span className="text-[10px] text-muted-foreground">Available</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/staff/live-queues?tab=overview&dept=${dept.id}`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-2 text-xs font-bold text-foreground shadow-2xs hover:bg-muted transition-colors"
            >
              <span>Queue Overview</span>
            </Link>
            <Link
              href={`/staff/live-queues?tab=timeline&dept=${dept.id}`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-hover transition-colors"
            >
              <span>VIEW FULL TIMELINE</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* TODAY'S FLOW PREVIEW */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" /> TODAY'S FLOW SCHEDULE
            </h4>
            <Link
              href={`/staff/live-queues?tab=timeline&dept=${dept.id}`}
              className="text-[11px] font-bold text-primary hover:underline"
            >
              Full Schedule →
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-muted/20 p-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-muted-foreground">09:30</span>
                <span className="font-semibold text-foreground">Kavya R. (C-018)</span>
              </div>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-bold">
                COMPLETED
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/20 p-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-muted-foreground">09:50</span>
                <span className="font-semibold text-foreground">Mohammed A. (C-019)</span>
              </div>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-bold">
                COMPLETED
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-blue-500/10 border border-blue-500/20 p-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-700 dark:text-blue-400">10:10</span>
                <span className="font-bold text-foreground">Priya S. (C-020)</span>
              </div>
              <span className="rounded-full bg-blue-500 text-white px-2 py-0.5 text-[9px] font-bold animate-pulse">
                IN PROGRESS
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 p-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary">10:30</span>
                <span className="font-bold text-foreground">Arjun Kumar (C-021)</span>
              </div>
              <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 text-[9px] font-bold">
                WAITING · Pred 10:48
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/20 p-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-muted-foreground">10:50</span>
                <span className="font-semibold text-foreground">Ravi M. (C-022)</span>
              </div>
              <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 text-[9px] font-bold">
                WAITING · Pred 11:06
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/20 p-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-muted-foreground">11:10</span>
                <span className="font-semibold text-foreground">Meena S. (C-023)</span>
              </div>
              <span className="rounded-full bg-slate-100 text-slate-700 dark:bg-muted dark:text-muted-foreground px-2 py-0.5 text-[9px] font-bold">
                SCHEDULED
              </span>
            </div>
          </div>
        </div>


        {/* CURRENT OPERATIONS */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Current Operations
          </h4>
          <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-muted/20 p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Current Load</span>
              <p className={cn('mt-1 text-lg font-bold', dept.status === 'critical' ? 'text-critical' : dept.status === 'warning' ? 'text-warning-dark' : 'text-foreground')}>
                {dept.utilization}%
              </p>
              <span className="text-[10px] text-muted-foreground">Normal: 55–75%</span>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Waiting</span>
              <p className="mt-1 text-lg font-bold text-foreground">
                {deptPatients.filter((p) => p.status === 'waiting').length || (isLabFailure ? 24 : 6)}
              </p>
              <span className="text-[10px] text-muted-foreground">In queue</span>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Processing</span>
              <p className="mt-1 text-lg font-bold text-foreground">
                {deptPatients.filter((p) => p.status !== 'waiting').length || (isLabFailure ? 20 : 12)}
              </p>
              <span className="text-[10px] text-muted-foreground">In progress</span>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Avg Wait</span>
              <p className="mt-1 text-lg font-bold text-foreground">
                {dept.avgWaitMinutes} min
              </p>
              <span className="text-[10px] text-muted-foreground">{dept.avgWaitMinutes > 30 ? 'Over target SLA' : 'Within SLA'}</span>
            </div>
          </div>
        </div>

        {/* WHY? ROOT CAUSES (For Laboratory or Strained Units) */}
        {isLabFailure ? (
          <div className="rounded-3xl border border-critical/40 bg-critical-muted/20 p-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-critical/20 px-2.5 py-0.5 text-xs font-bold text-critical">
                <AlertTriangle className="size-3.5 animate-pulse" /> ROOT CAUSE IDENTIFIED
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">11:32:01 UTC</span>
            </div>

            <h3 className="mt-3 text-sm font-bold text-foreground">
              Analyzer #2 (Asset ID: LAB-AN-02) is OFFLINE
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Diagnostic velocity dropped 34% while incoming specimen demand increased by +21% across emergency and outpatient clinics.
            </p>

            <div className="mt-4 rounded-2xl border border-critical/30 bg-card p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">• Equipment Asset:</span>
                <span className="font-mono font-bold text-critical">LAB-AN-02 (Offline)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">• Capacity Reduction:</span>
                <span className="font-bold text-critical">-34% velocity drop</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">• Incoming Demand:</span>
                <span className="font-bold text-warning-dark">+21% specimen influx</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-muted/30 p-4 text-xs">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-success" /> Operational Root Cause Analysis:
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              All diagnostic hardware and staff allocations within this unit are currently operating inside nominal design tolerances.
            </p>
          </div>
        )}

        {/* IMPACT (Downstream Consequences) */}
        {isLabFailure && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Waves className="size-3.5 text-primary" /> Projected Downstream Impact
            </h4>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Doctor Review</span>
                <p className="mt-1 text-base font-bold text-warning-dark">+14 Reviews Delayed</p>
                <span className="text-[10px] text-muted-foreground">Pending biochemistry</span>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Discharge Pipeline</span>
                <p className="mt-1 text-base font-bold text-warning-dark">+9 Discharges Delayed</p>
                <span className="text-[10px] text-muted-foreground">Awaiting clearance</span>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Bed Availability</span>
                <p className="mt-1 text-base font-bold text-critical">7 Beds Blocked Longer</p>
                <span className="text-[10px] text-muted-foreground">Census turnover stall</span>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Emergency Boarding</span>
                <p className="mt-1 text-base font-bold text-critical">+25 min ED Wait Spike</p>
                <span className="text-[10px] text-muted-foreground">18m → 43m projected</span>
              </div>
            </div>
          </div>
        )}

        {/* FORECAST TIMELINE */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Operational Forecast Horizon
          </h4>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-2xl border border-border bg-card p-2.5 shadow-2xs">
              <span className="text-[10px] text-muted-foreground font-mono">NOW</span>
              <p className="mt-1 text-sm font-bold text-foreground">{dept.utilization}%</p>
              <span className="text-[9px] text-muted-foreground">Active</span>
            </div>
            <div className="rounded-2xl border border-border bg-card p-2.5 shadow-2xs">
              <span className="text-[10px] text-muted-foreground font-mono">+30m</span>
              <p className="mt-1 text-sm font-bold text-warning-dark">{isLabFailure ? '94%' : `${dept.utilization}%`}</p>
              <span className="text-[9px] text-muted-foreground">Review hold</span>
            </div>
            <div className="rounded-2xl border border-border bg-card p-2.5 shadow-2xs">
              <span className="text-[10px] text-muted-foreground font-mono">+60m</span>
              <p className="mt-1 text-sm font-bold text-critical">{isLabFailure ? '98%' : `${dept.utilization}%`}</p>
              <span className="text-[9px] text-muted-foreground">Discharge stall</span>
            </div>
            <div className="rounded-2xl border border-border bg-card p-2.5 shadow-2xs">
              <span className="text-[10px] text-muted-foreground font-mono">+120m</span>
              <p className="mt-1 text-sm font-bold text-purple-700">{isLabFailure ? '102%' : `${dept.utilization}%`}</p>
              <span className="text-[9px] text-purple-700 font-bold">ED Boarding</span>
            </div>
          </div>
        </div>

        {/* Equipment & Diagnostics Fleet */}
        {deptDiagnostics.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Equipment Fleet ({deptDiagnostics.length})
            </h4>
            <div className="mt-3 space-y-2">
              {deptDiagnostics.map((eq) => (
                <div
                  key={eq.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <HardDrive
                      className={cn(
                        'size-4',
                        eq.status === 'offline'
                          ? 'text-critical'
                          : eq.status === 'maintenance'
                            ? 'text-warning'
                            : 'text-success',
                      )}
                    />
                    <div>
                      <p className="font-semibold text-foreground">{eq.name}</p>
                      <span className="text-[10px] text-muted-foreground">
                        Cap: {eq.capacityPerHour}/hr · Util: {eq.utilization}%
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      eq.status === 'offline'
                        ? 'bg-critical-muted text-critical'
                        : eq.status === 'maintenance'
                          ? 'bg-warning-muted text-warning-dark'
                          : 'bg-success-muted text-success',
                    )}
                  >
                    {eq.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Action CTA */}
        <div className="pt-2 border-t border-border">
          <Link
            href="/staff/scenario-simulator"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary-hover transition-colors"
          >
            <Sparkles className="size-4" /> SIMULATE CORRECTIVE ACTION <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
