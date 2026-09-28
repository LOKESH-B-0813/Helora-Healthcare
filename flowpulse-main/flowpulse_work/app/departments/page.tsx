'use client'

import React from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  Clock,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react'
import { PublicHeader } from '@/components/public/public-header'
import { PublicFooter } from '@/components/public/public-footer'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { IMAGES } from '@/lib/data/images'

export default function DepartmentsPage() {
  const { state } = useFlowPulse()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <PublicHeader />

      <main className="mx-auto max-w-[1480px] px-5 py-12 sm:px-8 lg:px-12 lg:py-20">
        {/* Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            CLINICAL DIRECTORY
          </span>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-900">
            Specialist Care, with Live Operational Clarity.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Every clinical department is integrated into the FlowPulse live telemetry network. Patient-facing wait times reflect actual capacity and dynamic handoffs across our campus.
          </p>
        </div>

        {/* Department Cards Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {state.departments.map((dept) => (
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
                    {dept.avgWaitMinutes > 0 ? `${dept.avgWaitMinutes} min wait` : 'Inpatient Ward'}
                  </div>
                </div>

                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-900">{dept.name}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {dept.description || 'Comprehensive medical services with coordinated diagnostics and linked patient handoffs.'}
                  </p>

                  {/* Medical Tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(dept.specialties || ['Care', 'Diagnostics', 'Consultation']).map((tag) => (
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
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Users className="size-3.5" /> {dept.staffOnDuty} Staff On Duty
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
      </main>

      <PublicFooter />
    </div>
  )
}
