'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Filter,
  GraduationCap,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { DemoController } from '@/components/staff/demo-controller'
import { IMAGES } from '@/lib/data/images'
import type { DepartmentId, StaffRole, StaffAvailability } from '@/lib/data/types'
import { cn } from '@/lib/utils'

export default function StaffOperationsPage() {
  const { state } = useFlowPulse()
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all')
  const [deptFilter, setDeptFilter] = useState<DepartmentId | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSimulatedReassigned, setIsSimulatedReassigned] = useState(false)

  const staff = state.staff

  // Counts
  const counts = useMemo(() => {
    return {
      total: staff.length,
      doctors: staff.filter((s) => s.role === 'doctor').length,
      nurses: staff.filter((s) => s.role === 'nurse').length,
      technicians: staff.filter((s) => s.role === 'technician').length,
      available: staff.filter((s) => s.availability === 'available').length,
    }
  }, [staff])

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      if (roleFilter !== 'all' && s.role !== roleFilter) return false
      if (deptFilter !== 'all' && s.department !== deptFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          s.name.toLowerCase().includes(q) ||
          s.qualification.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [staff, roleFilter, deptFilter, searchQuery])

  return (
    <div className="space-y-6 pb-12">
      {/* Demo Controls */}
      <DemoController />

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Users className="size-3" /> Operational Workforce
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Staff Operations & Workforce Allocation
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Monitor clinical and technical staff availability, ratios, workloads, and evaluate cross-unit task support simulations.
          </p>
        </div>
      </div>

      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Total Rostered</span>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{counts.total}</p>
          <span className="text-[10px] text-muted-foreground">Active shift staff</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Physicians / Doctors</span>
          <p className="mt-1 text-2xl font-extrabold text-primary">{counts.doctors}</p>
          <span className="text-[10px] text-muted-foreground">Across 7 departments</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Nursing Staff</span>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{counts.nurses}</p>
          <span className="text-[10px] text-muted-foreground">Ward & ICU ratios nominal</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Technicians</span>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{counts.technicians}</p>
          <span className="text-[10px] text-muted-foreground">Lab, Rad & Pharmacy</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground">Immediately Available</span>
          <p className="mt-1 text-2xl font-extrabold text-success">{counts.available}</p>
          <span className="text-[10px] text-success font-medium">Ready for assignment</span>
        </div>
      </div>

      {/* Qualified Operational Reassignment Simulation Card (Option B) */}
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/[0.04] to-card p-6 shadow-xs sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="size-3.5" /> QUALIFIED REASSIGNMENT SIMULATION (OPTION B)
            </span>
            <h2 className="mt-3 text-lg font-bold text-foreground">
              Cross-Department Diagnostic Support: Technician T07 (S. Verma)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
              Identified qualified support staff in lower-load units to assist in specimen processing without clinical disruption.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSimulatedReassigned((v) => !v)}
              className={cn(
                'inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all shadow-xs',
                isSimulatedReassigned
                  ? 'bg-success text-success-foreground'
                  : 'bg-primary text-primary-foreground hover:bg-primary-hover',
              )}
            >
              {isSimulatedReassigned ? 'Simulation Active' : 'Toggle Preview (T07)'}
            </button>
            <Link
              href="/staff/scenario-simulator"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted"
            >
              RUN SIMULATION <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Reassignment Telemetry Details */}
        <div className="mt-5 grid gap-4 rounded-2xl border border-border bg-card p-4 text-xs sm:grid-cols-4">
          <div>
            <span className="text-muted-foreground text-[10px] uppercase font-semibold">
              Candidate Staff
            </span>
            <p className="mt-1 font-bold text-foreground">
              Technician T07 (S. Verma)
            </p>
            <span className="text-[11px] text-muted-foreground">
              Current: <strong>Radiology</strong> · Load: <strong>52%</strong>
            </span>
          </div>

          <div>
            <span className="text-muted-foreground text-[10px] uppercase font-semibold">
              Lab Wait Impact
            </span>
            <p className="mt-1 text-base font-bold text-success">
              31 → 22 min (-29%)
            </p>
            <span className="text-[11px] text-muted-foreground">
              Specimen backlog cleared faster
            </span>
          </div>

          <div>
            <span className="text-muted-foreground text-[10px] uppercase font-semibold">
              Radiology Wait Impact
            </span>
            <p className="mt-1 text-base font-semibold text-foreground">
              18 → 21 min (+3m)
            </p>
            <span className="text-[11px] text-muted-foreground">
              Well within 30 min target SLA
            </span>
          </div>

          <div>
            <span className="text-muted-foreground text-[10px] uppercase font-semibold">
              Net Flow Impact
            </span>
            <p className="mt-1 text-base font-bold text-primary">
              +19% Throughput
            </p>
            <span className="text-[11px] text-success font-semibold">
              Net positive across hospital
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-4 text-primary shrink-0" />
          <span><strong>Decision Support Rule:</strong> FlowPulse provides operational analysis only. Staff members are never automatically reassigned by AI.</span>
        </div>
      </div>

      {/* Staff Directory Cards Grid */}
      <div className="rounded-3xl border border-border bg-card shadow-xs p-6 sm:p-7 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex flex-1 items-center gap-2 min-w-[200px]">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search staff name or qualification..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground outline-none"
            >
              <option value="all">All Roles</option>
              <option value="doctor">Doctors</option>
              <option value="nurse">Nurses</option>
              <option value="technician">Technicians</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value as any)}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground outline-none"
            >
              <option value="all">All Departments</option>
              {state.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Staff Grid with Avatars */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredStaff.slice(0, 16).map((member) => {
            const avatarUrl =
              member.imageUrl ||
              (member.role === 'doctor'
                ? IMAGES.doctors.drAnanyaRao
                : member.role === 'nurse'
                  ? IMAGES.avatars.p1
                  : IMAGES.avatars.p2)

            return (
              <div
                key={member.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-2xs transition-all hover:border-border/80"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarUrl}
                      alt={member.name}
                      className="size-11 rounded-xl object-cover ring-2 ring-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-bold text-foreground">
                        {member.name}
                      </h4>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {member.qualification}
                      </p>
                      <span className="font-mono text-[9px] text-slate-400">
                        {member.id} · Shift: 08:00–16:00
                      </span>
                    </div>
                  </div>

                  {/* Workload & Availability */}
                  <div className="mt-3.5 space-y-1.5 border-t border-border/60 pt-2.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Unit:</span>
                      <strong className="capitalize text-foreground">
                        {member.department.replace('-', ' ')}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Workload:</span>
                      <span className="font-bold text-foreground">{member.workload}%</span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          member.workload > 85
                            ? 'bg-critical'
                            : member.workload > 60
                              ? 'bg-warning'
                              : 'bg-primary',
                        )}
                        style={{ width: `${member.workload}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-border/40 pt-2 text-[10px]">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 font-bold capitalize',
                      member.availability === 'available'
                        ? 'bg-success-muted text-success'
                        : member.availability === 'busy'
                          ? 'bg-warning-muted text-warning-dark'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {member.availability}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {member.skills[0]?.replace('-', ' ') ?? 'General'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t border-border bg-muted/10 px-4 py-3 text-xs text-muted-foreground flex items-center justify-between rounded-xl">
          <span>Showing {Math.min(16, filteredStaff.length)} of {filteredStaff.length} rostered staff</span>
          <span>Shift cycle: 08:00 – 16:00 · Next shift handover: 14:00</span>
        </div>
      </div>
    </div>
  )
}
