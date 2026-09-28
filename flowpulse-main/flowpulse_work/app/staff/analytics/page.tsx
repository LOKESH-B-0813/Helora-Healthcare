'use client'

import React from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Calendar,
  ChartLine,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { DemoController } from '@/components/staff/demo-controller'

const FLOW_TREND_DATA = [
  { time: '06:00', admissions: 4, discharges: 1, netCensus: 102 },
  { time: '07:00', admissions: 7, discharges: 2, netCensus: 107 },
  { time: '08:00', admissions: 14, discharges: 4, netCensus: 117 },
  { time: '09:00', admissions: 22, discharges: 8, netCensus: 131 },
  { time: '10:00', admissions: 28, discharges: 12, netCensus: 147 },
  { time: '11:00', admissions: 31, discharges: 18, netCensus: 160 },
  { time: '12:00 (Now)', admissions: 26, discharges: 21, netCensus: 165 },
  { time: '13:00 (Pred)', admissions: 22, discharges: 24, netCensus: 163 },
  { time: '14:00 (Pred)', admissions: 19, discharges: 26, netCensus: 156 },
  { time: '15:00 (Pred)', admissions: 16, discharges: 22, netCensus: 150 },
]

const DEPT_UTIL_DATA = [
  { dept: 'ED', actual: 88, target: 80 },
  { dept: 'OPD', actual: 70, target: 75 },
  { dept: 'Cardio', actual: 72, target: 75 },
  { dept: 'Lab', actual: 92, target: 80 },
  { dept: 'Rad', actual: 73, target: 75 },
  { dept: 'ICU', actual: 88, target: 85 },
  { dept: 'Ward A', actual: 81, target: 85 },
  { dept: 'Ward B', actual: 71, target: 85 },
  { dept: 'Pharmacy', actual: 38, target: 60 },
  { dept: 'Discharge', actual: 45, target: 60 },
]

const WAIT_SLA_DATA = [
  { time: '08:00', ED: 14, Lab: 22, OPD: 16, SLA: 30 },
  { time: '09:00', ED: 16, Lab: 26, OPD: 18, SLA: 30 },
  { time: '10:00', ED: 18, Lab: 31, OPD: 21, SLA: 30 },
  { time: '11:00', ED: 19, Lab: 48, OPD: 22, SLA: 30 },
  { time: '12:00 (Now)', ED: 18, Lab: 54, OPD: 22, SLA: 30 },
  { time: '13:00 (Pred)', ED: 29, Lab: 44, OPD: 20, SLA: 30 },
  { time: '14:00 (Pred)', ED: 43, Lab: 32, OPD: 19, SLA: 30 },
]

const ACCURACY_DATA = [
  { horizon: '+15 min', accuracy: 96.2, baseline: 82.0 },
  { horizon: '+30 min', accuracy: 92.4, baseline: 76.5 },
  { horizon: '+45 min', accuracy: 89.1, baseline: 71.0 },
  { horizon: '+60 min', accuracy: 86.8, baseline: 64.2 },
  { horizon: '+90 min', accuracy: 82.3, baseline: 58.0 },
  { horizon: '+120 min', accuracy: 78.9, baseline: 51.4 },
]

export default function AnalyticsPage() {
  const { state } = useFlowPulse()

  return (
    <div className="space-y-6 pb-12">
      {/* Demo Controls */}
      <DemoController />

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <ChartLine className="size-3" /> Historical & Predictive Analytics
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Operational Flow Analytics & Model Precision
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Benchmarking hospital throughput, SLA breach variance, bed turnaround duration, and FlowPulse predictive reliability.
          </p>
        </div>
      </div>

      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Mean Wait Time</span>
          <p className="mt-1 text-2xl font-bold text-foreground">23.4 min</p>
          <span className="text-[11px] text-success font-medium">-18% vs baseline target</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Turnover Duration</span>
          <p className="mt-1 text-2xl font-bold text-foreground">34.2 min</p>
          <span className="text-[11px] text-muted-foreground">Bed exit to ready</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Model Horizon Accuracy</span>
          <p className="mt-1 text-2xl font-bold text-primary">91.8%</p>
          <span className="text-[11px] text-muted-foreground">Across 30–60m forecast window</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Discharge Velocity</span>
          <p className="mt-1 text-2xl font-bold text-foreground">18.2 / hr</p>
          <span className="text-[11px] text-success font-medium">Peak shift throughput</span>
        </div>
      </div>

      {/* Chart Row 1: Hospital Flow & Department Utilization */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hospital Flow Trend Area Chart */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-7">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" /> Hospital Inflow & Net Census Flow
              </h2>
              <span className="text-[11px] text-muted-foreground">Admissions vs discharges by hour</span>
            </div>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              Hourly Trend
            </span>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={FLOW_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.55 0.17 256)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.55 0.17 256)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.62 0.14 155)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.62 0.14 155)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.006 250)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'oklch(0.52 0.02 257)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'oklch(0.52 0.02 257)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(1 0 0)',
                    borderColor: 'oklch(0.92 0.006 250)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="admissions" name="Admissions / Inflow" stroke="oklch(0.55 0.17 256)" fillOpacity={1} fill="url(#colorAdm)" />
                <Area type="monotone" dataKey="discharges" name="Discharges / Exits" stroke="oklch(0.62 0.14 155)" fillOpacity={1} fill="url(#colorDc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Utilization Bar Chart */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-7">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" /> Department Load vs Capacity Target
              </h2>
              <span className="text-[11px] text-muted-foreground">Current utilization benchmarked against SLA thresholds</span>
            </div>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEPT_UTIL_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.006 250)" />
                <XAxis dataKey="dept" tick={{ fontSize: 10, fill: 'oklch(0.52 0.02 257)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'oklch(0.52 0.02 257)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(1 0 0)',
                    borderColor: 'oklch(0.92 0.006 250)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="actual" name="Current Load %" fill="oklch(0.55 0.17 256)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target Cap %" fill="oklch(0.72 0.15 72)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart Row 2: Waiting Time vs SLA & Prediction Accuracy */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Waiting Time vs SLA Line Chart */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-7">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Clock className="size-4 text-primary" /> Wait Time Trajectory & SLA Thresholds
              </h2>
              <span className="text-[11px] text-muted-foreground">Emergency, Laboratory, and OPD wait evolution</span>
            </div>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WAIT_SLA_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.006 250)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'oklch(0.52 0.02 257)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'oklch(0.52 0.02 257)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(1 0 0)',
                    borderColor: 'oklch(0.92 0.006 250)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Lab" name="Lab Wait (min)" stroke="oklch(0.58 0.21 25)" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="ED" name="Emergency Wait" stroke="oklch(0.72 0.15 72)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="OPD" name="OPD Wait" stroke="oklch(0.62 0.14 155)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="SLA" name="30m Target SLA" stroke="oklch(0.52 0.02 257)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction Accuracy Chart */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-7">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> Predictive Horizon Precision
              </h2>
              <span className="text-[11px] text-muted-foreground">FlowPulse AI accuracy vs standard static queuing</span>
            </div>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ACCURACY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.006 250)" />
                <XAxis dataKey="horizon" tick={{ fontSize: 10, fill: 'oklch(0.52 0.02 257)' }} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: 'oklch(0.52 0.02 257)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(1 0 0)',
                    borderColor: 'oklch(0.92 0.006 250)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="accuracy" name="FlowPulse Dynamic Accuracy (%)" stroke="oklch(0.55 0.17 256)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="baseline" name="Static Queue Average" stroke="oklch(0.52 0.02 257)" strokeDasharray="3 3" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
