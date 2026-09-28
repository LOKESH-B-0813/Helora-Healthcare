'use client'

import React, { useState } from 'react'
import {
  Bell,
  CheckCircle2,
  Lock,
  Save,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
} from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { DemoController } from '@/components/staff/demo-controller'

export default function SettingsPage() {
  const [savedToast, setSavedToast] = useState(false)
  const [edThreshold, setEdThreshold] = useState(30)
  const [labThreshold, setLabThreshold] = useState(85)
  const [safetyBuffer, setSafetyBuffer] = useState(5)
  const [autoRippleAlert, setAutoRippleAlert] = useState(true)

  const handleSave = () => {
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 3000)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Demo Controls */}
      <DemoController />

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Settings className="size-3" /> System Configuration
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Platform Settings & Threshold Policy
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure automated ripple sensitivity, SLA breach alerts, predictive horizon horizons, and human-in-the-loop policies.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
        >
          <Save className="size-4" /> Save Preferences
        </button>
      </div>

      {savedToast && (
        <div className="rounded-2xl border border-success/40 bg-success-muted/30 p-4 text-xs font-bold text-success flex items-center gap-2">
          <CheckCircle2 className="size-4" /> Settings updated successfully. Real-time thresholds recalibrated.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Predictive & Alert Thresholds */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-7 space-y-5">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sliders className="size-4 text-primary" /> Operational Alert Thresholds
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground">
                  Emergency Wait Time Escalation Alert:
                </label>
                <span className="font-bold text-primary">{edThreshold} min</span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                value={edThreshold}
                onChange={(e) => setEdThreshold(Number(e.target.value))}
                className="mt-2 w-full accent-primary"
              />
              <span className="text-[11px] text-muted-foreground">
                Triggers ripple warning when projected ED wait breaches threshold.
              </span>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground">
                  Laboratory Utilization Critical Alert:
                </label>
                <span className="font-bold text-primary">{labThreshold}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="98"
                value={labThreshold}
                onChange={(e) => setLabThreshold(Number(e.target.value))}
                className="mt-2 w-full accent-primary"
              />
              <span className="text-[11px] text-muted-foreground">
                Flags bottleneck when diagnostic testing load reaches threshold.
              </span>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground">
                  Adaptive Arrival Window Safety Buffer:
                </label>
                <span className="font-bold text-primary">{safetyBuffer} min</span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                value={safetyBuffer}
                onChange={(e) => setSafetyBuffer(Number(e.target.value))}
                className="mt-2 w-full accent-primary"
              />
              <span className="text-[11px] text-muted-foreground">
                Buffer applied to patient-facing smart arrival window calculations.
              </span>
            </div>
          </div>
        </div>

        {/* Safety & Human Approval Policy */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-7 space-y-5">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="size-4 text-success" /> Governance & Approval Policies
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">
                  Mandatory Human-in-the-Loop Approval
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  No automated operational intervention executes without authorized Flow Administrator sign-off.
                </p>
              </div>
              <span className="rounded-md bg-success-muted px-2.5 py-1 text-[10px] font-bold text-success">
                LOCKED ACTIVE
              </span>
            </div>

            <div className="border-t border-border pt-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">
                  Clinical Non-Interference Guardrails
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  System strictly excludes clinical diagnoses, medical triage priority overrides, or prescription modifications.
                </p>
              </div>
              <span className="rounded-md bg-success-muted px-2.5 py-1 text-[10px] font-bold text-success">
                ENFORCED
              </span>
            </div>

            <div className="border-t border-border pt-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">
                  Automated Ripple Propagation Alerts
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Broadcast early warnings to downstream department charge nurses when upstream disruptions occur.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoRippleAlert}
                onChange={(e) => setAutoRippleAlert(e.target.checked)}
                className="size-4 rounded accent-primary mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
