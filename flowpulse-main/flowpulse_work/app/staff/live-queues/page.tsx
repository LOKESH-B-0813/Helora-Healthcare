'use client'

import React, { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  DoorOpen,
  Filter,
  FlaskConical,
  HeartPulse,
  Info,
  Layers,
  Pill,
  Radio,
  Search,
  Sparkles,
  Stethoscope,
  Target,
  Users,
  Waves,
  X,
  Zap,
} from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { DemoController } from '@/components/staff/demo-controller'
import { PatientFlowTimeline } from '@/components/staff/patient-flow-timeline'
import { getQueueSummary, getAllQueues } from '@/lib/state/selectors'
import type { DepartmentId, DepartmentQueue, QueuePatient, QueueStatus } from '@/lib/data/types'
import { cn } from '@/lib/utils'

const DEPT_ICONS: Record<string, React.ElementType> = {
  emergency: HeartPulse,
  cardiology: Activity,
  'general-opd': Stethoscope,
  laboratory: FlaskConical,
  radiology: Radio,
  pharmacy: Pill,
}

const statusBadgeStyles: Record<QueueStatus, { bg: string; text: string; dot: string; label: string }> = {
  HEALTHY: {
    bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    label: 'HEALTHY',
  },
  MODERATE: {
    bg: 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-400',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
    label: 'MODERATE',
  },
  WARNING: {
    bg: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    label: 'WARNING',
  },
  CRITICAL: {
    bg: 'bg-critical/15 border-critical/30 text-critical',
    text: 'text-critical',
    dot: 'bg-critical',
    label: 'CRITICAL',
  },
  RECOVERING: {
    bg: 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-400',
    text: 'text-purple-700 dark:text-purple-400',
    dot: 'bg-purple-500',
    label: 'RECOVERING',
  },
}

function LiveQueuesContent() {
  const { state } = useFlowPulse()
  const searchParams = useSearchParams()

  const initialTab = (searchParams.get('tab') as 'overview' | 'timeline' | 'forecast') || 'timeline'
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'forecast'>(initialTab)

  const [selectedQueueId, setSelectedQueueId] = useState<string | null>('q-laboratory')
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const queues = useMemo(() => getAllQueues(state), [state])
  const summary = useMemo(() => getQueueSummary(state), [state])

  const selectedQueue = useMemo(
    () => queues.find((q) => q.queueId === selectedQueueId) || queues[0] || null,
    [queues, selectedQueueId],
  )

  const isLabFailure =
    state.activeScenario === 'lab-analyzer-failure' &&
    state.scenarioPhase >= 2 &&
    state.scenarioPhase < 5

  // Filtered patients for the active selected queue
  const filteredPatients = useMemo(() => {
    if (!selectedQueue) return []
    return (selectedQueue.waitingPatients || []).filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.patientId.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesPriority =
        priorityFilter === 'all' || p.priority.toLowerCase() === priorityFilter.toLowerCase()

      return matchesSearch && matchesPriority
    })
  }, [selectedQueue, searchQuery, priorityFilter])

  return (
    <div className="space-y-6 pb-12">
      {/* Demo Controller Bar */}
      <DemoController />

      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary">
              <Clock className="size-3.5" /> LIVE QUEUE INTELLIGENCE & FLOW ENGINE
            </span>
            <span className="text-xs text-muted-foreground">
              Dynamic Token Sequencing · Downstream Delay Mitigation
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Live Hospital Queues
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/staff/ripple-analysis"
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-2xs transition-colors hover:bg-muted"
          >
            <Waves className="size-3.5 text-primary" /> View Ripple Analysis →
          </Link>
          <Link
            href="/staff/scenario-simulator"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-primary-hover active:scale-95"
          >
            <Sparkles className="size-3.5" /> Simulate Interventions
          </Link>
        </div>
      </div>

      {/* 3 Operational View Tabs: [ Queue Overview ] [ Live Timeline ] [ Forecast ] */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={cn(
            'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all shadow-2xs',
            activeTab === 'timeline'
              ? 'bg-primary text-white shadow-sm'
              : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Clock className="size-3.5" />
          <span>LIVE PATIENT FLOW TIMELINE</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={cn(
            'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all shadow-2xs',
            activeTab === 'overview'
              ? 'bg-primary text-white shadow-sm'
              : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Layers className="size-3.5" />
          <span>QUEUE OVERVIEW</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('forecast')}
          className={cn(
            'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all shadow-2xs',
            activeTab === 'forecast'
              ? 'bg-primary text-white shadow-sm'
              : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Zap className="size-3.5" />
          <span>FORECAST HORIZONS</span>
        </button>
      </div>

      {/* TAB 1: LIVE TIMELINE */}
      {activeTab === 'timeline' && (
        <PatientFlowTimeline initialDepartment="cardiology" />
      )}

      {/* TAB 2: QUEUE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Operational Summary Metric Tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Waiting Patients
              </span>
              <p className="mt-1.5 text-2xl font-black text-foreground">
                {summary.totalWaiting || 63}
              </p>
              <span className="text-[11px] text-muted-foreground">Across 8 active units</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Average Hospital Wait
              </span>
              <p className="mt-1.5 text-2xl font-black text-foreground">
                {summary.avgWait} <span className="text-sm font-semibold text-muted-foreground">min</span>
              </p>
              <span className="text-[11px] text-muted-foreground">Door-to-consultation</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Longest Queue Unit
              </span>
              <p className="mt-1.5 text-lg font-black text-critical truncate">
                {summary.longestQueue?.departmentName ?? 'Laboratory'}
              </p>
              <span className="text-[11px] font-bold text-critical">
                {summary.longestQueue?.currentWaitMinutes ?? 34} min average wait
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Critical Queues
              </span>
              <p className={cn('mt-1.5 text-2xl font-black', summary.criticalQueuesCount > 0 ? 'text-critical' : 'text-foreground')}>
                {summary.criticalQueuesCount}
              </p>
              <span className="text-[11px] text-muted-foreground">
                {summary.criticalQueuesCount > 0 ? 'Diagnostic bottleneck' : 'All within target'}
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Patients at Delay Risk
              </span>
              <p className="mt-1.5 text-2xl font-black text-purple-700 dark:text-purple-400">
                {summary.delayRiskPatientsCount}
              </p>
              <span className="text-[11px] text-purple-800 dark:text-purple-300 font-semibold">Exceeding SLA window</span>
            </div>
          </div>

          {/* Main Grid: Queue Health Cards (Left) + Detailed Active Queue Inspector (Right) */}
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left Column: Department Queue Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Layers className="size-4 text-primary" /> DEPARTMENT QUEUE HEATMAP
                </h2>
                <span className="text-[11px] text-muted-foreground">Click a unit to inspect live tokens</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {queues.map((queue) => {
                  const Icon = DEPT_ICONS[queue.departmentId] || Building2
                  const isSelected = selectedQueueId === queue.queueId
                  const statusInfo = statusBadgeStyles[queue.queueStatus] || statusBadgeStyles.HEALTHY

                  return (
                    <div
                      key={queue.queueId}
                      onClick={() => setSelectedQueueId(queue.queueId)}
                      className={cn(
                        'group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 shadow-2xs hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between',
                        isSelected
                          ? 'border-primary bg-primary/[0.03] ring-4 ring-primary/20 shadow-sm'
                          : queue.queueStatus === 'CRITICAL'
                            ? 'border-critical/40 bg-critical-muted/15'
                            : queue.queueStatus === 'WARNING'
                              ? 'border-warning/40 bg-warning-muted/15'
                              : 'border-border bg-card hover:border-border/80',
                      )}
                    >
                      <div>
                        {/* Top Row: Unit Icon & Status Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-2xs',
                                queue.queueStatus === 'CRITICAL'
                                  ? 'bg-critical text-white'
                                  : queue.queueStatus === 'WARNING'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-primary text-white',
                              )}
                            >
                              <Icon className="size-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                {queue.code}
                              </span>
                              <h3 className="text-sm font-bold text-foreground leading-tight">
                                {queue.departmentName}
                              </h3>
                            </div>
                          </div>

                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
                              statusInfo.bg,
                            )}
                          >
                            <span className={cn('size-1.5 rounded-full', statusInfo.dot, queue.queueStatus === 'CRITICAL' && 'animate-ping')} />
                            {queue.queueStatus}
                          </span>
                        </div>

                        {/* Middle: Waiting Count & Estimated Wait Time */}
                        <div className="mt-3.5 flex items-end justify-between">
                          <div>
                            <span className="text-2xl font-black text-foreground">
                              {queue.waitingPatients?.length || 0}
                            </span>
                            <span className="ml-1 text-xs font-semibold text-muted-foreground">waiting</span>
                          </div>

                          <div className="text-right">
                            <span
                              className={cn(
                                'text-lg font-black',
                                queue.currentWaitMinutes >= 30
                                  ? 'text-critical'
                                  : queue.currentWaitMinutes >= 20
                                    ? 'text-amber-600'
                                    : 'text-slate-800 dark:text-slate-200',
                              )}
                            >
                              {queue.currentWaitMinutes} min
                            </span>
                            <span className="block text-[10px] font-semibold text-muted-foreground uppercase">
                              current wait
                            </span>
                          </div>
                        </div>

                        {/* Active Resource Telemetry */}
                        <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground font-medium border-t border-border/50 pt-2">
                          <span className="flex items-center gap-1">
                            <Cpu className="size-3.5 text-primary" />
                            <span>Capacity: <strong>{queue.activeResources} / {queue.maximumResources}</strong> {queue.resourceUnit}</span>
                          </span>
                          <span className="font-mono text-[11px]">
                            Serving: <strong className="text-foreground">{queue.currentToken}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Future Forecast Pill */}
                      <div className="mt-3 rounded-xl bg-slate-100/80 dark:bg-muted/40 px-2.5 py-1.5 text-[11px] flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Forecast (+30m):</span>
                        <span className={cn('font-bold', queue.predictedWait30 >= 35 ? 'text-critical' : 'text-foreground')}>
                          {queue.predictedWait30} min wait
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Column: Detailed Queue Inspector & Live Patient Token Sequencing */}
            {selectedQueue && (
              <div className="space-y-4">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-5">
                  {/* Unit Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-black text-white">
                          {selectedQueue.code}
                        </span>
                        <h3 className="text-lg font-black text-foreground">
                          {selectedQueue.departmentName}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Active capacity: <strong>{selectedQueue.activeResources} of {selectedQueue.maximumResources}</strong> {selectedQueue.resourceUnit} online.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-muted/20 px-3.5 py-2 text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Now Serving</span>
                      <p className="text-lg font-black text-primary font-mono">{selectedQueue.currentToken}</p>
                    </div>
                  </div>

                  {/* Root Cause Explanatory Box (If Critical/Warning) */}
                  {selectedQueue.rootCauses && selectedQueue.rootCauses.length > 0 && (
                    <div className="rounded-2xl border border-critical/30 bg-critical-muted/15 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-critical flex items-center gap-1.5">
                          <AlertOctagon className="size-4 text-critical" /> WHY IS THIS QUEUE CONGESTED?
                        </span>
                        <Link
                          href="/staff/ripple-analysis"
                          className="text-xs font-bold text-critical underline hover:text-critical/80"
                        >
                          Analyze Ripple →
                        </Link>
                      </div>

                      <div className="space-y-2">
                        {selectedQueue.rootCauses.map((rc, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                              <span>{rc.factor}</span>
                              <span className="font-mono font-bold text-critical">{rc.percentage}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-critical/20">
                              <div className="h-full rounded-full bg-critical" style={{ width: `${rc.percentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Patient Search & Priority Filter Toolbar */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative flex-1 min-w-[160px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search token or patient..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>

                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground outline-none"
                    >
                      <option value="all">All Priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="standard">Standard</option>
                    </select>
                  </div>

                  {/* Live Patient Token Queue Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                      <span>Queued Patient</span>
                      <span>Estimated Service Time</span>
                    </div>

                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => {
                          const isTargetPatient = patient.patientId === 'FP-2026-10482' || patient.patientName === 'Arjun Kumar'
                          return (
                            <div
                              key={patient.patientId}
                              className={cn(
                                'flex items-center justify-between rounded-2xl border p-3 text-xs transition-all',
                                isTargetPatient
                                  ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/30 shadow-xs'
                                  : 'border-border bg-slate-50/50 dark:bg-muted/20',
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-mono text-xs font-black">
                                  {patient.token}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-foreground">{patient.patientName}</span>
                                    {isTargetPatient && (
                                      <span className="rounded-full bg-primary px-1.5 py-0.2 text-[9px] font-bold text-white">
                                        TARGET
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    Position: <strong>#{patient.queuePosition}</strong> ({patient.patientsAhead} ahead)
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="font-mono font-bold text-foreground">
                                  {patient.expectedServiceTime}
                                </span>
                                <span className="block text-[10px] font-bold text-primary">
                                  ~{patient.estimatedWaitMinutes}m wait
                                </span>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                          No patients match the search or filter criteria.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Policy & Governance Disclaimer Note */}
                  <div className="rounded-2xl border border-border bg-muted/20 p-3 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>Clinical priority assigned by hospital triage protocols.</span>
                    <span className="font-bold text-foreground">FlowPulse Smart Queue</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FORECAST */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                  PREDICTIVE THROUGHPUT SIMULATION
                </span>
                <h3 className="text-lg font-bold text-foreground">
                  4-Horizon Hospital Queue & Delay Forecast Matrix
                </h3>
              </div>

              <Link
                href="/staff/scenario-simulator"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-hover"
              >
                <Sparkles className="size-3.5" /> Run Counterfactual Simulation
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-[11px]">
                    <th className="py-3 font-bold uppercase">Department Unit</th>
                    <th className="py-3 font-bold uppercase">Active Capacity</th>
                    <th className="py-3 text-center font-bold uppercase">NOW</th>
                    <th className="py-3 text-center font-bold uppercase">+30m Forecast</th>
                    <th className="py-3 text-center font-bold uppercase">+60m Forecast</th>
                    <th className="py-3 text-center font-bold uppercase">+120m Forecast</th>
                    <th className="py-3 text-right font-bold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {queues.map((q) => (
                    <tr key={q.queueId} className="hover:bg-muted/30">
                      <td className="py-3 font-bold text-foreground flex items-center gap-2">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">{q.code}</span>
                        {q.departmentName}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {q.activeResources} / {q.maximumResources} {q.resourceUnit}
                      </td>
                      <td className={cn('py-3 text-center font-bold', q.currentWaitMinutes >= 30 ? 'text-critical' : 'text-foreground')}>
                        {q.currentWaitMinutes}m
                      </td>
                      <td className={cn('py-3 text-center font-bold', q.predictedWait30 >= 35 ? 'text-critical' : 'text-purple-600 dark:text-purple-400')}>
                        {q.predictedWait30}m
                      </td>
                      <td className={cn('py-3 text-center font-bold', q.predictedWait60 >= 35 ? 'text-critical' : 'text-purple-600 dark:text-purple-400')}>
                        {q.predictedWait60}m
                      </td>
                      <td className={cn('py-3 text-center font-bold', q.predictedWait120 >= 35 ? 'text-critical' : 'text-purple-600 dark:text-purple-400')}>
                        {q.predictedWait120}m
                      </td>
                      <td className="py-3 text-right">
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', statusBadgeStyles[q.queueStatus]?.bg)}>
                          {q.queueStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LiveQueuesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-semibold text-muted-foreground">Loading Live Hospital Queues...</div>}>
      <LiveQueuesContent />
    </Suspense>
  )
}
