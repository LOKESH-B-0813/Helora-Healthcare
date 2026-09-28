'use client'

import React from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  Award,
  CheckCircle2,
  GitFork,
  HeartPulse,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { PublicHeader } from '@/components/public/public-header'
import { PublicFooter } from '@/components/public/public-footer'
import { IMAGES } from '@/lib/data/images'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <PublicHeader />

      <main className="pb-24">
        {/* Hero Section */}
        <section className="bg-white py-16 sm:py-24 border-b border-slate-200">
          <div className="mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                <Sparkles className="size-3.5" /> About FlowPulse AI
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                Hospital care built around patient flow.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-600">
                A hospital is not an isolated queue. It is an interconnected care network where every consultation, diagnostic panel, inpatient bed transfer, and pharmacy discharge ripples across the entire institution.
              </p>
            </div>

            {/* Operational Impact Stats Strip */}
            <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-xs">
                <p className="text-3xl sm:text-4xl font-extrabold text-primary">25K+</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Patient Journeys Coordinated
                </p>
                <p className="mt-1 text-[11px] text-slate-500">Across outpatient & emergency</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-xs">
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">30+</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Medical Specialists
                </p>
                <p className="mt-1 text-[11px] text-slate-500">Board-certified clinical faculty</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-xs">
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600">10</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Connected Departments
                </p>
                <p className="mt-1 text-[11px] text-slate-500">Synchronized into one flow graph</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-xs">
                <p className="text-3xl sm:text-4xl font-extrabold text-purple-600">98%</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Data Synchronization
                </p>
                <p className="mt-1 text-[11px] text-slate-500">Sub-minute predictive latency</p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Narrative & Photography */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  THE FLOW NETWORK PHILOSOPHY
                </span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
                  "Don't manage the queue. Prevent the ripple."
                </h2>
                <div className="mt-6 space-y-4 text-sm sm:text-base leading-relaxed text-slate-600">
                  <p>
                    When a routine blood analyzer in the laboratory slows down, the delay does not remain inside the lab. It delays doctor consultations, which pushes back discharge authorizations, which keeps inpatient beds occupied, and ultimately forces Emergency Department patients onto stretchers in the hallway.
                  </p>
                  <p>
                    FlowPulse continuously tracks and forecasts these interconnected dependencies. By modeling future congestion hours before it materializes, clinical teams can simulate counterfactual interventions and take proactive action.
                  </p>
                </div>

                <div className="mt-8 grid gap-3">
                  {[
                    'Dynamic adaptive arrival windows that respect patient time',
                    'Zero AI clinical overrides — all medical decisions remain with licensed doctors',
                    'Strict human-in-the-loop governance for any operational re-balancing',
                    'Continuous telemetry integration across EHR, ADT, LIS, and RIS feeds',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                      <span className="text-xs sm:text-sm font-semibold text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* High-res Clinical Photography */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 shadow-xl aspect-[4/3]">
                <img
                  src={IMAGES.hospital.consultationRoom}
                  alt="Modern consultation suite at Metro General Hospital"
                  className="size-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Connects: The 6 Care Stages */}
        <section className="bg-slate-900 py-20 sm:py-28 text-white">
          <div className="mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-400">
                CONNECTED HOSPITAL GRAPH
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Unifying the 6 Interconnected Care Stages
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                FlowPulse links every stage of the hospital journey into a single real-time operational stream.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: '1. Registration & OPD', desc: 'Smart appointment intake and adaptive arrival scheduling that smooths peak morning surges.' },
                { title: '2. Clinical Consultation', desc: 'Face-to-face physician evaluations with synchronized diagnostic order dispatching.' },
                { title: '3. Laboratory & Radiology', desc: 'Real-time analyzer telemetry and study queue monitoring for fast diagnostic turnaround.' },
                { title: '4. Inpatient & ICU Wards', desc: '120-bed occupancy tracking with proactive bed-sanitization and transfer signaling.' },
                { title: '5. Pharmacy Dispensing', desc: 'Digital e-prescription queues ensuring medications are ready upon consultation completion.' },
                { title: '6. Discharge & Bed Turnover', desc: 'Streamlined discharge clearance to free up inpatient capacity for waiting ED patients.' },
              ].map((stage) => (
                <div
                  key={stage.title}
                  className="rounded-3xl border border-slate-800 bg-slate-800/60 p-6 shadow-xs"
                >
                  <h3 className="text-base font-bold text-white">{stage.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{stage.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Experience the future of hospital flow intelligence.
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Schedule your consultation or explore the staff command center.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/book-appointment"
                className="rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-md hover:bg-primary-hover"
              >
                Book Appointment
              </Link>
              <Link
                href="/staff"
                className="rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Staff Command Center →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
