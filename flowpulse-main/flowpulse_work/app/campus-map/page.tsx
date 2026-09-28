'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Compass, Hospital, MapPin, Sparkles } from 'lucide-react'
import { PublicHeader } from '@/components/public/public-header'
import { PublicFooter } from '@/components/public/public-footer'
import { HospitalLocationTracker } from '@/components/location/hospital-location-tracker'

export default function CampusMapPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <PublicHeader />

      <main className="mx-auto max-w-[1480px] px-5 py-10 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 uppercase tracking-wider mb-6"
        >
          <ArrowLeft className="size-4" /> Back to Hospital Home
        </Link>

        {/* Header Title */}
        <div className="max-w-3xl mb-8">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
            <Compass className="size-3.5 text-primary" /> HOSPITAL LOCATION TRACKER & CAMPUS WAYFINDING
          </span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-900">
            Interactive Campus Navigator & Indoor GPS
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Locate hospital wings, floors, diagnostic rooms, and consultation suites across all FlowPulse network facilities with live step-by-step indoor wayfinding.
          </p>
        </div>

        {/* Location Tracker Component */}
        <HospitalLocationTracker
          initialHospitalId="metro-general"
          currentDepartmentId="cardiology"
          destinationDepartmentId="laboratory"
          patientName="Arjun Kumar"
        />
      </main>

      <PublicFooter />
    </div>
  )
}
