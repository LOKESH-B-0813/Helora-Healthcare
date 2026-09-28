'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Activity,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  HeartPulse,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
  Waypoints,
} from 'lucide-react'
import { PublicHeader } from '@/components/public/public-header'
import { PublicFooter } from '@/components/public/public-footer'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { FEATURED_DOCTORS } from '@/lib/data/staff'
import { IMAGES } from '@/lib/data/images'
import { cn } from '@/lib/utils'

export default function PublicHome() {
  const { state } = useFlowPulse()

  const waitFor = (id: string) => {
    return state.departments.find((d) => d.id === id)?.avgWaitMinutes ?? 12
  }

  const utilFor = (id: string) => {
    return state.departments.find((d) => d.id === id)?.utilization ?? 70
  }

  const isLabFailure =
    state.activeScenario === 'lab-analyzer-failure' && state.scenarioPhase >= 2

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <PublicHeader />

      <main>
        {/* ================================================================ */}
        {/* 1. HERO SECTION */}
        {/* ================================================================ */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200/80">
          {/* Subtle ambient gradients */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 size-[600px] rounded-full bg-blue-50/60 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 size-[500px] rounded-full bg-purple-50/50 blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-[1480px] px-5 py-12 sm:px-8 lg:px-12 lg:py-20">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
              {/* Left Column: Hero Content */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1.5 text-xs font-bold text-primary shadow-2xs">
                  <Sparkles className="size-3.5 text-purple-600 animate-pulse" />
                  <span>Predictive Hospital Flow Intelligence</span>
                </div>

                <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl text-slate-900 leading-[1.05]">
                  Care without the <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                    waiting chaos.
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-slate-600">
                  Smart appointments, adaptive arrival times, and a connected patient journey powered by real-time hospital flow intelligence.
                </p>

                {/* Primary CTA Cluster */}
                <div className="mt-8 flex flex-wrap items-center gap-3.5">
                  <Link
                    href="/book-appointment"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-hover hover:shadow-lg hover:-translate-y-0.5"
                  >
                    Book Smart Appointment <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/track-visit"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-2xs transition hover:bg-slate-50 hover:border-slate-400"
                  >
                    Track My Visit <Waypoints className="size-4 text-primary" />
                  </Link>
                  <Link
                    href="/departments"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary px-3 py-2"
                  >
                    View Departments <ChevronRight className="size-4" />
                  </Link>
                </div>

                {/* Social Proof / Human Trust Stack */}
                <div className="mt-10 pt-8 border-t border-slate-200 flex flex-wrap items-center gap-5">
                  <div className="flex -space-x-2.5 overflow-hidden">
                    <img
                      src={IMAGES.avatars.p1}
                      alt="Verified Patient Avatar"
                      className="inline-block size-10 rounded-full ring-2 ring-white object-cover"
                    />
                    <img
                      src={IMAGES.avatars.p2}
                      alt="Verified Patient Avatar"
                      className="inline-block size-10 rounded-full ring-2 ring-white object-cover"
                    />
                    <img
                      src={IMAGES.avatars.p3}
                      alt="Verified Patient Avatar"
                      className="inline-block size-10 rounded-full ring-2 ring-white object-cover"
                    />
                    <img
                      src={IMAGES.avatars.p4}
                      alt="Verified Patient Avatar"
                      className="inline-block size-10 rounded-full ring-2 ring-white object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="size-3.5 fill-current" />
                      ))}
                      <span className="ml-1.5 text-xs font-bold text-slate-900">4.9 / 5</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Trusted by <strong className="text-slate-700">25,000+</strong> patients this year
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Premium Hero Image with Floating Informational Cards */}
              <div className="relative">
                <div className="relative mx-auto aspect-[4/3] sm:aspect-[16/11] max-w-2xl overflow-hidden rounded-3xl border border-slate-200 shadow-xl">
                  <img
                    src={IMAGES.hospital.hero}
                    alt="Doctor consulting with patient in modern clinical environment"
                    className="size-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                </div>

                {/* Floating Card 1: Live Hospital Flow */}
                <div className="absolute -bottom-4 left-4 sm:-bottom-6 sm:left-6 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-lg backdrop-blur-md animate-in fade-in duration-500 max-w-[210px]">
                  <div className="flex items-center gap-2">
                    <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Hospital Flow
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-900 flex items-center justify-between">
                    <span>{isLabFailure ? 'Adjusting Load' : 'Stable Flow'}</span>
                    <span className="text-emerald-600 text-xs font-semibold">98.4% Nominal</span>
                  </p>
                </div>

                {/* Floating Card 2: Expected OPD Wait */}
                <div className="absolute -top-4 right-4 sm:-top-5 sm:right-6 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-lg backdrop-blur-md max-w-[190px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Expected OPD Wait
                  </span>
                  <p className="mt-0.5 text-xl font-extrabold text-primary">
                    {waitFor('general-opd')} min
                  </p>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    Adaptive arrival active
                  </span>
                </div>

                {/* Floating Card 3: Doctors On Duty */}
                <div className="hidden sm:block absolute top-1/2 -left-6 -translate-y-1/2 rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-lg backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-blue-100 text-primary">
                      <Stethoscope className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">24 Specialists</p>
                      <p className="text-[10px] text-slate-500">Available Today</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 2. LIVE FLOWPULSE STATUS STRIP */}
        {/* ================================================================ */}
        <section className="bg-slate-900 text-white py-6 border-y border-slate-800">
          <div className="mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              {/* Headline */}
              <div className="flex items-center gap-3">
                <span className="flex size-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                    TODAY AT FLOWPULSE
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Live operational telemetry · Updated 12 sec ago
                  </p>
                </div>
              </div>

              {/* Status Counters Strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 lg:gap-4 flex-1 lg:max-w-4xl">
                <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400">Emergency (ED)</span>
                  <p className="mt-0.5 text-lg font-bold text-white">{waitFor('emergency')} min wait</p>
                </div>

                <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400">General OPD</span>
                  <p className="mt-0.5 text-lg font-bold text-white">{waitFor('general-opd')} min wait</p>
                </div>

                <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400">Cardiology</span>
                  <p className="mt-0.5 text-lg font-bold text-white">{waitFor('cardiology')} min wait</p>
                </div>

                <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400">Diagnostic Lab</span>
                  <p className="mt-0.5 text-lg font-bold text-white">{waitFor('laboratory')} min wait</p>
                </div>

                <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400">Doctors On Duty</span>
                  <p className="mt-0.5 text-lg font-bold text-emerald-400">24 Active</p>
                </div>

                <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400">Beds Available</span>
                  <p className="mt-0.5 text-lg font-bold text-blue-400">18 Ready</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 3. INTEROPERABILITY & STANDARDS STRIP */}
        {/* ================================================================ */}
        <section className="bg-white py-8 border-b border-slate-200">
          <div className="mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                DESIGNED FOR INTEROPERABILITY & HOSPITAL SCALE
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">
                <ShieldCheck className="size-4 text-primary" /> HMIS Ready
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">
                <ShieldCheck className="size-4 text-primary" /> EHR Ready (FHIR R4)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">
                <ShieldCheck className="size-4 text-primary" /> Lab Systems (LIS)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">
                <ShieldCheck className="size-4 text-primary" /> Radiology (RIS / PACS)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">
                <ShieldCheck className="size-4 text-emerald-600" /> ABDM Integration Ready
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">
                <ShieldCheck className="size-4 text-primary" /> Bed Telemetry Ready
              </span>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 4. CLINICAL DEPARTMENTS WITH REAL PHOTOGRAPHY & TAGS */}
        {/* ================================================================ */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  OUR CLINICAL SERVICES
                </span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-900">
                  Specialist Care, Connected by Flow.
                </h2>
                <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-600">
                  Each specialty is coordinated within our dynamic patient flow network, ensuring minimal waiting room transit and connected diagnostic handoffs.
                </p>
              </div>

              <Link
                href="/departments"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                All 10 Departments <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {state.departments.slice(0, 8).map((dept) => (
                <div
                  key={dept.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div>
                    {/* Department Image */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      <img
                        src={dept.imageUrl || IMAGES.departments.cardiology}
                        alt={dept.name}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-900 shadow-xs backdrop-blur-md">
                        {dept.avgWaitMinutes > 0 ? `${dept.avgWaitMinutes} min wait` : 'Inpatient'}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-900">{dept.name}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">
                        {dept.description || 'Comprehensive specialist care with real-time capacity and bed coordination.'}
                      </p>

                      {/* Medical Tags */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {(dept.specialties || ['Care', 'Specialist', 'Consult']).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50/50 p-5 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      {dept.staffOnDuty} Staff On Duty
                    </span>
                    <Link
                      href="/book-appointment"
                      className="font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      Book Slot <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 5. MODERN CARE ENVIRONMENT / FACILITIES GALLERY */}
        {/* ================================================================ */}
        <section className="bg-slate-900 py-20 sm:py-28 text-white">
          <div className="mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-400">
                MODERN CARE ENVIRONMENT
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
                Advanced Facilities, Engineered for Flow.
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                A physical healthcare campus integrated with continuous digital telemetry and streamlined diagnostics.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'Diagnostic Laboratory Suite', img: IMAGES.hospital.laboratory, desc: 'Automated biochemistry and hematology testing platforms' },
                { title: 'Advanced Radiology & 3T MRI', img: IMAGES.hospital.radiology, desc: 'High-resolution neurovascular and trauma imaging' },
                { title: 'Cardiac Intensive Care (ICU)', img: IMAGES.hospital.icu, desc: 'Continuous telemetry and invasive hemodynamic support' },
                { title: 'Level-1 Emergency Trauma Bay', img: IMAGES.hospital.emergency, desc: 'Rapid resuscitation with direct bed-flow allocation' },
                { title: 'Specialist Consultation Suites', img: IMAGES.hospital.consultationRoom, desc: 'Private, quiet clinical evaluation environments' },
                { title: 'Patient Recovery & Step-Down', img: IMAGES.hospital.ward, desc: 'Comfortable inpatient wings with dynamic turnover monitoring' },
              ].map((f) => (
                <div
                  key={f.title}
                  className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-800/50 shadow-lg"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden">
                    <img
                      src={f.img}
                      alt={f.title}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-base font-bold text-white">{f.title}</h3>
                    <p className="mt-1 text-xs text-slate-300 line-clamp-1">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 6. FEATURED SPECIALIST DOCTORS WITH PROFESSIONAL PORTRAITS */}
        {/* ================================================================ */}
        <section className="py-20 sm:py-28 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  MEET OUR MEDICAL FACULTY
                </span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-900">
                  Experienced Specialists. Clear Next Steps.
                </h2>
                <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-600">
                  Consult with top clinical specialists. FlowPulse calculates optimal arrival times so your face-to-face consultation starts promptly.
                </p>
              </div>

              <Link
                href="/doctors"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                View Full Faculty <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_DOCTORS.slice(0, 4).map((doctor) => (
                <div
                  key={doctor.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div>
                    {/* Doctor Portrait (3:4 ratio) */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
                      <img
                        src={doctor.imageUrl}
                        alt={doctor.name}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-emerald-700 shadow-xs backdrop-blur-md flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-500" /> Available Today
                      </div>
                      <div className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
                        ★ {doctor.rating}
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-bold text-slate-900">{doctor.name}</h3>
                      <p className="text-xs font-semibold text-primary mt-0.5">
                        {doctor.qualification}
                      </p>
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                        {doctor.biography}
                      </p>

                      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                        <span>{doctor.yearsExperience} Yrs Experience</span>
                        <span className="font-bold text-slate-900">{doctor.nextSlot}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <Link
                      href="/book-appointment"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-primary"
                    >
                      Book Appointment <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 7. PATIENT TESTIMONIALS & AUTHENTIC EXPERIENCES */}
        {/* ================================================================ */}
        <section className="py-20 sm:py-28 bg-slate-50">
          <div className="mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-12">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                PATIENT EXPERIENCES
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
                Confidence Across Every Stage of Care.
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Real feedback from patients who experienced synchronized arrival planning and transparent journey tracking.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  quote:
                    'The updated arrival time meant I spent only 8 minutes sitting in the waiting area instead of the usual hour. The transparency was refreshing.',
                  author: 'Kavya R.',
                  role: 'Cardiology Outpatient',
                  avatar: IMAGES.avatars.p1,
                  rating: 5,
                },
                {
                  quote:
                    'I could see every stage of my visit on my phone instead of wondering when my diagnostic results would come back. Excellent coordination.',
                  author: 'Mohammed A.',
                  role: 'General Medicine Visitor',
                  avatar: IMAGES.avatars.p2,
                  rating: 5,
                },
                {
                  quote:
                    'When an analyzer in the lab had a maintenance delay, my estimated completion time adjusted automatically. No unexpected surprises.',
                  author: 'Sneha P.',
                  role: 'Diagnostic Laboratory Patient',
                  avatar: IMAGES.avatars.p3,
                  rating: 5,
                },
              ].map((t) => (
                <div
                  key={t.author}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="size-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-slate-700 italic">
                      "{t.quote}"
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
                    <img
                      src={t.avatar}
                      alt={t.author}
                      className="size-10 rounded-full object-cover ring-2 ring-slate-100"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{t.author}</h4>
                      <p className="text-[11px] text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 8. CALL TO ACTION BANNER */}
        {/* ================================================================ */}
        <section className="mx-auto max-w-[1480px] px-5 pb-20 sm:px-8 lg:px-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-8 sm:p-14 text-white shadow-2xl">
            <div className="relative z-10 max-w-2xl">
              <span className="rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-bold text-blue-300 border border-blue-400/30">
                START YOUR JOURNEY
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
                Care built around your time, not the waiting room.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                Book with a specialist today and receive smart arrival recommendations powered by FlowPulse live flow intelligence.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/book-appointment"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-primary-hover hover:scale-105"
                >
                  Book Appointment Now <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/track-visit"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
                >
                  Track Existing Visit
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
