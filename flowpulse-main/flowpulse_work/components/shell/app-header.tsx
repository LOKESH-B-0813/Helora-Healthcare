'use client'

import { useState, useMemo, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Menu,
  Bell,
  Search,
  ChevronsUpDown,
  Settings,
  User,
  LifeBuoy,
  LogOut,
  Building2,
  Users,
  X,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { findNavItem } from '@/lib/nav'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { HospitalSelector } from '@/components/shell/hospital-selector'
import { LiveIndicator } from '@/components/shell/live-indicator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'

const toneDot: Record<string, string> = {
  critical: 'bg-critical',
  warning: 'bg-warning',
  healthy: 'bg-success',
  neutral: 'bg-muted-foreground',
}

export function AppHeader({ onOpenMobile }: { onOpenMobile?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const active = findNavItem(pathname)
  const { state, markAlertRead, markAllAlertsRead } = useFlowPulse()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const notifications = state.notifications
  const unreadCount = notifications.filter((n) => !n.read).length

  // Quick Command Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()

    const depts = state.departments
      .filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
      .map((d) => ({
        type: 'Department',
        title: d.name,
        subtitle: `${d.code} · ${d.utilization}% load`,
        href: '/staff/departments',
        icon: Building2,
      }))

    const patients = state.patients
      .filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      .map((p) => ({
        type: 'Patient',
        title: p.name,
        subtitle: `${p.id} · ${p.currentDepartment} (${p.status})`,
        href: '/staff/patient-flow',
        icon: User,
      }))

    const staffList = state.staff
      .filter((s) => s.name.toLowerCase().includes(q) || s.qualification.toLowerCase().includes(q))
      .map((s) => ({
        type: 'Staff',
        title: s.name,
        subtitle: `${s.qualification} · ${s.department}`,
        href: '/staff/staff-operations',
        icon: Users,
      }))

    return [...depts, ...patients, ...staffList].slice(0, 8)
  }, [searchQuery, state])

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open navigation"
          className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="size-5" />
        </button>

        {/* Page title */}
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
            {active?.title ?? 'FlowPulse AI'}
          </h1>
          <p className="hidden truncate text-xs text-muted-foreground md:block">
            {active?.description ?? 'Predictive hospital flow intelligence'}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <HospitalSelector />
          </div>

          <Separator orientation="vertical" className="hidden h-8 md:block" />

          <LiveIndicator className="hidden sm:flex" />

          <Separator orientation="vertical" className="hidden h-8 sm:block" />

          {/* Search Button */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Search className="size-[18px]" />
          </button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Notifications"
              className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[popup-open]:bg-muted data-[popup-open]:text-foreground"
            >
              <Bell className="size-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-critical opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-critical ring-2 ring-background" />
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-sm font-semibold text-foreground">Operational Alerts</span>
                {unreadCount > 0 ? (
                  <span className="rounded-full bg-critical-muted px-1.5 py-0.5 text-[10px] font-semibold text-critical">
                    {unreadCount} new
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">All cleared</span>
                )}
              </div>
              <Separator />
              <DropdownMenuGroup className="max-h-72 overflow-y-auto p-1">
                {notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => markAlertRead(n.id)}
                    className={cn(
                      'flex items-start gap-2.5 px-2 py-2 cursor-pointer',
                      !n.read && 'bg-muted/40 font-medium',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        toneDot[n.tone] || 'bg-primary',
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-foreground">
                          {n.title}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {n.time}
                        </span>
                      </span>
                      <span className="text-[11px] text-muted-foreground leading-tight">
                        {n.detail}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <Separator />
              <div className="p-1">
                <button
                  type="button"
                  onClick={markAllAlertsRead}
                  className="w-full rounded-md py-1.5 text-center text-xs font-semibold text-primary hover:bg-muted"
                >
                  Mark all as read
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1 pr-1.5 transition-colors hover:bg-muted data-[popup-open]:bg-muted">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  DR
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start leading-none lg:flex">
                <span className="text-xs font-semibold text-foreground">Dr. Reyes</span>
                <span className="text-[10px] text-muted-foreground">Flow Administrator</span>
              </div>
              <ChevronsUpDown className="hidden size-3.5 text-muted-foreground lg:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5 py-1.5">
                <span className="text-sm font-semibold text-foreground">Dr. Ana Reyes</span>
                <span className="text-xs font-normal text-muted-foreground">
                  ana.reyes@metrogen.health
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push('/staff/staff-operations')}>
                  <User />
                  Profile / Workforce
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/staff/settings')}>
                  <Settings />
                  Preferences & Thresholds
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/about')}>
                  <LifeBuoy />
                  Support & Platform Story
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/')}>
                <LogOut />
                Return to Patient Portal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Quick Search Modal Palette */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-20 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="size-4 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Search patient, department, or staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((item, idx) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={idx}
                        href={item.href}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between rounded-xl p-2.5 text-xs transition-colors hover:bg-muted"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                            <Icon className="size-3.5" />
                          </span>
                          <div className="min-w-0 truncate">
                            <p className="font-bold text-foreground truncate">{item.title}</p>
                            <span className="text-[11px] text-muted-foreground truncate">{item.subtitle}</span>
                          </div>
                        </div>
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                          {item.type}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              ) : searchQuery ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No matching patients, departments, or staff found for "{searchQuery}".
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Quick Jumps</p>
                  <p className="mt-1 text-[11px]">Type a patient name (e.g. "Arjun"), department ("Lab"), or staff ("Verma").</p>
                </div>
              )}
            </div>

            <div className="border-t border-border bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Press ESC to close</span>
              <span>FlowPulse Quick Command</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
