'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Globe,
  GraduationCap,
  Sparkles,
  Star,
  Stethoscope,
  X,
} from 'lucide-react'
import { PublicHeader } from '@/components/public/public-header'
import { PublicFooter } from '@/components/public/public-footer'
import { FEATURED_DOCTORS } from '@/lib/data/staff'
import type { StaffMember } from '@/lib/data/types'

export default function DoctorsPage() {
  const [selectedDept, setSelectedDept] = useState<string>('all')
  const [activeDoctorModal, setActiveDoctorModal] = useState<StaffMember | null>(null)

  const filteredDoctors = FEATURED_DOCTORS.filter((doc) => {
    if (selectedDept === 'all') return true
    return doc.department === selectedDept
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <PublicHeader />

      <main className="mx-auto max-w-[1480px] px-5 py-12 sm:px-8 lg:px-12 lg:py-20">
        {/* Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            OUR MEDICAL FACULTY
          </span>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-900">
            Consult With Board-Certified Specialists.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Our multi-disciplinary medical team works within the FlowPulse synchronized care network, ensuring transparent arrival windows and prompt face-to-face consultations.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mt-10 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-6">
          {[
            { id: 'all', label: 'All Specialists' },
            { id: 'cardiology', label: 'Cardiology' },
            { id: 'general-opd', label: 'General Medicine & OPD' },
            { id: 'radiology', label: 'Radiology & Imaging' },
            { id: 'emergency', label: 'Emergency Medicine' },
            { id: 'icu', label: 'Critical Care / ICU' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedDept(tab.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                selectedDept === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Doctor Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div>
                {/* Portrait (3:4 ratio) */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
                  <img
                    src={doc.imageUrl}
                    alt={doc.name}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-emerald-700 shadow-xs backdrop-blur-md flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500" /> Available Today
                  </div>
                  <div className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
                    ★ {doc.rating}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900">{doc.name}</h3>
                  <p className="text-xs font-semibold text-primary mt-0.5">
                    {doc.qualification}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                    {doc.biography}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1">
                    {(doc.specialtyTags || []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <span>{doc.yearsExperience} Yrs Exp.</span>
                    <span className="font-bold text-slate-900">{doc.nextSlot}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDoctorModal(doc)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
                >
                  View Profile
                </button>
                <Link
                  href={`/book-appointment?doctorId=${doc.id}`}
                  className="inline-flex items-center justify-center gap-1 rounded-2xl bg-primary py-2.5 text-xs font-bold text-white transition hover:bg-primary-hover"
                >
                  Book Slot <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Doctor Profile Drawer / Modal */}
        {activeDoctorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setActiveDoctorModal(null)}
                className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>

              <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
                {/* Doctor Portrait */}
                <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-slate-100">
                  <img
                    src={activeDoctorModal.imageUrl}
                    alt={activeDoctorModal.name}
                    className="size-full object-cover"
                  />
                </div>

                {/* Bio & Details */}
                <div>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                    Available For Consultations
                  </span>
                  <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                    {activeDoctorModal.name}
                  </h2>
                  <p className="text-xs font-bold text-primary">
                    {activeDoctorModal.qualification}
                  </p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <GraduationCap className="size-4 shrink-0 text-slate-400 mt-0.5" />
                      <span>{activeDoctorModal.education}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="size-4 shrink-0 text-slate-400" />
                      <span>Languages: {activeDoctorModal.languages?.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 shrink-0 text-slate-400" />
                      <span>Next Slot: <strong>{activeDoctorModal.nextSlot}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="size-4 shrink-0 text-slate-400" />
                      <span>Experience: {activeDoctorModal.yearsExperience} Years Clinical Practice</span>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-slate-600 border-t border-slate-100 pt-3">
                    {activeDoctorModal.biography}
                  </p>

                  <div className="mt-6 flex items-center gap-3">
                    <Link
                      href={`/book-appointment?doctorId=${activeDoctorModal.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-white hover:bg-primary-hover shadow-sm"
                    >
                      Book Smart Appointment <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
