'use client'

import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BedDouble,
  Building2,
  CheckCircle2,
  Clock,
  DoorOpen,
  FlaskConical,
  HeartPulse,
  Pill,
  Radio,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlowStageId, StatusTone } from '@/lib/data/types'

export interface FlowNodeData {
  id: FlowStageId
  label: string
  code: string
  count: number
  capacity?: number
  utilization?: number
  avgWaitMinutes?: number
  status: StatusTone
  trend?: 'up' | 'stable' | 'down'
  futureRisk?: string
  futureRiskTone?: 'purple' | 'amber'
  onClick?: (id: FlowStageId) => void
}

const STAGE_ICONS: Record<FlowStageId, React.ElementType> = {
  registration: Users,
  emergency: HeartPulse,
  opd: Stethoscope,
  consultation: Activity,
  laboratory: FlaskConical,
  radiology: Radio,
  review: Building2,
  ward: BedDouble,
  icu: AlertTriangle,
  pharmacy: Pill,
  discharge: DoorOpen,
}

function FlowNodeComponent({ data, selected }: NodeProps<FlowNodeData>) {
  const Icon = STAGE_ICONS[data.id] || Activity

  const isCritical = data.status === 'critical'
  const isWarning = data.status === 'warning'
  const isHealthy = data.status === 'healthy'

  return (
    <div
      onClick={() => data.onClick?.(data.id)}
      className={cn(
        'group relative w-[260px] cursor-pointer rounded-2xl border bg-card p-4 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl',
        selected
          ? 'border-primary ring-4 ring-primary/25 shadow-lg'
          : isCritical
            ? 'border-critical bg-critical-muted/30 shadow-critical/10 ring-2 ring-critical/40 hover:border-critical'
            : isWarning
              ? 'border-warning bg-warning-muted/25 shadow-warning/10 ring-2 ring-warning/30 hover:border-warning'
              : 'border-slate-200/90 hover:border-primary/60 dark:border-border',
      )}
    >
      {/* React Flow Left Handle (Target) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!size-3.5 !border-2 !border-background !bg-slate-400 transition-colors group-hover:!bg-primary"
      />
      {/* React Flow Right Handle (Source) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!size-3.5 !border-2 !border-background !bg-slate-400 transition-colors group-hover:!bg-primary"
      />

      {/* Top row: Stage icon, label & high-contrast status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs',
              isCritical
                ? 'bg-critical text-critical-foreground'
                : isWarning
                  ? 'bg-warning text-warning-foreground'
                  : 'bg-primary text-primary-foreground',
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              {data.code}
            </span>
            <p className="truncate text-sm font-bold text-slate-900 leading-tight">
              {data.label}
            </p>
          </div>
        </div>

        {/* High-visibility Status Badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider',
            isCritical
              ? 'bg-critical text-white shadow-xs'
              : isWarning
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-emerald-600 text-white shadow-xs',
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full bg-white',
              isCritical && 'animate-ping',
            )}
          />
          {isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'HEALTHY'}
        </span>
      </div>

      {/* Middle row: Patient Census & Capacity Utilization */}
      <div className="mt-3.5 flex items-end justify-between">
        <div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            {data.count}
          </span>
          <span className="ml-1.5 text-xs font-semibold text-slate-500">patients</span>
        </div>

        {data.utilization !== undefined && (
          <div className="text-right">
            <span
              className={cn(
                'text-sm font-extrabold',
                isCritical
                  ? 'text-critical'
                  : isWarning
                    ? 'text-amber-600'
                    : 'text-slate-800',
              )}
            >
              {data.utilization}%
            </span>
            <span className="block text-[10px] font-semibold text-slate-500 uppercase">load</span>
          </div>
        )}
      </div>

      {/* High-contrast Progress Load Bar */}
      {data.utilization !== undefined && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isCritical
                ? 'bg-critical'
                : isWarning
                  ? 'bg-amber-500'
                  : 'bg-primary',
            )}
            style={{ width: `${Math.min(100, data.utilization)}%` }}
          />
        </div>
      )}

      {/* Future Prediction Alert (Lab Ripple scenario) */}
      {data.futureRisk && (
        <div className="mt-2.5 flex items-center justify-between rounded-xl border border-purple-300 bg-purple-100/90 px-2.5 py-1.5 text-[11px] text-purple-950 font-bold shadow-xs">
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-purple-700 shrink-0" />
            <span>+120M PREDICTED:</span>
          </span>
          <span className="text-purple-900 font-extrabold">{data.futureRisk}</span>
        </div>
      )}

      {/* Footer info: wait time & flow indicator */}
      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-600 font-semibold">
        <span className="flex items-center gap-1">
          <Clock className="size-3.5 text-slate-400" />
          {data.avgWaitMinutes !== undefined && data.avgWaitMinutes > 0
            ? `${data.avgWaitMinutes}m wait`
            : 'Inpatient care'}
        </span>

        {isCritical ? (
          <span className="flex items-center gap-0.5 font-bold text-critical">
            <ArrowUpRight className="size-3.5" /> Bottleneck
          </span>
        ) : isWarning ? (
          <span className="flex items-center gap-0.5 font-bold text-amber-600">
            <ArrowUpRight className="size-3.5" /> Elevated
          </span>
        ) : (
          <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
            <CheckCircle2 className="size-3.5" /> Nominal
          </span>
        )}
      </div>
    </div>
  )
}

export const FlowNodeMemo = memo(FlowNodeComponent)
