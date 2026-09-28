'use client'

import React, { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Hourglass,
  Layers,
  Share2,
  Sparkles,
  Star,
  User,
} from 'lucide-react'
import { PublicHeader } from '@/components/public/public-header'
import { PublicFooter } from '@/components/public/public-footer'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { FEATURED_DOCTORS } from '@/lib/data/staff'
import { calculateAdaptiveArrival } from '@/lib/state/selectors'
import type { DepartmentId, UserAppointment } from '@/lib/data/types'

function BookAppointmentForm() {
  const { state, addAppointment } = useFlowPulse()
  const searchParams = useSearchParams()

  const initialDocId = searchParams.get('doctorId') || 'DOC-101'
  const initialDoc = FEATURED_DOCTORS.find((d) => d.id === initialDocId)
  const initialDeptId = (initialDoc?.department as DepartmentId) || 'cardiology'

  const [patientName, setPatientName] = useState('Arjun Kumar')
  const [deptId, setDeptId] = useState<DepartmentId>(initialDeptId)
  const [doctorId, setDoctorId] = useState<string>(initialDocId)
  const [selectedDate, setSelectedDate] = useState<string>('Today (Live Stream)')
  const [slot, setSlot] = useState<string>('10:30 AM')
  const [confirmedApt, setConfirmedApt] = useState<UserAppointment | null>(null)
  const [calendarToast, setCalendarToast] = useState(false)
  const [downloadToast, setDownloadToast] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(true)

  useEffect(() => {
    const paramDocId = searchParams.get('doctorId')
    if (paramDocId) {
      const match = FEATURED_DOCTORS.find((d) => d.id === paramDocId)
      if (match) {
        setDoctorId(paramDocId)
        setDeptId(match.department)
      }
    }
  }, [searchParams])

  const selectedDept = state.departments.find((d) => d.id === deptId) ?? state.departments[0]

  const eligibleDoctors = useMemo(() => {
    return FEATURED_DOCTORS.filter((d) => d.department === deptId || deptId === 'general-opd')
  }, [deptId])

  const selectedDoctor =
    FEATURED_DOCTORS.find((d) => d.id === doctorId) ?? eligibleDoctors[0] ?? FEATURED_DOCTORS[0]

  // Adaptive arrival window calculation from FlowPulse state engine
  const adaptiveArrival = useMemo(() => {
    return calculateAdaptiveArrival(state, deptId, slot)
  }, [state, deptId, slot])

  const handleConfirm = () => {
    const newAppointment: UserAppointment = {
      id: `FP-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      patientName: patientName || 'Arjun Kumar',
      departmentId: deptId,
      departmentName: selectedDept.name,
      doctorId: selectedDoctor?.id ?? 'DOC-101',
      doctorName: selectedDoctor?.name ?? 'Dr. Ananya Rao',
      doctorQualification: selectedDoctor?.qualification,
      doctorImage: selectedDoctor?.imageUrl,
      scheduledTime: slot,
      recommendedArrivalWindow: adaptiveArrival.recommendedArrivalWindow,
      estimatedCompletionTime: adaptiveArrival.estimatedCompletion,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    }

    addAppointment(newAppointment)
    setConfirmedApt(newAppointment)
  }

  const handleAddToCalendar = () => {
    setCalendarToast(true)
    setTimeout(() => setCalendarToast(false), 3000)
  }

  const handleDownloadSummary = () => {
    setDownloadToast(true)
    setTimeout(() => setDownloadToast(false), 3000)
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-20">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 uppercase tracking-wider"
      >
        <ArrowLeft className="size-4" /> Back to Hospital Home
      </Link>

      {/* Toasts */}
      {calendarToast && (
        <div className="mt-4 rounded-2xl bg-slate-900 text-white p-4 text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 text-emerald-400" /> Appointment synced with Google Calendar / Apple iCal.
        </div>
      )}

      {downloadToast && (
        <div className="mt-4 rounded-2xl bg-slate-900 text-white p-4 text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in">
          <Download className="size-4 text-primary" /> Appointment summary PDF downloaded (ID: {confirmedApt?.id || 'FP-2026-10482'}).
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        {/* Left Form: Step-by-Step Hospital Booking */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            SMART HOSPITAL SCHEDULING
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-900">
            Plan the visit, not the wait.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-600 leading-relaxed">
            Choose your specialist department, physician, and preferred slot. FlowPulse analyzes real-time hospital flow to calculate your exact arrival window and total visit duration.
          </p>

          <div className="mt-8 space-y-6">
            {/* Step 1: Patient Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Step 1: Patient Full Name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Arjun Kumar"
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none focus:border-primary focus:bg-white transition"
              />
            </div>

            {/* Step 2: Department */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Step 2: Select Clinical Department
              </label>
              <select
                value={deptId}
                onChange={(e) => {
                  const newDept = e.target.value as DepartmentId
                  setDeptId(newDept)
                  const matching = FEATURED_DOCTORS.find((d) => d.department === newDept)
                  if (matching) setDoctorId(matching.id)
                }}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none focus:border-primary focus:bg-white transition"
              >
                {state.departments.slice(0, 8).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — Current Unit Wait: {d.avgWaitMinutes} min
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Doctor Selection with Portrait Card */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Step 3: Select Specialist Doctor
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none focus:border-primary focus:bg-white transition"
              >
                {FEATURED_DOCTORS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.qualification} ({d.yearsExperience} yrs exp.)
                  </option>
                ))}
              </select>

              {/* Doctor Preview Badge */}
              {selectedDoctor && (
                <div className="mt-3 flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <img
                    src={selectedDoctor.imageUrl}
                    alt={selectedDoctor.name}
                    className="size-12 rounded-xl object-cover ring-2 ring-white"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{selectedDoctor.name}</h4>
                    <p className="text-[11px] text-slate-500">{selectedDoctor.qualification}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-emerald-700 font-semibold">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Next slot: {selectedDoctor.nextSlot}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Preferred Date & Slot */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Step 4: Appointment Date
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none focus:border-primary focus:bg-white transition"
                >
                  <option value="Today (Live Stream)">Today (Live Adaptive Stream)</option>
                  <option value="Tomorrow">Tomorrow (Morning Shift)</option>
                  <option value="Day After Tomorrow">Day After Tomorrow</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Step 5: Preferred Slot
                </label>
                <select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none focus:border-primary focus:bg-white transition"
                >
                  <option value="10:30 AM">10:30 AM (Morning Slot)</option>
                  <option value="11:40 AM">11:40 AM (Midday Slot)</option>
                  <option value="02:20 PM">02:20 PM (Afternoon Slot)</option>
                  <option value="04:10 PM">04:10 PM (Late Afternoon Slot)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-white shadow-md transition hover:bg-primary-hover hover:shadow-lg"
            >
              Confirm Appointment & Optimize Arrival <ArrowRight className="size-4" />
            </button>
          </div>
        </section>

        {/* Right Panel: Adaptive Arrival Preview & Confirmation Card */}
        <aside className="flex flex-col justify-between rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Sparkles className="size-4" /> FlowPulse Dynamic Arrival Intelligence
            </div>

            <h2 className="mt-3 text-2xl font-extrabold">Your Synchronized Visit Plan</h2>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Based on live patient flow and diagnostic transit times, FlowPulse calculates an arrival window to eliminate waiting room delays.
            </p>

            {/* 4 Essential Metrics Strip */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {/* Metric 1: Recommended Arrival Time */}
              <div className="col-span-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-emerald-400">
                  <Sparkles className="size-4" /> Recommended Arrival Window
                </div>
                <p className="mt-1 text-2xl font-extrabold text-white">
                  {adaptiveArrival.recommendedArrivalWindow}
                </p>
                <span className="text-[11px] text-emerald-300 font-medium">
                  {adaptiveArrival.isAdjusted ? 'Recalibrated for active clinic load' : 'Optimized for on-time consultation'}
                </span>
              </div>

              {/* Metric 2: Expected Waiting Time */}
              <div className="rounded-2xl border border-slate-800 bg-slate-800/80 p-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Clock3 className="size-3.5" /> Expected Wait
                </span>
                <p className="mt-1 text-lg font-bold text-white">
                  {adaptiveArrival.expectedWaitingMinutes} min
                </p>
                <span className="text-[10px] text-slate-400">Queue buffer</span>
              </div>

              {/* Metric 3: Total Visit Duration */}
              <div className="rounded-2xl border border-slate-800 bg-slate-800/80 p-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Hourglass className="size-3.5" /> Total Visit Duration
                </span>
                <p className="mt-1 text-lg font-bold text-white">
                  {adaptiveArrival.totalDurationFormatted}
                </p>
                <span className="text-[10px] text-slate-400">Door-to-door estimate</span>
              </div>

              {/* Metric 4: Expected Completion Time */}
              <div className="col-span-2 rounded-2xl border border-slate-800 bg-slate-800/80 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Expected Visit Completion
                  </span>
                  <p className="mt-0.5 text-xl font-bold text-white">
                    {adaptiveArrival.estimatedCompletion}
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span>Consult: <strong>{adaptiveArrival.expectedConsultation}</strong></span>
                </div>
              </div>
            </div>

            {/* Visit Duration Calculation Breakdown */}
            <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-800/40 p-3.5 text-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" /> Care Stage Breakdown ({adaptiveArrival.totalDurationMinutes}m):
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px] text-slate-400">
                <div className="rounded bg-slate-800/60 p-1.5 text-center">
                  <span>Reg: <strong>{adaptiveArrival.breakdown.registrationMinutes}m</strong></span>
                </div>
                <div className="rounded bg-slate-800/60 p-1.5 text-center">
                  <span>Wait: <strong>{adaptiveArrival.breakdown.queueWaitMinutes}m</strong></span>
                </div>
                <div className="rounded bg-slate-800/60 p-1.5 text-center">
                  <span>Consult: <strong>{adaptiveArrival.breakdown.consultationMinutes}m</strong></span>
                </div>
                <div className="rounded bg-slate-800/60 p-1.5 text-center">
                  <span>Diag: <strong>{adaptiveArrival.breakdown.diagnosticsMinutes}m</strong></span>
                </div>
                <div className="rounded bg-slate-800/60 p-1.5 text-center">
                  <span>Review: <strong>{adaptiveArrival.breakdown.reviewMinutes}m</strong></span>
                </div>
                <div className="rounded bg-slate-800/60 p-1.5 text-center">
                  <span>Pharm: <strong>{adaptiveArrival.breakdown.pharmacyMinutes}m</strong></span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-400 border-t border-slate-800 pt-3">
              {adaptiveArrival.explanation}
            </p>
          </div>

          {/* Confirmed Appointment Card */}
          {confirmedApt && (
            <div className="mt-6 rounded-2xl bg-white p-5 text-slate-900 shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                    APPOINTMENT CONFIRMED
                  </span>
                  <p className="mt-1 font-mono text-xs font-extrabold text-primary">
                    {confirmedApt.id}
                  </p>
                </div>
                <CheckCircle2 className="size-6 text-emerald-600" />
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <p><strong>Patient:</strong> {confirmedApt.patientName}</p>
                <p><strong>Department:</strong> {confirmedApt.departmentName}</p>
                <p><strong>Doctor:</strong> {confirmedApt.doctorName}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400">Arrival Window:</span>
                    <p className="font-bold text-primary">{confirmedApt.recommendedArrivalWindow}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Est. Completion:</span>
                    <p className="font-bold text-slate-900">{confirmedApt.estimatedCompletionTime}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={handleAddToCalendar}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                >
                  <CalendarIcon className="size-3" /> Add to Calendar
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSummary}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                >
                  <Download className="size-3" /> Download PDF
                </button>
              </div>

              <Link
                href="/track-visit"
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-white hover:bg-primary-hover shadow-sm"
              >
                Track Live Patient Journey <ArrowRight className="size-3.5" />
              </Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}

export default function BookAppointmentPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <PublicHeader />
      <Suspense fallback={<div className="p-12 text-center text-xs font-semibold text-slate-500">Loading FlowPulse Scheduler...</div>}>
        <BookAppointmentForm />
      </Suspense>
      <PublicFooter />
    </div>
  )
}
