'use client'

import React from 'react'
import { Clock, Eye, Sparkles } from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import type { TimeHorizon } from '@/lib/data/types'
import { cn } from '@/lib/utils'

const HORIZONS: { id: TimeHorizon; label: string; sub: string }[] = [
  { id: 'now', label: 'NOW', sub: 'Live state' },
  { id: '30m', label: '+30m', sub: 'Review risk' },
  { id: '60m', label: '+60m', sub: 'Discharge hold' },
  { id: '120m', label: '+120m', sub: 'ED congestion' },
]

export function HorizonSelector() {
  const { state, setTimeHorizon } = useFlowPulse()

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-2.5 shadow-xs">
      <div className="flex items-center gap-2 pl-2 text-xs font-semibold text-foreground">
        <Clock className="size-4 text-primary" />
        <span>Predictive Time Horizon:</span>
        <span className="hidden text-[11px] font-normal text-muted-foreground sm:inline">
          {state.timeHorizon === 'now'
            ? 'Viewing current real-time telemetry'
            : `Simulating hospital flow state at +${state.timeHorizon.replace('m', '')} minutes forward`}
        </span>
      </div>

      <div className="flex items-center gap-1.5 rounded-xl bg-muted/60 p-1">
        {HORIZONS.map((h) => {
          const isActive = state.timeHorizon === h.id
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => setTimeHorizon(h.id)}
              className={cn(
                'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                isActive
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
              )}
            >
              {isActive && h.id !== 'now' && (
                <Sparkles className="size-3 text-primary animate-pulse" />
              )}
              <span>{h.label}</span>
              {isActive && (
                <span className="hidden rounded-sm bg-primary/10 px-1 py-0.2 text-[9px] font-semibold text-primary md:inline">
                  {h.sub}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
