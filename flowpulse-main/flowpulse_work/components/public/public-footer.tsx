'use client'

import React from 'react'
import Link from 'next/link'
import { Activity, ArrowUpRight, Heart, Sparkles } from 'lucide-react'

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card text-foreground">
      <div className="mx-auto max-w-[1480px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="space-y-4 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <Activity className="size-5" />
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground">
                FlowPulse AI
              </span>
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              Predictive Hospital Flow Intelligence & Counterfactual Operations Platform. Reducing waiting chaos and preventing downstream congestion through connected flow networks.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary">
              <Sparkles className="size-3" /> "Don't manage the queue. Prevent the ripple."
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Public Portal
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground">
                  About Platform
                </Link>
              </li>
              <li>
                <Link href="/departments" className="hover:text-foreground">
                  Department Directory
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="hover:text-foreground">
                  Specialist Doctors
                </Link>
              </li>
              <li>
                <Link href="/book-appointment" className="hover:text-foreground">
                  Smart Appointment
                </Link>
              </li>
              <li>
                <Link href="/track-visit" className="hover:text-foreground">
                  Track My Visit
                </Link>
              </li>
            </ul>
          </div>

          {/* Staff Operations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Operations
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/staff" className="hover:text-foreground">
                  Command Center
                </Link>
              </li>
              <li>
                <Link href="/staff/ripple-analysis" className="hover:text-foreground">
                  Ripple Analysis
                </Link>
              </li>
              <li>
                <Link href="/staff/scenario-simulator" className="hover:text-foreground">
                  Scenario Simulator
                </Link>
              </li>
              <li>
                <Link href="/staff/patient-flow" className="hover:text-foreground">
                  Patient Flow Pipeline
                </Link>
              </li>
              <li>
                <Link href="/staff/beds-capacity" className="hover:text-foreground">
                  Beds & Capacity
                </Link>
              </li>
              <li>
                <Link href="/staff/analytics" className="hover:text-foreground">
                  Operational Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Governance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Governance
            </h4>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              FlowPulse is an operational decision support system. Clinical diagnoses and medical decisions remain strictly with authorized healthcare professionals.
            </p>
            <div className="mt-4 text-[11px] text-muted-foreground font-mono">
              ABDM / FHIR R4 Compliant
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground">
          <p>© 2026 FlowPulse AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/staff" className="text-primary hover:underline">
              Enter Staff Command Center →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
