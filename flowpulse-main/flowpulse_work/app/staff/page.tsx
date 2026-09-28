'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  DoorOpen,
  Eye,
  FlaskConical,
  HeartPulse,
  Info,
  Radio,
  Sparkles,
  Stethoscope,
  Users,
  Waves,
  Zap,
  LayoutGrid,
  Maximize2,
  Columns,
} from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { HospitalFlowCanvas } from '@/components/flow/hospital-flow-canvas'
import { IntelligencePanel } from '@/components/staff/intelligence-panel'
import { HorizonSelector } from '@/components/staff/horizon-selector'
import { DemoController } from '@/components/staff/demo-controller'
import { DepartmentDrawer } from '@/components/staff/department-drawer'
import type { DepartmentId, StaffRoleView } from '@/lib/data/types'
import { cn } from '@/lib/utils'

export default function CommandCenterPage() {
  const { state, setRoleView } = useFlowPulse()
  const [selectedDept, setSelectedDept] = useState<DepartmentId | null>(null)
  const [isFullWidthMap, setIsFullWidthMap] = useState(false)

  const isCriticalStatus = state.hospitalStatus === 'Critical' || state.hospitalStatus === 'Strained'
  const isElevated = state.hospitalStatus === 'Elevated'

  const currentRole = state.staffRoleView || 'operations-manager'

  const isLabFailure =
    state.activeScenario === 'lab-analyzer-failure' && state.scenarioPhase >= 2
  const isRecovered =
    state.activeScenario === 'lab-analyzer-failure' && state.scenarioPhase >= 6

  return (
    <div className="space-y-6 pb-12">
      {/* Demo Controls Bar */}
      <DemoController />

      {/* Top Bar: Title, Role Selector & Flow Status Badge */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-3" /> Real-Time Command Center
            </span>
            <span className="text-xs text-muted-foreground">
              Predictive Flow & Operations Intelligence
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            FlowPulse Operational Command
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Role Perspective Switcher */}
          <div className="flex items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setRoleView('operations-manager')}
              className={cn(
                'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                currentRole === 'operations-manager'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Operations Manager
            </button>
            <button
              type="button"
              onClick={() => setRoleView('department-head')}
              className={cn(
                'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                currentRole === 'department-head'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Department Head
            </button>
            <button
              type="button"
              onClick={() => setRoleView('bed-manager')}
              className={cn(
                'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                currentRole === 'bed-manager'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Bed Manager
            </button>
          </div>

          {/* Hospital Operational State Indicator */}
          <div
            className={cn(
              'flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-bold shadow-2xs',
              isCriticalStatus
                ? 'border-critical/30 bg-critical-muted text-critical'
                : isElevated
                  ? 'border-warning/30 bg-warning-muted text-warning-dark'
                  : isRecovered
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-success/30 bg-success-muted text-success',
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                isCriticalStatus
                  ? 'bg-critical animate-ping'
                  : isElevated
                    ? 'bg-warning'
                    : 'bg-success',
              )}
            />
            <span>
              {isCriticalStatus
                ? 'CRITICAL BOTTLENECK'
                : isElevated
                  ? 'ELEVATED FLOW'
                  : isRecovered
                    ? 'RECOVERED (NORMAL)'
                    : 'FLOW NOMINAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Header Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Metric 1: Health Score */}
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Flow Health</span>
            <Activity className="size-3.5 text-primary" />
          </div>
          <p className="mt-1 text-xl font-extrabold text-foreground">
            {state.hospitalHealthScore}
            <span className="text-xs font-normal text-muted-foreground">/100</span>
          </p>
          <span className="mt-1 block text-[10px] text-muted-foreground">
            {state.hospitalHealthScore >= 80 ? 'Target ≥ 80' : 'Downstream ripple'}
          </span>
        </div>

        {/* Patients In System */}
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">In System</span>
            <Users className="size-3.5 text-primary" />
          </div>
          <p className="mt-1 text-xl font-extrabold text-foreground">
            {state.kpis.activePatients}
          </p>
          <span className="mt-1 block text-[10px] text-muted-foreground">Active census</span>
        </div>

        {/* Currently Waiting */}
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">In Queues</span>
            <Clock className="size-3.5 text-warning-dark" />
          </div>
          <p className="mt-1 text-xl font-extrabold text-foreground">
            {state.kpis.waitingPatients}
          </p>
          <span className="mt-1 block text-[10px] text-muted-foreground">Across all units</span>
        </div>

        {/* Available Beds */}
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Available Beds</span>
            <BedDouble className="size-3.5 text-success" />
          </div>
          <p className="mt-1 text-xl font-extrabold text-foreground">
            {state.kpis.availableBeds}
            <span className="text-xs font-normal text-muted-foreground">/120</span>
          </p>
          <span className="mt-1 block text-[10px] text-muted-foreground">
            {state.kpis.availableBeds < 15 ? 'Critical buffer' : '15% Capacity'}
          </span>
        </div>

        {/* Active Bottlenecks */}
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Active Bottlenecks</span>
            <Zap className="size-3.5 text-critical" />
          </div>
          <p className="mt-1 text-xl font-extrabold text-critical">
            {state.kpis.activeBottlenecks}
          </p>
          <span className="mt-1 block text-[10px] text-muted-foreground">
            {state.kpis.activeBottlenecks > 0 ? '1 Critical (Lab)' : '0 Active holds'}
          </span>
        </div>

        {/* Average Flow Time */}
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold">Avg Flow Time</span>
            <Clock className="size-3.5 text-primary" />
          </div>
          <p className="mt-1 text-xl font-extrabold text-foreground">
            42 <span className="text-xs font-normal text-muted-foreground">min</span>
          </p>
          <span className="mt-1 block text-[10px] text-muted-foreground">Within standard SLA</span>
        </div>
      </div>

      {/* Queue Health Quick Operational Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-white font-bold">
              <Clock className="size-3.5" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Queue Health</span>
              <p className="font-extrabold text-foreground">{state.queues?.length || 6} Active Unit Queues</p>
            </div>
          </div>
          <div className="hidden sm:block h-6 w-px bg-border" />
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Waiting</span>
            <p className="font-extrabold text-foreground">
              {state.queues?.reduce((sum, q) => sum + (q.waitingPatients?.length || 0), 0) || 63} Patients
            </p>
          </div>
          <div className="hidden sm:block h-6 w-px bg-border" />
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Avg Wait Time</span>
            <p className="font-extrabold text-foreground">17 min</p>
          </div>
          <div className="hidden sm:block h-6 w-px bg-border" />
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Longest Hold</span>
            <p className="font-extrabold text-critical">Laboratory (34m)</p>
          </div>
        </div>

        <Link
          href="/staff/live-queues"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-hover active:scale-95"
        >
          <span>VIEW LIVE QUEUES</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {/* WHAT NEEDS ATTENTION Prioritized Panel */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <AlertOctagon className="size-4 text-critical" /> WHAT NEEDS ATTENTION (PRIORITIZED)
          </h2>
          <span className="text-[10px] font-semibold text-muted-foreground">
            Auto-prioritized by downstream ripple velocity
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Item 1: Lab Bottleneck */}
          <Link
            href="/staff/ripple-analysis"
            className={cn(
              'group rounded-2xl border p-3.5 transition-all shadow-2xs flex flex-col justify-between',
              isLabFailure
                ? 'border-critical/50 bg-critical-muted/20 hover:border-critical'
                : 'border-border bg-muted/20 hover:bg-muted/40',
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-critical px-2 py-0.5 text-[10px] font-bold text-critical-foreground">
                  1. CRITICAL
                </span>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="mt-2 text-xs font-bold text-foreground">
                Laboratory Bottleneck (92% Load)
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Analyzer #2 offline. Option C ready for approval.
              </p>
            </div>
            <span className="mt-3 block text-[10px] font-bold text-primary">
              Open Ripple Analysis →
            </span>
          </Link>

          {/* Item 2: Ward B Capacity */}
          <Link
            href="/staff/departments"
            className="group rounded-2xl border border-warning/40 bg-warning-muted/15 p-3.5 transition-all shadow-2xs hover:border-warning flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-warning px-2 py-0.5 text-[10px] font-bold text-warning-foreground">
                  2. FUTURE WARNING
                </span>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="mt-2 text-xs font-bold text-foreground">
                Ward B Capacity Holding
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Projected census pressure in 42 min if discharges stall.
              </p>
            </div>
            <span className="mt-3 block text-[10px] font-bold text-primary">
              View Department Detail →
            </span>
          </Link>

          {/* Item 3: 7 Patients at Risk */}
          <Link
            href="/staff/patient-flow"
            className="group rounded-2xl border border-purple-200 bg-purple-50/40 p-3.5 transition-all shadow-2xs hover:border-purple-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  3. OPERATIONAL RISK
                </span>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="mt-2 text-xs font-bold text-foreground">
                7 Patients at Delay Risk
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Awaiting delayed lab panels across Cardiology & Medicine.
              </p>
            </div>
            <span className="mt-3 block text-[10px] font-bold text-primary">
              View Patient Journey Pipeline →
            </span>
          </Link>

          {/* Item 4: Bed Cleaning */}
          <Link
            href="/staff/beds-capacity"
            className="group rounded-2xl border border-border bg-card p-3.5 transition-all shadow-2xs hover:border-border/80 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">
                  4. BED TURNOVER
                </span>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="mt-2 text-xs font-bold text-foreground">
                Bed Cleaning Turnaround
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">
                3 dirty beds pending sanitization; 12 min above target.
              </p>
            </div>
            <span className="mt-3 block text-[10px] font-bold text-primary">
              Open Bed Capacity →
            </span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Flow Canvas Hero + Right Intelligence Column (with Full-Width Toggle) */}
      <div className={cn('grid gap-6 transition-all', isFullWidthMap ? 'grid-cols-1' : 'lg:grid-cols-[1fr_390px]')}>
        {/* Left Column: Horizon Selector & React Flow Canvas */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Waves className="size-4 text-primary" /> LIVE HOSPITAL FLOW MAP
              </h2>
              <button
                type="button"
                onClick={() => setIsFullWidthMap((prev) => !prev)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shadow-2xs"
              >
                {isFullWidthMap ? (
                  <>
                    <Columns className="size-3.5 text-primary" />
                    <span>Split View</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="size-3.5 text-primary" />
                    <span>Full Width Focus</span>
                  </>
                )}
              </button>
            </div>
            <HorizonSelector />
          </div>

          {/* Hero React Flow Canvas */}
          <HospitalFlowCanvas
            onSelectDepartment={(id) => setSelectedDept(id)}
            selectedDepartmentId={selectedDept}
          />

          {/* Operational Flow Health Breakdown */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Operational Flow Health Decomposition ({state.hospitalHealthScore}/100)
                </h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Multi-subsystem operational index. (Does not measure or imply clinical care quality).
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                Live Sub-Indices
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
              <div className="rounded-xl border border-border bg-muted/20 p-2.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Patient Flow</span>
                <p className="mt-1 text-sm font-extrabold text-foreground">88 / 100</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-2.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Diagnostics</span>
                <p className={cn('mt-1 text-sm font-extrabold', isLabFailure ? 'text-critical' : 'text-foreground')}>
                  {isLabFailure ? '58 / 100' : '82 / 100'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-2.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Beds Census</span>
                <p className="mt-1 text-sm font-extrabold text-foreground">79 / 100</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-2.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Staffing</span>
                <p className="mt-1 text-sm font-extrabold text-success">92 / 100</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-2.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Discharge</span>
                <p className="mt-1 text-sm font-extrabold text-foreground">84 / 100</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-2.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Emergency</span>
                <p className="mt-1 text-sm font-extrabold text-foreground">76 / 100</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (or Bottom in Full Width): FlowPulse Intelligence & Activity Feed */}
        <div className={cn('space-y-4', isFullWidthMap && 'grid gap-6 md:grid-cols-2 lg:grid-cols-2 space-y-0')}>
          <IntelligencePanel />

          {/* Live Activity Feed Box */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" /> Operational Activity Stream
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {state.activityFeed.length} events
              </span>
            </div>

            <div className="mt-3 max-h-72 space-y-2.5 overflow-y-auto pr-1">
              {state.activityFeed.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-2.5 rounded-2xl border border-border/60 bg-muted/20 p-3 text-xs transition-colors hover:bg-muted/40"
                >
                  <span
                    className={cn(
                      'mt-1 size-2 shrink-0 rounded-full',
                      act.tone === 'critical'
                        ? 'bg-critical'
                        : act.tone === 'warning'
                          ? 'bg-warning'
                          : 'bg-primary',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate font-semibold text-foreground">
                        {act.title}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {act.timestamp}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
                      {act.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Department Details Drawer */}
      <DepartmentDrawer
        departmentId={selectedDept}
        onClose={() => setSelectedDept(null)}
      />
    </div>
  )
}
