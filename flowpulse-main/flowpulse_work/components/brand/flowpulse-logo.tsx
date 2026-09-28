'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FlowPulseLogoProps {
  variant?: 'full' | 'icon' | 'badge'
  theme?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
}

export function FlowPulseLogo({
  variant = 'full',
  theme = 'dark',
  size = 'md',
  href = '/',
  className,
}: FlowPulseLogoProps) {
  const isLight = theme === 'light'

  const iconSizes = {
    sm: 'size-7',
    md: 'size-9',
    lg: 'size-11',
  }

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 select-none group', className)}>
      {/* Dynamic Pulse Flow Mark */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
          iconSizes[size],
          isLight
            ? 'bg-white/10 text-white border border-white/20 shadow-xs'
            : 'bg-primary text-white shadow-sm',
        )}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-5/6"
        >
          {/* Background subtle flow grid / pulse waves */}
          <path
            d="M 4 16 H 9 L 12 7 L 16 25 L 20 11 L 23 16 H 28"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Connected Flow Node Dots */}
          <circle cx="12" cy="7" r="2.2" fill="#7C3AED" className="animate-pulse" />
          <circle cx="16" cy="25" r="2.2" fill="#60A5FA" />
          <circle cx="20" cy="11" r="2.2" fill="#34D399" />
        </svg>
      </div>

      {variant !== 'icon' && (
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={cn(
              'font-bold tracking-tight font-sans',
              textSizes[size],
              isLight ? 'text-white' : 'text-slate-900',
            )}
          >
            FlowPulse
          </span>
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider',
              isLight
                ? 'bg-[#7C3AED]/30 text-[#DDD6FE] border border-[#7C3AED]/40'
                : 'bg-primary-soft text-primary font-bold border border-primary/20',
            )}
          >
            AI
          </span>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
        {content}
      </Link>
    )
  }

  return content
}
