'use client'

import React, { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { SupportedLanguage } from '@/lib/i18n/translations'

const LANGUAGES: { code: SupportedLanguage; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिंदी' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
]

export function LanguageSelector() {
  const [lang, setLang] = useState<SupportedLanguage>('en')

  useEffect(() => {
    const saved = localStorage.getItem('flowpulse_language') as SupportedLanguage
    if (saved && ['en', 'hi', 'kn', 'ta'].includes(saved)) {
      setLang(saved)
    }
  }, [])

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLang(newLang)
    localStorage.setItem('flowpulse_language', newLang)
    window.dispatchEvent(new CustomEvent('flowpulse-language-changed', { detail: newLang }))
  }

  return (
    <div className="relative inline-flex items-center">
      <span className="pointer-events-none absolute left-2.5 flex items-center text-slate-500">
        <Globe className="size-3.5" />
      </span>
      <select
        value={lang}
        onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
        className="h-8 rounded-full border border-slate-200 bg-white pl-8 pr-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-slate-300 focus:border-primary focus:outline-hidden"
        aria-label="Select Language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeName} ({l.label})
          </option>
        ))}
      </select>
    </div>
  )
}
