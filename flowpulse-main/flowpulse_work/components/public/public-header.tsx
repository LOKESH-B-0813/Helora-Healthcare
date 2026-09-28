'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, PhoneCall, Sparkles, Menu, X, ShieldCheck } from 'lucide-react'
import { FlowPulseLogo } from '@/components/brand/flowpulse-logo'
import { LanguageSelector } from '@/components/ui/language-selector'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/departments', label: 'Departments' },
  { href: '/doctors', label: 'Doctors' },
  { href: '/campus-map', label: 'Hospital Map' },
  { href: '/book-appointment', label: 'Book Appointment' },
]

export function PublicHeader() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Top micro-banner for 24/7 Emergency & Operational Status */}
      <div className="bg-slate-900 text-slate-300 text-[11px] font-medium py-1.5 px-5 sm:px-8 border-b border-slate-800 hidden md:block">
        <div className="mx-auto max-w-[1480px] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Hospital Flow: Operational & Synchronized
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">
              Metro General Hospital, Outer Ring Road, Bengaluru
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold tracking-wider">
              <PhoneCall className="size-3" /> 24/7 Emergency: +91 1800 FLOWCARE (Demo)
            </span>
            <span className="text-slate-500">|</span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <ShieldCheck className="size-3.5 text-primary" /> Interoperability Ready
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-200 border-b',
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-xs border-slate-200/80 py-3'
            : 'bg-white/80 backdrop-blur-md border-slate-200/60 py-4',
        )}
      >
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
          {/* FlowPulse Brand Logo */}
          <FlowPulseLogo variant="full" theme="dark" size="md" href="/" />

          {/* Center Navigation Links */}
          <nav className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/80 px-4 py-1.5 shadow-2xs lg:flex">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right Utilities */}
          <div className="hidden items-center gap-3 lg:flex">
            {/* Language Selector */}
            <LanguageSelector />

            <Link
              href="/track-visit"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-xs transition hover:bg-slate-50 hover:border-slate-300"
            >
              Track My Visit
            </Link>
            <Link
              href="/book-appointment"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-primary-hover"
            >
              Book Appointment <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/staff"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              <Sparkles className="size-3 text-purple-400 animate-pulse" /> Staff Portal
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-800 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {open && (
          <div className="border-t border-slate-200 bg-white px-5 py-5 lg:hidden animate-in slide-in-from-top-2 duration-150">
            <div className="mx-auto grid max-w-[1480px] gap-2">
              <div className="mb-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center justify-between">
                <span>24/7 Emergency Trauma Bay</span>
                <span className="font-mono text-[11px]">+91 1800 FLOWCARE</span>
              </div>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-xl px-4 py-3 text-sm font-semibold transition',
                    pathname === link.href
                      ? 'bg-primary text-white'
                      : 'text-slate-800 hover:bg-slate-100',
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 grid gap-2 border-t border-slate-200 pt-3">
                <Link
                  href="/book-appointment"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Book Smart Appointment
                </Link>
                <Link
                  href="/track-visit"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-800"
                >
                  Track My Visit
                </Link>
                <Link
                  href="/staff"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Staff Command Center
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
