'use client'

import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { DemoController } from '@/components/staff/demo-controller'
import type { BedStatus } from '@/lib/data/types'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<
  BedStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  occupied: {
    label: 'Occupied',
    bg: 'bg-primary/10 border-primary/20',
    text: 'text-primary',
    dot: 'bg-primary',
  },
  available: {
    label: 'Available',
    bg: 'bg-success-muted border-success/30',
    text: 'text-success',
    dot: 'bg-success',
  },
  reserved: {
    label: 'Reserved',
    bg: 'bg-warning-muted border-warning/30',
    text: 'text-warning-dark',
    dot: 'bg-warning',
  },
  dirty: {
    label: 'Dirty / Pending',
    bg: 'bg-critical-muted border-critical/30',
    text: 'text-critical',
    dot: 'bg-critical',
  },
  cleaning: {
    label: 'Cleaning Active',
    bg: 'bg-purple-100 border-purple-200',
    text: 'text-purple-700',
    dot: 'bg-purple-600',
  },
  blocked: {
    label: 'Blocked / Hold',
    bg: 'bg-muted border-border',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
}

const LIFECYCLE_STEPS = [
  'OCCUPIED',
  'DISCHARGE ORDER',
  'DIRTY',
  'CLEANING',
  'READY',
  'RESERVED',
  'OCCUPIED',
]

export default function BedsCapacityPage() {
  const { state } = useFlowPulse()
  const [selectedWard, setSelectedWard] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<BedStatus | 'all'>('all')

  const beds = state.beds

  // Bed counts
  const summary = useMemo(() => {
    return {
      total: 120,
      occupied: 92,
      available: state.kpis.availableBeds,
      reserved: 4,
      dirty: 3,
      cleaning: 2,
      blocked: 1,
    }
  }, [state.kpis.availableBeds])

  const wards = ['Emergency', 'ICU', 'Ward A', 'Ward B']

  const filteredBeds = useMemo(() => {
    return beds.filter((b) => {
      if (selectedWard !== 'all' && b.ward !== selectedWard) return false
      if (selectedStatus !== 'all' && b.status !== selectedStatus) return false
      return true
    })
  }, [beds, selectedWard, selectedStatus])

  const isLabFailure =
    state.activeScenario === 'lab-analyzer-failure' && state.scenarioPhase >= 3

  return (
    <div className="space-y-6 pb-12">
      {/* Demo Controller */}
      <DemoController />

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <BedDouble className="size-3" /> Inpatient Census
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Beds, Capacity & Turnover Velocity
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Real-time census tracking across 120 modeled inpatient beds, turnover bottlenecks, and predictive boarding buffers.
          </p>
        </div>
      </div>

      {/* Top Status Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Total Beds</span>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{summary.total}</p>
          <span className="text-[10px] text-muted-foreground">4 wards modeled</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Occupied</span>
          <p className="mt-1 text-2xl font-extrabold text-primary">{summary.occupied}</p>
          <span className="text-[10px] text-muted-foreground">76% occupancy</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Available</span>
          <p className="mt-1 text-2xl font-extrabold text-success">{summary.available}</p>
          <span className="text-[10px] text-success font-medium">Ready for admit</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Reserved</span>
          <p className="mt-1 text-2xl font-extrabold text-warning-dark">{summary.reserved}</p>
          <span className="text-[10px] text-muted-foreground">Inbound transfer</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Dirty / Pending</span>
          <p className="mt-1 text-2xl font-extrabold text-critical">{summary.dirty}</p>
          <span className="text-[10px] text-muted-foreground">Awaiting EVS</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Cleaning Active</span>
          <p className="mt-1 text-2xl font-extrabold text-purple-600">{summary.cleaning}</p>
          <span className="text-[10px] text-muted-foreground">~25m turnaround</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Blocked / Hold</span>
          <p className="mt-1 text-2xl font-extrabold text-muted-foreground">{summary.blocked}</p>
          <span className="text-[10px] text-muted-foreground">Maintenance</span>
        </div>
      </div>

      {/* Bed Lifecycle Visualization */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-7">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <RefreshCw className="size-4 text-primary" /> Bed Turnover Lifecycle Pipeline
          </h2>
          <span className="text-[11px] font-bold text-muted-foreground">Target cycle: 35 min</span>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          {LIFECYCLE_STEPS.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/30 px-3.5 py-2.5 text-xs font-bold text-foreground">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-extrabold text-primary">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
              {idx < LIFECYCLE_STEPS.length - 1 && (
                <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* WHY ARE BEDS UNAVAILABLE? & CAPACITY INTELLIGENCE */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* WHY ARE BEDS UNAVAILABLE Breakdown */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-7">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Zap className="size-4 text-warning" /> Why Are Beds Unavailable? (Root Cause Factors)
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Decomposed capacity holding factors across all inpatient floors.
          </p>

          <div className="mt-5 space-y-3">
            {[
              { name: 'Delayed Discharge Orders', percentage: 42, color: '#ef4444' },
              { name: 'Cleaning & Sanitization Turnaround', percentage: 24, color: '#f59e0b' },
              { name: 'Reserved Inbound Transfers', percentage: 16, color: '#8b5cf6' },
              { name: 'Clinical Step-Down Occupancy', percentage: 12, color: '#3b82f6' },
              { name: 'Equipment / Floor Maintenance', percentage: 6, color: '#64748b' },
            ].map((item) => (
              <div key={item.name} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{item.name}</span>
                  <span className="font-bold text-foreground">{item.percentage}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
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
        </div>

        {/* FLOWPULSE CAPACITY INTELLIGENCE */}
        <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 shadow-xs sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
                <Sparkles className="size-3.5" /> FLOWPULSE CAPACITY INTELLIGENCE
              </span>
            </div>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Discharge Throughput Recovery Impact
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              "<strong>7 additional beds</strong> are predicted to become available within <strong>35 minutes</strong> if current diagnostic review and discharge throughput is restored."
            </p>

            {isLabFailure && (
              <div className="mt-4 rounded-2xl border border-warning/40 bg-warning-muted/40 p-3.5 text-xs text-foreground">
                <strong className="text-warning-dark">Active Ripple Disruption:</strong> Delayed laboratory results are stalling 9 inpatient discharges, temporarily holding 7 beds occupied past expected departure time.
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-primary/20">
            <span className="text-[11px] text-muted-foreground">
              Connected Telemetry: TeleTracking bed sensors · EHR ADT Stream
            </span>
          </div>
        </div>
      </div>

      {/* Ward Filters & 120-Bed Interactive Grid */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-7 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          {/* Ward Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedWard('all')}
              className={cn(
                'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors',
                selectedWard === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              All Wards (120)
            </button>
            {wards.map((ward) => (
              <button
                key={ward}
                type="button"
                onClick={() => setSelectedWard(ward)}
                className={cn(
                  'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors',
                  selectedWard === ward
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {ward}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground outline-none"
          >
            <option value="all">All Bed Statuses</option>
            <option value="occupied">Occupied</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="dirty">Dirty</option>
            <option value="cleaning">Cleaning</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {/* The 120-Bed Matrix */}
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12">
          {filteredBeds.map((bed) => {
            const config = STATUS_CONFIG[bed.status]

            return (
              <div
                key={bed.id}
                title={`Bed: ${bed.bedNumber} (${bed.ward})\nStatus: ${config.label}\nAssigned Patient: ${bed.assignedPatientId ?? 'None'}\nExpected Available: ${bed.expectedAvailableAt ?? 'N/A'}`}
                className={cn(
                  'group relative flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all duration-150 hover:scale-105 hover:shadow-md cursor-pointer',
                  config.bg,
                )}
              >
                <span className="text-[11px] font-bold text-foreground">
                  {bed.bedNumber}
                </span>
                <span className="mt-0.5 text-[9px] text-muted-foreground truncate w-full">
                  {bed.ward}
                </span>
                <span
                  className={cn(
                    'mt-2 size-2 rounded-full',
                    config.dot,
                  )}
                />
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span>Showing {filteredBeds.length} of {beds.length} beds</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-primary" /> Occupied
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-success" /> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-warning" /> Reserved
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-critical" /> Dirty
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
