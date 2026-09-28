'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function LiveIndicator({ className }: { className?: string }) {
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    setLastSync(new Date())
    const interval = setInterval(() => setLastSync(new Date()), 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-1.5 rounded-full border border-success/25 bg-success-muted px-2 py-0.5">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-success" />
        </span>
        <span className="text-[11px] font-semibold tracking-wide text-success">
          LIVE
        </span>
      </div>
      <div className="hidden flex-col leading-none lg:flex">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Synced
        </span>
        <span className="font-mono text-xs text-foreground tabular-nums">
          {lastSync ? formatTime(lastSync) : '--:--:--'}
        </span>
      </div>
    </div>
  )
}
