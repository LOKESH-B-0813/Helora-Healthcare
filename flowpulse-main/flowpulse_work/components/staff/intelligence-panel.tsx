'use client'

import React from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Radio,
  Server,
  Sparkles,
  TrendingUp,
  UserCheck,
  Waves,
  Zap,
} from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { cn } from '@/lib/utils'

export function IntelligencePanel() {
  const { state } = useFlowPulse()

  const isLabFailure =
    state.activeScenario === 'lab-analyzer-failure' && state.scenarioPhase >= 2
  const isRecovered =
    state.activeScenario === 'lab-analyzer-failure' && state.scenarioPhase >= 6

  if (isRecovered) {
    return (
      <div className="flex flex-col justify-between rounded-3xl border border-success/40 bg-success-muted/25 p-6 shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/20 px-3 py-1 text-xs font-bold text-success">
              <CheckCircle2 className="size-3.5" /> RECOVERY UNDERWAY
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Option C Active
            </span>
          </div>

          <h3 className="mt-4 text-base font-bold text-foreground">
            Interventions Successfully Dampening Ripple
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Backup Analyzer <strong>LAB-AN-03</strong> active. Laboratory utilization normalized to 68%. Emergency wait stabilized at 25 min.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Lab Load
              </span>
              <p className="mt-1 text-lg font-bold text-success">68%</p>
              <span className="text-[10px] text-muted-foreground">Down from 92%</span>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Beds Recovered
              </span>
              <p className="mt-1 text-lg font-bold text-success">+6 Beds</p>
              <span className="text-[10px] text-muted-foreground">Turnover restored</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/80">
          <Link
            href="/staff/scenario-simulator"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover"
          >
            View Recovery Telemetry <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    )
  }

  if (isLabFailure) {
    return (
      <div className="flex flex-col justify-between rounded-3xl border border-critical/40 bg-critical-muted/20 p-6 shadow-xs">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-critical/20 px-3 py-1 text-xs font-bold text-critical">
              <AlertTriangle className="size-3.5 animate-pulse" /> CRITICAL BOTTLENECK PREDICTED
            </span>
            <span className="text-[11px] font-bold text-muted-foreground">
              Confidence: 89%
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-bold text-foreground">Diagnostic Laboratory</h3>
              <span className="text-xs font-bold text-critical">
                Predicted: +24 min
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Analyzer #2 (LAB-AN-02) offline. Specimen testing velocity reduced by 50%.
            </p>
          </div>

          {/* Detailed Hardware & Root Cause Box */}
          <div className="mt-4 rounded-2xl border border-critical/30 bg-card/90 p-3.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <Zap className="size-3.5 text-critical" /> Hardware Telemetry:
              </p>
              <span className="font-mono text-[10px] text-muted-foreground">11:32:01 UTC</span>
            </div>

            <ul className="mt-2.5 space-y-1.5 text-muted-foreground text-[11px]">
              <li className="flex items-center justify-between">
                <span>• Asset ID:</span>
                <span className="font-mono font-bold text-critical">LAB-AN-02 (OFFLINE)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>• Assigned Technician:</span>
                <span className="font-semibold text-foreground">R. Menon (T-101)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>• Inflow Demand:</span>
                <span className="font-semibold text-warning">+21% Specimen Influx</span>
              </li>
              <li className="flex items-center justify-between">
                <span>• Current Lab Load:</span>
                <span className="font-bold text-critical">92% (Critical SLA Breach)</span>
              </li>
            </ul>
          </div>

          {/* Expected Ripple Summary */}
          <div className="mt-4 space-y-2 text-xs">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <Waves className="size-3 text-primary" /> Downstream Propagation:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl border border-border bg-card p-2.5 shadow-2xs">
                <span className="text-muted-foreground text-[10px]">+30m Review Hold</span>
                <p className="font-bold text-warning">+14 Doctor Reviews</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-2.5 shadow-2xs">
                <span className="text-muted-foreground text-[10px]">+60m Discharge Delay</span>
                <p className="font-bold text-warning">+9 Stalled Discharges</p>
              </div>
            </div>

            {/* Emergency Prediction Callout */}
            <div className="rounded-2xl border border-warning/40 bg-warning-muted/40 p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Emergency Waiting Time:</span>
                <span className="rounded-md bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-warning-dark">
                  FUTURE RISK
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between text-xs">
                <div>
                  <span className="text-muted-foreground text-[10px]">CURRENT WAIT</span>
                  <p className="text-sm font-semibold text-foreground">18 min</p>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground text-[10px]">PROJECTED (+120m)</span>
                  <p className="text-lg font-extrabold text-critical">43 min</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-6 pt-4 border-t border-border/80">
          <Link
            href="/staff/ripple-analysis"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-critical px-4 py-2.5 text-xs font-bold text-critical-foreground shadow-xs transition-colors hover:bg-critical-dark"
          >
            Open Ripple Analysis <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    )
  }

  // NORMAL STATE
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-xs">
      <div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-muted px-3 py-1 text-xs font-bold text-success">
            <CheckCircle2 className="size-3.5" /> STABLE FLOW
          </span>
          <span className="text-xs font-bold text-muted-foreground">
            Health: {state.hospitalHealthScore}%
          </span>
        </div>

        <h3 className="mt-4 text-base font-bold text-foreground">
          Hospital Flow is Stable
        </h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Real-time telemetry reports nominal transit across all 11 care stages.
        </p>

        {/* Shift Lead & Telemetry */}
        <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-3.5 text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <UserCheck className="size-3 text-primary" /> Shift Lead:
            </span>
            <strong className="text-foreground">Dr. Vikram Shah</strong>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <Radio className="size-3 text-emerald-500" /> Active Feeds:
            </span>
            <span className="font-semibold text-emerald-600">6 / 6 Connectors Online</span>
          </div>
        </div>

        {/* Emerging Capacity Risk */}
        <div className="mt-3 rounded-2xl border border-border bg-muted/20 p-3.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Sparkles className="size-3.5 text-primary" /> Emerging Capacity Watch:
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Laboratory:</strong> Specimen influx trending up. Projected load reaching <span className="font-semibold text-warning">81% in 30 min</span>.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl border border-border bg-muted/20 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
              Available Beds
            </span>
            <p className="mt-1 text-lg font-bold text-foreground">
              {state.kpis.availableBeds} / 120
            </p>
            <span className="text-[10px] text-success font-medium">Healthy reserve</span>
          </div>
          <div className="rounded-2xl border border-border bg-muted/20 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
              ED Wait Time
            </span>
            <p className="mt-1 text-lg font-bold text-foreground">18 min</p>
            <span className="text-[10px] text-success font-medium">Within target SLA</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <Link
          href="/staff/ripple-analysis"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground shadow-xs transition-colors hover:bg-muted"
        >
          View Predictive Ripple Map <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}
