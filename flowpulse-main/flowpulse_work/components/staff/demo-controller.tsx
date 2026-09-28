'use client'

import React from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
} from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import type { ScenarioId } from '@/lib/data/types'
import { cn } from '@/lib/utils'

const SCENARIOS: { id: ScenarioId; label: string }[] = [
  { id: 'normal', label: 'Normal Operations' },
  { id: 'lab-analyzer-failure', label: 'Lab Analyzer Failure (Demo Hero)' },
  { id: 'patient-surge', label: 'Patient Surge' },
  { id: 'doctor-shortage', label: 'Doctor Shortage' },
  { id: 'ct-machine-failure', label: 'CT Machine Failure' },
  { id: 'bed-shortage', label: 'Bed Shortage' },
]

const JUDGE_STEPS = [
  { step: 1, title: 'Normal Baseline', desc: 'Hospital operating at nominal capacity.' },
  { step: 2, title: 'Analyzer #2 Offline', desc: 'Hardware failure alert triggered.' },
  { step: 3, title: 'Lab Bottleneck', desc: 'Specimen backlog builds; util reaches 92%.' },
  { step: 4, title: 'Ripple Predicted', desc: 'Emergency wait projected to reach 43m at +120m.' },
  { step: 5, title: 'Open Ripple Analysis', desc: 'Inspect cascade dependency graph.' },
  { step: 6, title: 'Cascade Tracing', desc: 'Review root-cause contribution (31% Lab).' },
  { step: 7, title: 'Simulate Solutions', desc: 'Counterfactual simulator evaluates options.' },
  { step: 8, title: 'Option C Recommended', desc: 'Backup analyzer chosen with 88% confidence.' },
  { step: 9, title: 'Human Approval', desc: 'Admin authorizes Option C plan.' },
  { step: 10, title: 'Plan Executed', desc: 'Backup analyzer LAB-AN-03 spun up.' },
  { step: 11, title: 'Recovery Underway', desc: 'Lab load falls 92% → 68%, ED wait drops to 25m.' },
  { step: 12, title: 'Patient Synced', desc: 'Patient Arjun completion time recovers to 12:12 PM.' },
  { step: 13, title: 'Bed Recovery', desc: '6 beds recovered from discharge turnover.' },
  { step: 14, title: 'Demo Complete', desc: 'Ripple successfully prevented.' },
]

export function DemoController() {
  const {
    state,
    setScenario,
    startJudgeDemo,
    advanceJudgeDemo,
    setJudgeDemoStep,
    resetJudgeDemo,
    resetScenario,
  } = useFlowPulse()

  const currentJudgeStep = JUDGE_STEPS.find((s) => s.step === state.judgeDemoStep) || JUDGE_STEPS[0]

  return (
    <div className="space-y-3">
      {/* Top Demo Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-xs">
        {/* Left: Scenario Switcher */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <FlaskConical className="size-4 text-primary" /> Scenario:
          </span>
          <select
            value={state.activeScenario}
            onChange={(e) => setScenario(e.target.value as ScenarioId)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Quick Action Controls & Judge Demo Trigger */}
        <div className="flex items-center gap-2">
          {!state.judgeDemoActive ? (
            <button
              type="button"
              onClick={startJudgeDemo}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
            >
              <Sparkles className="size-3.5 animate-pulse" /> Run Judge Demo
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={advanceJudgeDemo}
                className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
              >
                Next Step ({state.judgeDemoStep}/14) <ChevronRight className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={resetJudgeDemo}
                className="inline-flex items-center gap-1 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="size-3" /> Reset
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={resetScenario}
            title="Reset Hospital State"
            className="flex size-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Guided Judge Demo Stepper Banner (When Judge Demo Active) */}
      {state.judgeDemoActive && (
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {state.judgeDemoStep}
              </span>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Judge Demo Flow: {currentJudgeStep.title}
                </p>
                <span className="text-[11px] text-muted-foreground">
                  {currentJudgeStep.desc}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1 sm:flex">
                {JUDGE_STEPS.slice(0, 14).map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setJudgeDemoStep(s.step)}
                    className={cn(
                      'size-2 rounded-full transition-all',
                      s.step === state.judgeDemoStep
                        ? 'scale-125 bg-primary'
                        : s.step < state.judgeDemoStep
                          ? 'bg-primary/50'
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground',
                    )}
                    title={`Step ${s.step}: ${s.title}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
