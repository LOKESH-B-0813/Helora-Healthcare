'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  BedDouble,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  DoorOpen,
  Eye,
  FileText,
  FlaskConical,
  GitBranch,
  HeartPulse,
  Info,
  Layers,
  Network,
  Radio,
  Server,
  ShieldAlert,
  Sparkles,
  Target,
  Waves,
  Zap,
} from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { DemoController } from '@/components/staff/demo-controller'
import { cn } from '@/lib/utils'

interface CascadeStage {
  step: number
  id: string
  offset: string
  timeOffset: string
  time: string
  unit: string
  icon: React.ElementType
  title: string
  impactBadge: string
  severity: 'critical' | 'warning'
  description: string
  rootMechanism: string
  telemetrySource: string
  metrics: {
    label: string
    value: string
    delta: string
  }[]
}

const CASCADE_CHAIN: CascadeStage[] = [
  {
    step: 1,
    id: 'now',
    offset: 'now',
    timeOffset: 'NOW (11:32 AM)',
    time: '11:32:01 AM',
    unit: 'Laboratory',
    icon: FlaskConical,
    title: 'Analyzer #2 (LAB-AN-02) Hardware Drop',
    impactBadge: 'CURRENT ROOT CAUSE',
    severity: 'critical',
    description: 'Biochemistry sample velocity halved. Specimen backlog escalating rapidly from baseline 74% to 92% capacity.',
    rootMechanism: 'Hardware pump manifold fault detected in LAB-AN-02 unit.',
    telemetrySource: 'Sunquest LIS Live Diagnostics Stream',
    metrics: [
      { label: 'Lab Utilization', value: '92%', delta: '+18% above baseline' },
      { label: 'Specimen Backlog', value: '44 samples', delta: '+26 pending' },
      { label: 'Average Lab Wait', value: '54 min', delta: '+23 min delay' },
    ],
  },
  {
    step: 2,
    id: '30m',
    offset: '30m',
    timeOffset: '+30m (12:02 PM)',
    time: '12:02:00 PM',
    unit: 'Doctor Review',
    icon: Building2,
    title: 'Diagnostic Review Backlog Escalation',
    impactBadge: '+30m PROJECTION',
    severity: 'warning',
    description: 'Specialists unable to sign off on clinical treatment plans, step-down orders, or release authorizations without delayed lab panels.',
    rootMechanism: 'Clinical order dependencies stalled pending blood chemistry reports.',
    telemetrySource: 'FHIR R4 DiagnosticOrder Stream',
    metrics: [
      { label: 'Delayed Reviews', value: '14 patients', delta: '+14 physician holds' },
      { label: 'Cardiology Backlog', value: '6 patients', delta: '+35 min delay' },
      { label: 'Medicine Backlog', value: '8 patients', delta: '+40 min delay' },
    ],
  },
  {
    step: 3,
    id: '60m',
    offset: '60m',
    timeOffset: '+60m (12:32 PM)',
    time: '12:32:00 PM',
    unit: 'Discharge Unit',
    icon: DoorOpen,
    title: 'Inpatient Discharge Pipeline Stall',
    impactBadge: '+60m PROJECTION',
    severity: 'warning',
    description: 'Medically stable patients held in inpatient beds awaiting official departure authorization summaries.',
    rootMechanism: 'Delayed physician reviews block pharmacy prescription sign-offs and ADT discharge workflows.',
    telemetrySource: 'HL7 ADT Discharge Protocol Stream',
    metrics: [
      { label: 'Delayed Discharges', value: '9 patients', delta: '+9 held inpatients' },
      { label: 'Ward A Discharges', value: '5 delayed', delta: '+45 min hold' },
      { label: 'Ward B Discharges', value: '4 delayed', delta: '+50 min hold' },
    ],
  },
  {
    step: 4,
    id: '90m',
    offset: '90m',
    timeOffset: '+90m (1:02 PM)',
    time: '1:02:00 PM',
    unit: 'Bed Availability',
    icon: BedDouble,
    title: 'Inpatient Bed Census Depletion',
    impactBadge: '+90m PROJECTION',
    severity: 'critical',
    description: 'Ward census fails to turnover. Available inpatient beds drop from 18 to 11 reserve slots, threatening acute intake.',
    rootMechanism: 'Upstream stalled discharges prevent bed cleaning teams from sanitizing rooms for inbound admissions.',
    telemetrySource: 'TeleTracking Bed Census Sensors',
    metrics: [
      { label: 'Blocked Inpatient Beds', value: '7 beds', delta: 'Turnover frozen' },
      { label: 'Available Beds Remaining', value: '11 beds', delta: '-38% reserve' },
      { label: 'Turnover Latency', value: '84 min', delta: '+38 min above SLA' },
    ],
  },
  {
    step: 5,
    id: '120m',
    offset: '120m',
    timeOffset: '+120m (1:32 PM)',
    time: '1:32:00 PM',
    unit: 'Emergency Department',
    icon: HeartPulse,
    title: 'Emergency Boarding & Ambulance Hold Surge',
    impactBadge: '+120m CRITICAL RISK',
    severity: 'critical',
    description: 'Incoming acute ambulance arrivals held at triage due to zero available upstairs inpatient beds for admission.',
    rootMechanism: 'Complete lack of inpatient downstream outflow causes acute intake backlog at the front door.',
    telemetrySource: 'ED Triage Queue & Ambulance Telemetry',
    metrics: [
      { label: 'ED Queue Wait', value: '43 min', delta: '18m → 43m (+138%)' },
      { label: 'Boarded Inpatients in ED', value: '6 patients', delta: 'Occupying acute bays' },
      { label: 'Ambulance Diversion Risk', value: '86% Probable', delta: 'Imminent alert' },
    ],
  },
]

export default function RippleAnalysisPage() {
  const { state } = useFlowPulse()
  const [selectedStageId, setSelectedStageId] = useState<string>('120m')

  const selectedStage =
    CASCADE_CHAIN.find((s) => s.id === selectedStageId) || CASCADE_CHAIN[4]
  const selectedIndex = CASCADE_CHAIN.findIndex((s) => s.id === selectedStageId)

  return (
    <div className="space-y-6 pb-12">
      {/* Demo Controls Bar */}
      <DemoController />

      {/* ZONE 1: Organized Executive Incident Brief */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xs">
        {/* Top Incident Status Banner */}
        <div className="border-b border-border bg-slate-900 px-6 py-5 text-white sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-red-300 ring-1 ring-red-400/40">
                  <Waves className="size-3.5 animate-pulse text-red-400" /> RIPPLE PROPAGATION ENGINE
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  AI Incident ID: <strong className="text-slate-200">INC-2026-LAB02</strong>
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Root Cause: Biochemistry Analyzer #2 (LAB-AN-02) Offline
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/staff/scenario-simulator"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-hover hover:scale-105 active:scale-95"
              >
                <Sparkles className="size-4" /> SIMULATE SOLUTIONS <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Key Executive Fact Badges */}
        <div className="grid grid-cols-2 divide-y divide-border sm:grid-cols-4 sm:divide-x sm:divide-y-0 bg-slate-50/50 dark:bg-card">
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Root Cause Asset</span>
            <p className="mt-1 text-base font-extrabold text-slate-900">LAB-AN-02 (Offline)</p>
            <span className="text-[11px] text-critical font-semibold">Loss: 34% Lab Capacity</span>
          </div>
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Incident Detected</span>
            <p className="mt-1 text-base font-extrabold text-slate-900">11:32:01 AM (Live)</p>
            <span className="text-[11px] text-slate-500 font-medium">Automatic telemetry trigger</span>
          </div>
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Propagation Horizon</span>
            <p className="mt-1 text-base font-extrabold text-purple-700">120 Minutes (5 Stages)</p>
            <span className="text-[11px] text-purple-900 font-semibold">Ends in ED congestion</span>
          </div>
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Prediction Confidence</span>
            <p className="mt-1 text-base font-extrabold text-emerald-700">89% High Precision</p>
            <span className="text-[11px] text-emerald-800 font-medium">18,400 calibrated flows</span>
          </div>
        </div>
      </div>

      {/* ZONE 2: 5-Stage Interactive Cascade Stepper Pipeline */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Network className="size-5 text-primary" /> 5-STAGE CASCADE PROPAGATION PIPELINE
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Click any stage below to inspect its operational metrics, root mechanism, and connected live data feed.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-foreground">
            Stage {selectedIndex + 1} of 5 Active
          </span>
        </div>

        {/* Visual Pipeline Bar */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
          {CASCADE_CHAIN.map((stage, idx) => {
            const isSelected = selectedStageId === stage.id
            const isPast = idx <= selectedIndex
            const Icon = stage.icon

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStageId(stage.id)}
                className={cn(
                  'group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 shadow-2xs hover:-translate-y-0.5',
                  isSelected
                    ? 'border-primary bg-primary/[0.04] ring-4 ring-primary/20 shadow-md'
                    : isPast
                      ? 'border-border bg-slate-50/80 hover:border-slate-300 dark:bg-card'
                      : 'border-slate-200 bg-white opacity-65 hover:opacity-100 dark:border-border dark:bg-card',
                )}
              >
                {/* Top indicator & step number */}
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'flex size-7 items-center justify-center rounded-xl text-xs font-black shadow-2xs',
                        stage.severity === 'critical'
                          ? 'bg-critical text-white'
                          : 'bg-amber-500 text-white',
                      )}
                    >
                      {stage.step}
                    </span>
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 font-mono text-[10px] font-black',
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-slate-200 text-slate-700 dark:bg-muted dark:text-foreground',
                      )}
                    >
                      {stage.offset === 'now' ? 'NOW' : `+${stage.offset}`}
                    </span>
                  </div>

                  {/* Stage Icon & Unit Name */}
                  <div className="mt-3 flex items-center gap-2">
                    <Icon className="size-4 text-slate-700 dark:text-slate-300 shrink-0" />
                    <span className="text-xs font-black text-slate-900 truncate dark:text-foreground">
                      {stage.unit}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] font-bold text-slate-600 leading-snug line-clamp-2 dark:text-muted-foreground">
                    {stage.title}
                  </p>
                </div>

                {/* Bottom Impact Tag */}
                <div className="mt-4 pt-2 border-t border-slate-200/80 dark:border-border">
                  <span
                    className={cn(
                      'text-[10px] font-black uppercase tracking-wider',
                      stage.severity === 'critical'
                        ? 'text-critical'
                        : 'text-amber-600',
                    )}
                  >
                    {stage.impactBadge}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ZONE 3: 2-Column Structured Deep-Dive (Selected Stage Detail + Attribution & Source Matrix) */}
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        {/* Left: Deep-Dive Details for Selected Pipeline Stage */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-7 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-sm shadow-xs">
                {selectedStage.step}
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Stage {selectedStage.step} of 5 · {selectedStage.timeOffset}
                </span>
                <h3 className="text-lg font-black text-foreground">
                  {selectedStage.title}
                </h3>
              </div>
            </div>

            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider',
                selectedStage.severity === 'critical'
                  ? 'bg-critical text-white shadow-xs'
                  : 'bg-amber-500 text-white shadow-xs',
              )}
            >
              {selectedStage.impactBadge}
            </span>
          </div>

          {/* Operational Context & Mechanism */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-slate-50/50 p-4 dark:bg-muted/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Info className="size-3.5 text-primary" /> Clinical Flow Impact
              </span>
              <p className="mt-2 text-xs leading-relaxed text-slate-700 font-medium dark:text-muted-foreground">
                {selectedStage.description}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-slate-50/50 p-4 dark:bg-muted/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Cpu className="size-3.5 text-primary" /> Root Mechanism
              </span>
              <p className="mt-2 text-xs leading-relaxed text-slate-700 font-medium dark:text-muted-foreground">
                {selectedStage.rootMechanism}
              </p>
            </div>
          </div>

          {/* 3 Metric Summary Boxes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Live Stage Quantifications ({selectedStage.timeOffset})
            </h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {selectedStage.metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate block">
                    {m.label}
                  </span>
                  <p className="mt-1 text-xl font-black text-foreground">{m.value}</p>
                  <span className="mt-1 block text-[11px] font-bold text-critical truncate">
                    {m.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Telemetry Integration Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-xs">
            <span className="flex items-center gap-2 font-bold text-foreground">
              <Radio className="size-4 text-primary animate-pulse" /> Telemetry Feed Source:
            </span>
            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
              {selectedStage.telemetrySource}
            </span>
          </div>
        </div>

        {/* Right: Root Cause Attribution Breakdown & Telemetry Feeds */}
        <div className="space-y-6">
          {/* Root Cause Contribution Breakdown Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-7">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Zap className="size-4 text-amber-500" /> Root Cause Attribution
              </h3>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                ED Wait Breakdown
              </span>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Relative contribution of each upstream bottleneck to final Emergency boarding surge:
            </p>

            <div className="mt-4 space-y-3.5">
              {[
                { name: '1. Laboratory Analyzer Drop', percentage: 31, color: '#ef4444' },
                { name: '2. Doctor Review Backlog', percentage: 23, color: '#f59e0b' },
                { name: '3. Delayed Inpatient Discharges', percentage: 17, color: '#3b82f6' },
                { name: '4. Bed Cleaning & Turnover Hold', percentage: 13, color: '#8b5cf6' },
                { name: '5. Pharmacy Prescription Dispensing', percentage: 9, color: '#10b981' },
                { name: '6. Other Intake Variance', percentage: 7, color: '#64748b' },
              ].map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{item.name}</span>
                    <span className="font-mono font-black text-foreground">{item.percentage}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/[0.04] p-3.5 text-xs">
              <p className="font-bold text-primary">Intervention Opportunity:</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Resolving <strong>Laboratory Capacity (31%)</strong> and <strong>Doctor Review (23%)</strong> eliminates <strong>54%</strong> of the downstream boarding ripple before it impacts Emergency triage.
              </p>
            </div>
          </div>

          {/* AI Explanation & Active Data Sources */}
          <div className="rounded-3xl border border-purple-200 bg-purple-50/40 p-6 shadow-xs sm:p-7 dark:border-border dark:bg-card">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-900 shadow-2xs">
                <Sparkles className="size-3.5 text-purple-700" /> AI PREDICTION ENGINE
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Sync: 5s ago</span>
            </div>

            <h4 className="mt-3 text-sm font-bold text-foreground">
              Why FlowPulse Flagged This Cascade
            </h4>

            <ul className="mt-3 space-y-2 text-xs">
              <li className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-2xs border border-purple-100 dark:bg-muted/30 dark:border-border">
                <span className="font-semibold text-slate-800 dark:text-foreground">• Diagnostic Hardware Loss:</span>
                <span className="font-bold text-critical">Critical (34%)</span>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-2xs border border-purple-100 dark:bg-muted/30 dark:border-border">
                <span className="font-semibold text-slate-800 dark:text-foreground">• Inflow Specimen Volume:</span>
                <span className="font-bold text-critical">+21% Surge</span>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-2xs border border-purple-100 dark:bg-muted/30 dark:border-border">
                <span className="font-semibold text-slate-800 dark:text-foreground">• Downstream Bed Dependency:</span>
                <span className="font-bold text-amber-600">High (7 Beds)</span>
              </li>
            </ul>

            <div className="mt-4 pt-3 border-t border-purple-200/60 dark:border-border text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-foreground">Next Action:</span>
              <Link
                href="/staff/scenario-simulator"
                className="font-bold text-primary hover:underline flex items-center gap-1"
              >
                Evaluate Counterfactual Policies →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
