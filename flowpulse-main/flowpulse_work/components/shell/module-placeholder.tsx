import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageContainer, PageHeading } from '@/components/shell/page-container'

export type Capability = {
  icon: LucideIcon
  title: string
  description: string
}

export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
  capabilities,
}: {
  title: string
  description: string
  icon: LucideIcon
  capabilities: Capability[]
}) {
  return (
    <PageContainer>
      <PageHeading
        title={title}
        description={description}
        actions={
          <>
            <Button variant="outline" size="sm" disabled>
              Configure
            </Button>
            <Button size="sm" disabled>
              <Sparkles data-icon="inline-start" />
              Run analysis
            </Button>
          </>
        }
      />

      {/* Hero placeholder panel */}
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-5 px-6 py-14 text-center">
          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-8" strokeWidth={1.75} />
            <span className="absolute -right-1 -top-1 flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-3 rounded-full bg-primary" />
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <span className="size-1.5 rounded-full bg-warning" />
              Module in development
            </Badge>
            <h3 className="max-w-md text-lg font-semibold tracking-tight text-foreground text-balance">
              {title} is being wired into the flow engine
            </h3>
            <p className="max-w-lg text-sm text-muted-foreground text-pretty">
              The design system and application shell are ready. This module will
              plug into the shared layout, live data feeds, and prediction pipeline
              as it comes online.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Planned capabilities */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Planned capabilities</h3>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Product roadmap
            <ArrowUpRight className="size-3.5" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {capabilities.map((cap) => (
            <Card key={cap.title} className="transition-colors hover:border-primary/30">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <cap.icon className="size-[18px]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground">{cap.title}</p>
                  <p className="text-xs text-muted-foreground text-pretty">
                    {cap.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
