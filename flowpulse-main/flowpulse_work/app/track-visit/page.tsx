'use client'

import React from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Hourglass,
  Layers,
  Sparkles,
  Stethoscope,
  Waypoints,
} from 'lucide-react'
import { PublicHeader } from '@/components/public/public-header'
import { PublicFooter } from '@/components/public/public-footer'
import { HospitalLocationTracker } from '@/components/location/hospital-location-tracker'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { IMAGES } from '@/lib/data/images'
import { cn } from '@/lib/utils'

export default function TrackVisitPage() {
  const { state } = useFlowPulse()

  const journey = state.patientJourney
  const latestAppt = state.userAppointments && state.userAppointments.length > 0 ? state.userAppointments[0] : null

  const patientName = latestAppt?.patientName || journey.patientName || 'Arjun Kumar'
  const appointmentId = latestAppt?.id || journey.patientId || 'FP-2026-10482'
  const departmentName = latestAppt?.departmentName || journey.departmentName || 'Cardiology'
  const doctorName = latestAppt?.doctorName || journey.doctorName || 'Dr. Ananya Rao'
  const doctorImage = latestAppt?.doctorImage || journey.doctorImage || IMAGES.doctors.drAnanyaRao
  const appointmentTime = latestAppt?.scheduledTime || journey.appointmentTime || '10:30 AM'
  const recommendedArrival = latestAppt?.recommendedArrivalWindow || journey.recommendedArrival || '10:35–10:45 AM'

  const isLabFailure =
    state.activeScenario === 'lab-analyzer-failure' &&
    state.scenarioPhase >= 2 &&
    state.scenarioPhase < 5
  const isRecovered =
    state.activeScenario === 'lab-analyzer-failure' &&
    (state.scenarioPhase >= 5 || state.approvedIntervention !== null)

  const currentStage = journey.stages.find((s) => s.status === 'in-progress') || journey.stages[2]
  const completedStagesCount = journey.stages.filter((s) => s.status === 'completed').length

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 uppercase tracking-wider"
        >
          <ArrowLeft className="size-4" /> Back to Hospital Home
        </Link>

        {/* Top Operational Status Summary Strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="p-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Patient & ID</span>
            <p className="mt-0.5 text-xs font-bold text-slate-900 truncate">{patientName}</p>
            <span className="font-mono text-[10px] text-primary">{appointmentId}</span>
          </div>

          <div className="p-2 border-l border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Physician</span>
            <p className="mt-0.5 text-xs font-bold text-slate-900 truncate">{doctorName}</p>
            <span className="text-[10px] text-slate-500">{departmentName}</span>
          </div>

          <div className="p-2 border-l border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Stage</span>
            <p className="mt-0.5 text-xs font-bold text-primary truncate">{currentStage.name}</p>
            <span className="text-[10px] text-emerald-600 font-semibold">{completedStagesCount} of 7 Completed</span>
          </div>

          <div className="p-2 border-l border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Estimated Exit</span>
            <p className="mt-0.5 text-xs font-extrabold text-slate-900">{journey.estimatedCompletion}</p>
            <span className="text-[10px] text-slate-500">Remaining: ~{isLabFailure ? '62' : '44'} min</span>
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_.75fr]">
          {/* Main Card: Live Patient Journey Timeline */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  LIVE PATIENT FLOW TRACKER
                </span>
                <p className="mt-0.5 font-mono text-xs font-bold text-slate-500">
                  Appointment ID: {appointmentId}
                </p>
              </div>

              <span
                className={cn(
                  'rounded-full px-3.5 py-1 text-xs font-bold',
                  isLabFailure
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : isRecovered
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-blue-100 text-primary border border-blue-200',
                )}
              >
                {isLabFailure
                  ? 'Schedule Adjusted (+16m)'
                  : isRecovered
                    ? 'Operational Recovery Active'
                    : 'Visit Active'}
              </span>
            </div>

            {/* Patient & Doctor Header */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Good Morning, {patientName}.
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  {departmentName} Consultation · Scheduled for {appointmentTime}
                </p>
              </div>

              {/* Doctor Thumbnail */}
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 pr-4">
                <img
                  src={doctorImage}
                  alt={doctorName}
                  className="size-10 rounded-xl object-cover ring-2 ring-white"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{doctorName}</h4>
                  <p className="text-[10px] text-slate-500">Consultant Specialist</p>
                </div>
              </div>
            </div>

            {/* Stages Timeline */}
            <div className="mt-8 space-y-3">
              {journey.stages.map((stage, i) => {
                const isCompleted = stage.status === 'completed'
                const isInProgress = stage.status === 'in-progress'

                return (
                  <div
                    key={stage.name}
                    className={cn(
                      'flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200',
                      isInProgress
                        ? 'border-primary bg-blue-50/60 shadow-xs ring-1 ring-primary/20'
                        : isCompleted
                          ? 'border-slate-200 bg-white'
                          : 'border-slate-100 bg-slate-50/60 opacity-75',
                    )}
                  >
                    {/* Stage Number / Status Mark */}
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-2xs',
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInProgress
                            ? 'bg-primary text-white animate-pulse'
                            : 'bg-slate-200 text-slate-600',
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="size-4" /> : i + 1}
                    </span>

                    {/* Stage Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {stage.name}
                        </p>
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {stage.actualOrEstimatedTime}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {stage.note ?? (isInProgress ? 'In Progress' : isCompleted ? 'Completed' : 'Upcoming')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Right Rail: Dynamic FlowPulse Update & Timing */}
          <aside className="space-y-4">
            {/* Live Queue Status & Token Card */}
            <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary">
                  <Clock3 className="size-3.5" /> LIVE QUEUE STATUS
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-black text-primary">
                  TOKEN C-021
                </span>
              </div>

              {/* 3 Metric Badges: Position, Ahead, Wait */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="rounded-2xl bg-white p-3 border border-slate-200/80 text-center shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Position</span>
                  <p className="mt-1 text-2xl font-black text-slate-900">#3</p>
                  <span className="text-[10px] text-slate-500">In Line</span>
                </div>

                <div className="rounded-2xl bg-white p-3 border border-slate-200/80 text-center shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Ahead</span>
                  <p className="mt-1 text-2xl font-black text-slate-900">2</p>
                  <span className="text-[10px] text-slate-500">Patients</span>
                </div>

                <div className="rounded-2xl bg-white p-3 border border-slate-200/80 text-center shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Wait Time</span>
                  <p className="mt-1 text-2xl font-black text-primary">
                    14<span className="text-xs font-bold text-slate-500">m</span>
                  </p>
                  <span className="text-[10px] text-slate-500">Estimated</span>
                </div>
              </div>

              {/* Expected Consultation & Next Stage */}
              <div className="space-y-2 border-t border-slate-200/80 pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Expected Doctor Consultation:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {isRecovered ? '10:44 AM' : '10:48 AM'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Next Care Stage:</span>
                  <span className="font-bold text-primary">Laboratory Diagnostics</span>
                </div>
              </div>
            </div>

            {/* Dynamic Status Update Card */}
            <div
              className={cn(
                'rounded-3xl p-7 text-white shadow-xl transition-colors duration-300',
                isLabFailure
                  ? 'bg-gradient-to-br from-amber-900 to-amber-950 border border-amber-700/50'
                  : isRecovered
                    ? 'bg-gradient-to-br from-emerald-900 to-slate-950 border border-emerald-700/50'
                    : 'bg-gradient-to-br from-slate-900 to-blue-950 border border-slate-800',
              )}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80">
                <Sparkles className="size-4" /> FlowPulse Live Synchronization
              </div>

              <h2 className="mt-3 text-2xl font-extrabold">
                {isLabFailure
                  ? 'Schedule Recalibrated'
                  : isRecovered
                    ? 'Estimated Times Normalized'
                    : 'Your Visit is On Track'}
              </h2>

              <p className="mt-3 text-xs leading-relaxed text-white/80">
                {journey.alertMessage ??
                  'Hospital systems report nominal flow across clinical review, laboratory processing, and pharmacy fulfillment.'}
              </p>
            </div>

            {/* Timing Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Clock3 className="size-4 text-primary" /> Synchronized Timing Estimates
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Recommended Arrival Window</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">
                    {recommendedArrival}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500 font-medium">Estimated Visit Completion</p>
                  <p
                    className={cn(
                      'mt-1 text-2xl font-extrabold',
                      isLabFailure ? 'text-amber-600' : 'text-primary',
                    )}
                  >
                    {journey.estimatedCompletion}
                  </p>
                  {isLabFailure && (
                    <span className="mt-1 block text-[11px] font-semibold text-amber-700">
                      +16 min temporary delay due to analyzer maintenance
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Link to Staff Command Center for Demonstration */}
            <Link
              href="/staff"
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-xs font-bold text-slate-800 shadow-xs transition hover:bg-slate-50"
            >
              <span>Demo Mode: Open Staff Command Center</span>
              <ArrowRight className="size-4 text-primary transition group-hover:translate-x-1" />
            </Link>
          </aside>
        </div>

        {/* Real-time Hospital Indoor Location & Wayfinding Section */}
        <section className="mt-12">
          <div className="mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              CAMPUS GPS & INDOOR WAYFINDING
            </span>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
              Live Location & Next Care Unit Directions
            </h2>
          </div>
          <HospitalLocationTracker
            initialHospitalId="metro-general"
            currentDepartmentId="cardiology"
            destinationDepartmentId="laboratory"
            patientName={patientName}
          />
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
