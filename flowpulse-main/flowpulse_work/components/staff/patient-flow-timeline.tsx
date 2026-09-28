'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Filter,
  FlaskConical,
  HeartPulse,
  Info,
  Layers,
  Maximize2,
  Radio,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Timer,
  User,
  Users,
  Waves,
  X,
  Zap,
} from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import {
  getTimelineSchedule,
  getTimelineSummaryMetrics,
} from '@/lib/state/selectors'
import type {
  DepartmentId,
  DelayCategory,
  TimelineStatus,
  TimelinePatientEntry,
  TimeHorizon,
} from '@/lib/data/types'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<
  TimelineStatus,
  { label: string; icon: React.ElementType; badgeClass: string; dotClass: string }
> = {
  COMPLETED: {
    label: 'COMPLETED',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-500',
  },
  IN_PROGRESS: {
    label: 'IN PROGRESS',
    icon: Activity,
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-500 animate-pulse',
  },
  WAITING: {
    label: 'WAITING',
    icon: Clock,
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-500',
  },
  DELAYED: {
    label: 'DELAYED',
    icon: AlertTriangle,
    badgeClass: 'bg-critical/15 text-critical border-critical/30',
    dotClass: 'bg-critical animate-ping',
  },
  PREDICTED_CHANGE: {
    label: 'RECOVERY UPDATE',
    icon: Sparkles,
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
    dotClass: 'bg-purple-500',
  },
  SCHEDULED: {
    label: 'SCHEDULED',
    icon: Calendar,
    badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30',
    dotClass: 'bg-slate-400',
  },
}

export function PatientFlowTimeline({
  initialDepartment = 'cardiology',
}: {
  initialDepartment?: string
}) {
  const { state, setTimeHorizon } = useFlowPulse()

  const [selectedDept, setSelectedDept] = useState<string>(initialDepartment)
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'predicted' | 'scheduled' | 'delay' | 'position' | 'status'>('predicted')
  const [activePatient, setActivePatient] = useState<TimelinePatientEntry | null>(null)
  const [showComparison, setShowComparison] = useState(false)

  const horizon = state.timeHorizon || 'now'

  const isLabFailure =
    state.activeScenario === 'lab-analyzer-failure' &&
    state.scenarioPhase >= 2 &&
    state.scenarioPhase < 5
  const isRecovered =
    state.activeScenario === 'lab-analyzer-failure' &&
    (state.scenarioPhase >= 5 || state.approvedIntervention !== null)

  // Compute live timeline schedule items
  const entries = useMemo(() => {
    return getTimelineSchedule(state, {
      departmentId: selectedDept,
      doctorId: selectedDoctor,
      status: selectedStatus,
      horizon,
      searchQuery,
      sortBy,
    })
  }, [state, selectedDept, selectedDoctor, selectedStatus, horizon, searchQuery, sortBy])

  // Summary Metrics
  const summary = useMemo(() => {
    return getTimelineSummaryMetrics(state, entries)
  }, [state, entries])

  const clearFilters = () => {
    setSelectedDept('all')
    setSelectedDoctor('all')
    setSelectedStatus('all')
    setSearchQuery('')
    setSortBy('predicted')
  }

  const hasActiveFilters =
    selectedDept !== 'all' ||
    selectedDoctor !== 'all' ||
    selectedStatus !== 'all' ||
    searchQuery.trim().length > 0

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar & Filters */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-6 space-y-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary">
                <Clock className="size-3.5" /> LIVE PATIENT FLOW TIMELINE
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE STREAM
              </span>
              <span className="text-xs text-muted-foreground">
                Last Synchronized: <strong className="text-foreground">10:42 AM</strong>
              </span>
            </div>
            <h2 className="mt-1.5 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              Daily Flow Schedule & Queue Sequencing
            </h2>
          </div>

          {/* Time Horizon Forecast Selector */}
          <div className="flex items-center gap-1 rounded-2xl border border-border bg-muted/30 p-1 shadow-2xs">
            <span className="px-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground hidden sm:inline">
              Horizon:
            </span>
            {(['now', '30m', '60m', '120m'] as TimeHorizon[]).map((h) => {
              const isActive = horizon === h
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => setTimeHorizon(h)}
                  className={cn(
                    'rounded-xl px-3 py-1 text-xs font-bold transition-all',
                    isActive
                      ? h === 'now'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-purple-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {h === 'now' ? 'NOW' : `+${h.replace('m', ' MIN')}`}
                </button>
              )
            })}
          </div>
        </div>

        {/* Dropdown Filters Bar */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 border-t border-border pt-4 text-xs">
          {/* Department Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 font-semibold text-foreground outline-none focus:border-primary"
            >
              <option value="all">All Hospital Departments</option>
              <option value="cardiology">Cardiology</option>
              <option value="general-opd">General OPD</option>
              <option value="laboratory">Laboratory</option>
              <option value="radiology">Radiology</option>
              <option value="emergency">Emergency</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
          </div>

          {/* Doctor Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Attending Physician
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 font-semibold text-foreground outline-none focus:border-primary"
            >
              <option value="all">All Doctors</option>
              <option value="DOC-101">Dr. Ananya Rao (Cardiology)</option>
              <option value="DOC-102">Dr. Meera Iyer (Cardiology)</option>
              <option value="DOC-103">Dr. Rajesh Sharma (General OPD)</option>
              <option value="DOC-104">Dr. Sunita Patel (Laboratory)</option>
              <option value="DOC-105">Dr. Amit Verma (Radiology)</option>
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Date Horizon
            </label>
            <select
              className="h-9 w-full rounded-xl border border-border bg-background px-3 font-semibold text-foreground outline-none focus:border-primary"
              defaultValue="today"
            >
              <option value="today">Today (Live Stream)</option>
              <option value="tomorrow">Tomorrow Morning Shift</option>
              <option value="next-shift">Next 8-Hour Cycle</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Sort Sequence
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 font-semibold text-foreground outline-none focus:border-primary"
            >
              <option value="predicted">Predicted Service Time (Earliest)</option>
              <option value="scheduled">Scheduled Time</option>
              <option value="delay">Highest Delay First</option>
              <option value="position">Queue Position (#1 to #N)</option>
              <option value="status">Status Grouping</option>
            </select>
          </div>
        </div>

        {/* Search & Status Pill Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patient name, token, ID, doctor, or department..."
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

          {/* Quick Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['all', 'waiting', 'in_progress', 'delayed', 'scheduled', 'completed'].map((st) => {
              const isSelected = selectedStatus.toLowerCase() === st.toLowerCase()
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={cn(
                    'rounded-xl px-2.5 py-1 font-bold capitalize transition-all text-[11px]',
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                      : 'border border-border bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  {st.replace('_', ' ')}
                </button>
              )
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-critical/30 bg-critical/10 px-2.5 py-1 text-[11px] font-bold text-critical hover:bg-critical/20"
              >
                Clear Filters
              </button>
            )}

            {/* Toggle Before/After Comparison */}
            <button
              type="button"
              onClick={() => setShowComparison((prev) => !prev)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-[11px] font-bold transition-all shadow-2xs',
                showComparison
                  ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-400'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted',
              )}
            >
              <Sparkles className="size-3 text-purple-600" />
              <span>{showComparison ? 'Hide Before/After' : 'Compare Before vs After'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Scheduled Today
          </span>
          <p className="mt-1 text-2xl font-black text-foreground">{summary.scheduledToday}</p>
          <span className="text-[10px] text-muted-foreground">Confirmed roster</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Currently Waiting
          </span>
          <p className="mt-1 text-2xl font-black text-amber-600">{summary.currentlyWaiting}</p>
          <span className="text-[10px] text-muted-foreground">In active queues</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Currently Serving
          </span>
          <p className="mt-1 text-2xl font-black text-primary">{summary.currentlyServing}</p>
          <span className="text-[10px] text-muted-foreground">In consultation / bays</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Average Delay
          </span>
          <p className="mt-1 text-2xl font-black text-foreground">
            +{summary.averageDelayMinutes} <span className="text-sm font-semibold text-muted-foreground">min</span>
          </p>
          <span className="text-[10px] text-muted-foreground">Clinic delay variance</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Longest Delay
          </span>
          <p className="mt-1 text-2xl font-black text-critical">
            +{summary.longestDelayMinutes} <span className="text-sm font-semibold text-muted-foreground">min</span>
          </p>
          <span className="text-[10px] text-critical font-semibold">Laboratory backlogged</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            On-Time Completion
          </span>
          <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {summary.expectedOnTimePercent}%
          </p>
          <span className="text-[10px] text-muted-foreground">Within SLA window</span>
        </div>
      </div>

      {/* 3. TIME SAVED Recovery Banner (Shown during recovery) */}
      {isRecovered && summary.isRecovered && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-5 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
              <Sparkles className="size-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                RECOVERY GAINS ACTIVE · OPTION C EXECUTED
              </span>
              <h3 className="text-sm font-bold text-foreground">
                Backup Analyzer Online: Schedule Recovery Dynamics
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
            <div className="rounded-2xl bg-card border border-emerald-500/30 px-3.5 py-1.5 shadow-2xs">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Patient Level:</span>
              <p className="text-base font-black text-emerald-700 dark:text-emerald-400">9 min saved</p>
            </div>
            <div className="rounded-2xl bg-card border border-emerald-500/30 px-3.5 py-1.5 shadow-2xs">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Queue Level:</span>
              <p className="text-base font-black text-emerald-700 dark:text-emerald-400">11 min avg saved</p>
            </div>
            <div className="rounded-2xl bg-card border border-emerald-500/30 px-3.5 py-1.5 shadow-2xs">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Hospital Level:</span>
              <p className="text-base font-black text-emerald-700 dark:text-emerald-400">128 patient-min recovered</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Before vs After Comparison Card (If Toggled) */}
      {showComparison && (
        <div className="rounded-3xl border border-purple-500/30 bg-purple-500/[0.04] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-purple-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Timeline Before vs After Option C (Activate Backup Analyzer)
              </h3>
            </div>
            <span className="rounded-md bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
              AI Counterfactual Validation
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Arjun Kumar (C-021)</span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  9m Saved
                </span>
              </div>
              <div className="text-[11px] space-y-1 text-muted-foreground">
                <p>• Before: Lab 11:31 AM → Exit <strong>12:16 PM</strong></p>
                <p>• After Option C: Lab 11:22 AM → Exit <strong>12:07 PM</strong></p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Priya S. (C-020)</span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  11m Saved
                </span>
              </div>
              <div className="text-[11px] space-y-1 text-muted-foreground">
                <p>• Before: Review 11:54 AM → Exit <strong>12:24 PM</strong></p>
                <p>• After Option C: Review 11:42 AM → Exit <strong>12:13 PM</strong></p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Ravi M. (C-022)</span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  15m Saved
                </span>
              </div>
              <div className="text-[11px] space-y-1 text-muted-foreground">
                <p>• Before: Consult 11:15 AM → Exit <strong>12:37 PM</strong></p>
                <p>• After Option C: Consult 11:06 AM → Exit <strong>12:22 PM</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Schedule Table (Desktop) / Cards (Mobile) */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xs">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3.5">Time</th>
                <th className="px-4 py-3.5">Patient / Token</th>
                <th className="px-4 py-3.5">Doctor & Dept</th>
                <th className="px-3 py-3.5">Scheduled</th>
                <th className="px-3 py-3.5">Predicted</th>
                <th className="px-3 py-3.5">Delay</th>
                <th className="px-3 py-3.5 text-center">Queue Pos</th>
                <th className="px-3 py-3.5">Status</th>
                <th className="px-3 py-3.5">Next Stage</th>
                <th className="px-3 py-3.5">Est. Exit</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {entries.length > 0 ? (
                entries.map((item, index) => {
                  const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.SCHEDULED
                  const StatusIcon = statusInfo.icon
                  const isTargetPatient = item.patientName === 'Arjun Kumar'

                  // Insert horizontal NOW marker before the first waiting/in-progress patient around 10:42 AM
                  const showNowMarker = index === 3

                  return (
                    <React.Fragment key={item.id}>
                      {showNowMarker && (
                        <tr className="bg-primary/[0.06] border-y-2 border-primary/50">
                          <td colSpan={11} className="py-2 px-4 text-center">
                            <div className="flex items-center justify-center gap-3 text-[11px] font-black tracking-wider text-primary">
                              <span className="h-px flex-1 bg-primary/40" />
                              <span className="flex items-center gap-1.5 bg-card px-3 py-0.5 rounded-full border border-primary/40 shadow-2xs">
                                <span className="size-2 rounded-full bg-primary animate-ping" />
                                10:42 AM • CURRENT TIME (NOW)
                              </span>
                              <span className="h-px flex-1 bg-primary/40" />
                            </div>
                          </td>
                        </tr>
                      )}

                      <tr
                        onClick={() => setActivePatient(item)}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-muted/30',
                          isTargetPatient && 'bg-primary/[0.03] ring-1 ring-primary/20',
                        )}
                      >
                        {/* Time Column */}
                        <td className="px-4 py-3.5 font-mono font-bold text-foreground">
                          {item.scheduledTime}
                        </td>

                        {/* Patient & Token */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white font-mono text-[10px] font-black">
                              {item.token}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-foreground">{item.patientName}</span>
                                {isTargetPatient && (
                                  <span className="rounded-full bg-primary px-1.5 py-0.2 text-[8px] font-bold text-white">
                                    TARGET
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono">{item.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Doctor & Dept */}
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-foreground">{item.doctorName}</p>
                          <span className="text-[10px] text-muted-foreground capitalize">{item.departmentName}</span>
                        </td>

                        {/* Scheduled Time */}
                        <td className="px-3 py-3.5 font-mono text-muted-foreground">
                          {item.scheduledTime}
                        </td>

                        {/* Predicted Service Time */}
                        <td className="px-3 py-3.5">
                          <span
                            className={cn(
                              'font-mono font-bold',
                              horizon !== 'now'
                                ? 'text-purple-600 dark:text-purple-400'
                                : item.delayMinutes > 15
                                  ? 'text-critical'
                                  : 'text-foreground',
                            )}
                          >
                            {item.predictedServiceTime}
                          </span>
                        </td>

                        {/* Delay */}
                        <td className="px-3 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                              item.delayMinutes <= 5
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : item.delayMinutes <= 15
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                  : 'bg-critical/15 text-critical',
                            )}
                          >
                            {item.delayMinutes <= 5 ? 'ON TIME' : `+${item.delayMinutes}m`}
                          </span>
                        </td>

                        {/* Queue Position */}
                        <td className="px-3 py-3.5 text-center">
                          {item.queuePosition !== null ? (
                            <div>
                              <span className="font-bold text-foreground">#{item.queuePosition}</span>
                              <span className="block text-[9px] text-muted-foreground">({item.patientsAhead} ahead)</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                              statusInfo.badgeClass,
                            )}
                          >
                            <span className={cn('size-1.5 rounded-full', statusInfo.dotClass)} />
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>

                        {/* Next Stage */}
                        <td className="px-3 py-3.5 font-medium text-foreground">
                          <span>{item.nextStage}</span>
                          {item.projectedDelaysNotice && (
                            <span className="block text-[9px] font-bold text-critical">
                              {item.projectedDelaysNotice}
                            </span>
                          )}
                        </td>

                        {/* Expected Completion */}
                        <td className="px-3 py-3.5 font-mono font-bold text-foreground">
                          {item.expectedCompletionTime}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActivePatient(item)
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="size-3" />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-muted-foreground">
                    No matching patient flow records found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Timeline Cards View */}
        <div className="md:hidden divide-y divide-border/60">
          {entries.length > 0 ? (
            entries.map((item) => {
              const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.SCHEDULED
              return (
                <div
                  key={item.id}
                  onClick={() => setActivePatient(item)}
                  className="p-4 space-y-3 cursor-pointer hover:bg-muted/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-mono text-xs font-bold">
                        {item.token}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{item.patientName}</h4>
                        <p className="text-[10px] text-muted-foreground">{item.doctorName} · {item.departmentName}</p>
                      </div>
                    </div>
                    <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase', statusInfo.badgeClass)}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Scheduled:</span>
                      <p className="font-mono font-semibold text-foreground">{item.scheduledTime}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Predicted Service:</span>
                      <p className="font-mono font-bold text-primary">{item.predictedServiceTime} (+{item.delayMinutes}m)</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Queue Position:</span>
                      <p className="font-bold text-foreground">
                        {item.queuePosition !== null ? `#${item.queuePosition} (${item.patientsAhead} ahead)` : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Est. Completion:</span>
                      <p className="font-mono font-bold text-foreground">{item.expectedCompletionTime}</p>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No matching patient records found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
          <span>Showing {entries.length} scheduled visits</span>
          <span>Click any patient row to inspect the full 6-stage care timeline</span>
        </div>
      </div>

      {/* 6. Patient Detail Drawer */}
      {activePatient && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Patient Journey Timeline
              </span>
              <h2 className="text-base font-bold text-foreground">
                {activePatient.patientName} ({activePatient.token})
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
            {/* Summary Strip */}
            <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Attending Physician:</span>
                <span className="font-bold text-foreground">{activePatient.doctorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Clinical Department:</span>
                <span className="font-bold text-foreground">{activePatient.departmentName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Scheduled Appointment:</span>
                <span className="font-mono font-bold text-foreground">{activePatient.scheduledTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Queue Position:</span>
                <span className="font-bold text-primary">
                  {activePatient.queuePosition !== null ? `#${activePatient.queuePosition} (${activePatient.patientsAhead} patients ahead)` : 'Completed'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expected Consultation:</span>
                <span className="font-mono font-bold text-foreground">{activePatient.predictedServiceTime}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-2">
                <span className="text-muted-foreground font-semibold">Expected Visit Completion:</span>
                <span className="font-mono font-black text-foreground text-sm">{activePatient.expectedCompletionTime}</span>
              </div>
            </div>

            {/* Time Saved Recovery Gain (If Available) */}
            {activePatient.timeSavedMinutes && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="size-4 text-emerald-600" /> Option C Recovery Impact:
                </span>
                <span className="font-mono font-black text-sm">{activePatient.timeSavedMinutes} min saved</span>
              </div>
            )}

            {/* 6-Stage Care Journey Timeline */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                6-Stage Care Progression
              </h3>
              <div className="mt-3 space-y-2.5">
                {activePatient.careStages.map((stage, idx) => {
                  const isCompleted = stage.status === 'completed'
                  const isInProgress = stage.status === 'in-progress'
                  return (
                    <div
                      key={stage.stageName}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border p-3 shadow-2xs transition-colors',
                        isCompleted
                          ? 'border-border bg-card'
                          : isInProgress
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                            : 'border-border/60 bg-muted/20 opacity-75',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInProgress
                              ? 'bg-primary text-white animate-pulse'
                              : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {isCompleted ? <Check className="size-3.5" /> : idx + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{stage.stageName}</span>
                          <span className="font-mono text-[10px] font-bold text-foreground">
                            {stage.actualTime || stage.expectedTime}
                          </span>
                        </div>
                        {stage.note && (
                          <p className="mt-0.5 text-[10px] font-semibold text-critical">
                            {stage.note}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Policy Notice */}
            <div className="rounded-2xl border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground">
              Clinical priority is assigned strictly by medical triage protocols. FlowPulse calculates queue throughput and stage transit times.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
