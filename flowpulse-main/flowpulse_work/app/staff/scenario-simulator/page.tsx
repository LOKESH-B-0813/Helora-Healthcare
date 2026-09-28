'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FlaskConical,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Timer,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { DemoController } from '@/components/staff/demo-controller'
import { cn } from '@/lib/utils'

const COMPARISON_CHART_DATA = [
  {
    name: 'Option A (Do Nothing)',
    edWait: 43,
    delayedDischarges: 9,
    bedsRecovered: 0,
    costScore: 20,
    staffImpactScore: 15,
  },
  {
    name: 'Option B (Reassign Tech)',
    edWait: 31,
    delayedDischarges: 5,
    bedsRecovered: 4,
    costScore: 35,
    staffImpactScore: 55,
  },
  {
    name: 'Option C (Backup Analyzer)',
    edWait: 25,
    delayedDischarges: 3,
    bedsRecovered: 6,
    costScore: 45,
    staffImpactScore: 25,
  },
  {
    name: 'Option D (Tech + Backup)',
    edWait: 21,
    delayedDischarges: 2,
    bedsRecovered: 7,
    costScore: 85,
    staffImpactScore: 80,
  },
]

export default function ScenarioSimulatorPage() {
  const { state, approveIntervention, rejectIntervention, resetScenario } = useFlowPulse()
  const [selectedOptionId, setSelectedOptionId] = useState<string>('option-c')

  const isApproved = state.approvedIntervention !== null || state.interventionState === 'approved'

  const interventions = state.interventions

  return (
    <div className="space-y-6 pb-12">
      {/* Demo Controller */}
      <DemoController />

      {/* Hero Header */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <FlaskConical className="size-3.5" /> Counterfactual Decision Engine
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              "What should we do?" — Intervention Simulator
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              FlowPulse simulates policy-approved operational actions before real-world execution. Compare multi-attribute trade-offs, review AI recommendation rationale, and authorize the optimal response.
            </p>
          </div>

          {isApproved && (
            <div className="rounded-2xl border border-success/40 bg-success-muted/30 px-5 py-3.5 text-right shadow-2xs">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
                <CheckCircle2 className="size-4" /> PLAN APPROVED & EXECUTING
              </span>
              <p className="mt-1 text-xs font-semibold text-foreground">
                Authorized by Operations Manager (Flow Admin)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Current Operational Constraint Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-critical/30 bg-critical-muted/20 p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-critical text-white font-bold">
            <FlaskConical className="size-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Active Bottleneck Diagnosis</span>
            <p className="text-xs font-bold text-foreground">
              Analyzer #2 Offline · Current Lab Queue: <strong className="text-critical">43 min wait</strong> (21 waiting)
            </p>
          </div>
        </div>

        <span className="rounded-full bg-critical/15 px-3 py-1 text-xs font-bold text-critical">
          CURRENT LAB WAIT: 43 min
        </span>
      </div>

      {/* 4 Intervention Comparison Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {interventions.map((opt) => {
          const isSelected = selectedOptionId === opt.id
          const isThisApproved = state.approvedIntervention === opt.id

          const labWaitMap: Record<string, number> = {
            'option-a': 47,
            'option-b': 27,
            'option-c': 20,
            'option-d': 17,
          }
          const projectedLabWait = labWaitMap[opt.id] ?? 20

          return (
            <div
              key={opt.id}
              onClick={() => !isApproved && setSelectedOptionId(opt.id)}
              className={cn(
                'relative flex flex-col justify-between rounded-3xl border p-5 transition-all shadow-xs cursor-pointer',
                opt.recommended
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02]'
                  : 'border-border bg-card hover:border-border/80',
                isSelected && 'ring-2 ring-primary',
                isThisApproved && 'border-success ring-2 ring-success/30 bg-success-muted/10',
              )}
            >
              {opt.recommended && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-xs">
                  ★ FLOWPULSE RECOMMENDED
                </span>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">{opt.label}</h3>
                  {opt.confidence && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {opt.confidence}% conf.
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {opt.description}
                </p>

                {/* Metrics Breakdown */}
                <div className="mt-4 space-y-2 border-t border-border/60 pt-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                      <FlaskConical className="size-3 text-primary" /> Lab Wait:
                    </span>
                    <span
                      className={cn(
                        'font-bold',
                        projectedLabWait > 35
                          ? 'text-critical'
                          : projectedLabWait > 25
                            ? 'text-warning'
                            : 'text-success',
                      )}
                    >
                      {projectedLabWait} min
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" /> ED Future Wait:
                    </span>
                    <span
                      className={cn(
                        'font-bold',
                        opt.edWaitMinutes > 35
                          ? 'text-critical'
                          : opt.edWaitMinutes > 25
                            ? 'text-warning'
                            : 'text-success',
                      )}
                    >
                      {opt.edWaitMinutes} min
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <BedDouble className="size-3" /> Inpatient Beds:
                    </span>
                    <span
                      className={cn(
                        'font-bold',
                        opt.bedsDelta > 0 ? 'text-success' : 'text-critical',
                      )}
                    >
                      {opt.bedsDeltaLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="size-3" /> Staff Disruption:
                    </span>
                    <span className="font-semibold text-foreground">
                      {opt.staffImpact}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="size-3" /> Operational Cost:
                    </span>
                    <span className="font-semibold text-foreground">
                      {opt.operationalCost}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Timer className="size-3" /> Execution Time:
                    </span>
                    <span className="font-semibold text-foreground">
                      {opt.id === 'option-c' ? '8 min' : opt.id === 'option-b' ? '12 min' : opt.id === 'option-d' ? '18 min' : '0 min'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="mt-5 pt-3 border-t border-border/60">
                {isThisApproved ? (
                  <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-success/20 py-2 text-xs font-bold text-success">
                    <Check className="size-3.5" /> Approved & Executing
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedOptionId(opt.id)
                    }}
                    className={cn(
                      'w-full rounded-xl py-2 text-xs font-bold transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground hover:bg-muted/80',
                    )}
                  >
                    {isSelected ? 'Selected for Review' : 'Select Option'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Section: Option C Justification + Recharts Comparison */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left: Option C Recommendation Deep-Dive */}
        <div className="rounded-3xl border border-primary/30 bg-primary/[0.03] p-6 shadow-xs sm:p-7">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="size-3.5" /> FLOWPULSE RECOMMENDED ACTION
            </span>
            <span className="text-xs font-bold text-foreground">
              Confidence Score: 88%
            </span>
          </div>

          <h2 className="mt-4 text-xl font-bold text-foreground">
            Why Option C: Activate Backup Analyzer (LAB-AN-03)?
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Optimal balance between rapid hospital flow normalization, low clinical disruption, and minimal operational overhead.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                Wait Reduction
              </span>
              <p className="mt-1 text-lg font-bold text-success">-42% ED Wait</p>
              <span className="text-[10px] text-muted-foreground">43m → 25m</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                Beds Recovered
              </span>
              <p className="mt-1 text-lg font-bold text-success">+6 Beds</p>
              <span className="text-[10px] text-muted-foreground">Turnover freed</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                Staff Friction
              </span>
              <p className="mt-1 text-lg font-bold text-foreground">Low</p>
              <span className="text-[10px] text-muted-foreground">0 staff moves</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                Warm Standby
              </span>
              <p className="mt-1 text-lg font-bold text-primary">8 min</p>
              <span className="text-[10px] text-muted-foreground">Calibrated 08:00</span>
            </div>
          </div>

          {/* Safety Constraints & Reasoning */}
          <div className="mt-5 space-y-2 rounded-2xl border border-border bg-card p-4 text-xs shadow-2xs">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-success" /> Policy & Operational Constraint Verification:
            </p>
            <ul className="space-y-1.5 text-muted-foreground text-[11px]">
              <li className="flex items-center gap-2">
                <Check className="size-3 text-success shrink-0" />
                <span><strong>Zero Clinical Interference:</strong> Operates strictly at diagnostic device routing level without overriding physician diagnoses or triage priority.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3 text-success shrink-0" />
                <span><strong>Cost Efficiency:</strong> 45% lower expenditure than Option D while recovering 86% of peak throughput.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3 text-success shrink-0" />
                <span><strong>Required Authorization:</strong> Operations Manager / Flow Administrator sign-off required prior to hardware initialization.</span>
              </li>
            </ul>
          </div>

          {/* Human Approval Action Bar */}
          <div className="mt-6 border-t border-border/80 pt-5">
            {!isApproved ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => approveIntervention(selectedOptionId)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5 hover:bg-primary-hover"
                >
                  <CheckCircle2 className="size-4" /> APPROVE PLAN ({selectedOptionId.toUpperCase()})
                </button>
                <button
                  type="button"
                  onClick={() => rejectIntervention()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-4 py-3.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" /> Reject
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-success-muted/30 p-4 text-xs text-success">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="size-4" /> Plan Approved by Operations Manager
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Phase 6 Live Recovery Active
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/staff"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary-hover"
                  >
                    Return to Command Center <ArrowRight className="size-3.5" />
                  </Link>
                  <Link
                    href="/track-visit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    View Patient Side Sync →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recharts Counterfactual Comparison Chart */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-7">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Activity className="size-4 text-primary" /> Multi-Attribute Policy Benchmark
            </h3>
            <span className="text-[10px] text-muted-foreground">Recharts simulation</span>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={COMPARISON_CHART_DATA}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="edWait" name="ED Wait (min)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bedsRecovered" name="Beds Recovered" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costScore" name="Cost Index" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recovery Progress Bar if Approved */}
          {isApproved && (
            <div className="mt-4 rounded-2xl border border-success/30 bg-success-muted/20 p-4 text-xs">
              <div className="flex items-center justify-between font-bold text-foreground">
                <span>Recovery Dynamics in Progress:</span>
                <span className="text-success">92% → 68% Lab Load</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-4/5 animate-pulse rounded-full bg-success transition-all duration-1000" />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Specimen routing active on Analyzer #3. Emergency queue stabilizing at 25 min.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
