'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, PanelLeftClose, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navSections, findNavItem } from '@/lib/nav'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'

function BrandMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Activity className="size-5" strokeWidth={2.5} />
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight text-sidebar-accent-foreground">
            FlowPulse AI
          </span>
          <span className="text-[11px] font-medium text-sidebar-foreground/70">
            Flow Intelligence
          </span>
        </div>
      )}
    </div>
  )
}

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const active = findNavItem(pathname)
  const { state } = useFlowPulse()

  const isLabFailure =
    state.activeScenario === 'lab-analyzer-failure' &&
    state.scenarioPhase >= 1 &&
    state.scenarioPhase < 5
  const isRecovered =
    state.activeScenario === 'lab-analyzer-failure' &&
    (state.scenarioPhase >= 5 || state.approvedIntervention !== null)

  const statusLabel = isLabFailure
    ? '1 critical issue active'
    : isRecovered
      ? 'System recovery active'
      : 'All systems nominal'

  const statusSubtext = isLabFailure
    ? 'Laboratory bottleneck'
    : isRecovered
      ? 'Backup analyzer online'
      : '12 data sources online'

  const dotColor = isLabFailure ? 'bg-critical' : isRecovered ? 'bg-emerald-400' : 'bg-success'

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div
        className={cn(
          'flex h-16 items-center border-b border-sidebar-border px-4',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        <BrandMark collapsed={collapsed} />
        {onToggleCollapse && !collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            className="hidden size-7 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:flex"
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-6">
          {navSections.map((section) => (
            <div key={section.label} className="flex flex-col gap-1">
              {!collapsed && (
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = active?.href === item.href
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary" />
                    )}
                    <item.icon
                      className={cn(
                        'size-[18px] shrink-0 transition-colors',
                        isActive
                          ? 'text-sidebar-primary'
                          : 'text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground',
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                )

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger render={link} />
                      <TooltipContent side="right" sideOffset={8}>
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  )
                }
                return link
              })}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        {collapsed ? (
          onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              className="flex w-full items-center justify-center rounded-lg py-2 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <PanelLeft className="size-4" />
            </button>
          )
        ) : (
          <div className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
            <span className="relative flex size-2">
              <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', dotColor)} />
              <span className={cn('relative inline-flex size-2 rounded-full', dotColor)} />
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-medium text-sidebar-accent-foreground">
                {statusLabel}
              </span>
              <span className="text-[10px] text-sidebar-foreground/60">
                {statusSubtext}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
