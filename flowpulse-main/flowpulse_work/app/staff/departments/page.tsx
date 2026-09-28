'use client'

import React, { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  HardDrive,
  Users,
} from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { DemoController } from '@/components/staff/demo-controller'
import { DepartmentDrawer } from '@/components/staff/department-drawer'
import type { DepartmentId } from '@/lib/data/types'
import { cn } from '@/lib/utils'

export default function DepartmentsPage() {
  const { state } = useFlowPulse()
  const [selectedDeptId, setSelectedDeptId] = useState<DepartmentId | null>(null)

  const departments = state.departments

  return (
    <div className="space-y-6 pb-12">
      {/* Demo Controls */}
      <DemoController />

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Building2 className="size-3" /> Unit Performance
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Department Operations & Unit Load
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor real-time occupancy, 30-minute predictive demand forecasts, and unit-level diagnostic equipment status.
          </p>
        </div>
      </div>

      {/* 10 Department Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {departments.map((dept) => {
          const isCritical = dept.status === 'critical'
          const isWarning = dept.status === 'warning'
          const isLab = dept.id === 'laboratory'
          const isLabFailure =
            isLab &&
            state.activeScenario === 'lab-analyzer-failure' &&
            state.scenarioPhase >= 1

          const predictedLoad =
            isLab && state.activeScenario === 'lab-analyzer-failure'
              ? 97
              : Math.min(100, dept.utilization + 6)

          return (
            <div
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className={cn(
                'group flex cursor-pointer flex-col justify-between rounded-3xl border p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                isCritical
                  ? 'border-critical/60 bg-critical-muted/20 hover:border-critical'
                  : isWarning
                    ? 'border-warning/60 bg-warning-muted/20 hover:border-warning'
                    : 'border-border bg-card hover:border-border/80',
              )}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {dept.code}
                    </span>
                    <h3 className="text-sm font-bold text-foreground">{dept.name}</h3>
                  </div>

                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                      isCritical
                        ? 'bg-critical text-critical-foreground'
                        : isWarning
                          ? 'bg-warning text-warning-foreground'
                          : 'bg-success-muted text-success',
                    )}
                  >
                    {dept.status}
                  </span>
                </div>

                {/* Utilization Metric */}
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-foreground">
                    {dept.utilization}%
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Pred +30m: <strong className="text-foreground">{predictedLoad}%</strong>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isCritical
                        ? 'bg-critical'
                        : isWarning
                          ? 'bg-warning'
                          : 'bg-primary',
                    )}
                    style={{ width: `${dept.utilization}%` }}
                  />
                </div>

                {/* Stats Breakdown */}
                <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Active Census:</span>
                    <span className="font-semibold text-foreground">
                      {dept.currentOccupancy} / {dept.capacity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Staff on Duty:</span>
                    <span className="font-semibold text-foreground">
                      {dept.staffOnDuty}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average Wait:</span>
                    <span className="font-semibold text-foreground">
                      {dept.avgWaitMinutes > 0 ? `${dept.avgWaitMinutes} min` : 'Inpatient'}
                    </span>
                  </div>
                </div>

                {/* Lab failure specific tag */}
                {isLabFailure && (
                  <div className="mt-3 rounded-xl border border-critical/30 bg-critical-muted/40 p-2 text-[11px] font-bold text-critical">
                    Analyzer #2 OFFLINE
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-2 border-t border-border/40">
                <span className="flex items-center justify-between text-xs font-bold text-primary group-hover:underline">
                  Inspect Unit <ArrowRight className="size-3" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Slide-over Department Drawer */}
      <DepartmentDrawer
        departmentId={selectedDeptId}
        onClose={() => setSelectedDeptId(null)}
      />
    </div>
  )
}
