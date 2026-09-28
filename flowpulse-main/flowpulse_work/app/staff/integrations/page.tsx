'use client'

import React from 'react'
import {
  Activity,
  Cable,
  CheckCircle2,
  Database,
  Globe,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Webhook,
} from 'lucide-react'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import { DemoController } from '@/components/staff/demo-controller'

const CONNECTORS = [
  {
    name: 'Epic / Cerner EHR (FHIR R4)',
    type: 'EHR / Clinical Record',
    status: 'connected',
    latency: '42ms',
    throughput: '1,420 events/min',
    desc: 'Real-time patient check-in, provider notes, and clinical consultation orders.',
  },
  {
    name: 'ADT Master Feed (HL7 v2.5)',
    type: 'Admissions & Discharges',
    status: 'connected',
    latency: '18ms',
    throughput: '890 events/min',
    desc: 'Bed admissions, ward transfers, and discharge authorization signals.',
  },
  {
    name: 'Sunquest / Cerner Millennium LIS',
    type: 'Laboratory Information',
    status: 'connected',
    latency: '64ms',
    throughput: '2,100 tests/min',
    desc: 'Specimen barcode intake, analyzer hardware telemetry, and panel completion results.',
  },
  {
    name: 'GE Centricity RIS / PACS',
    type: 'Radiology System',
    status: 'connected',
    latency: '35ms',
    throughput: '410 studies/min',
    desc: 'CT, MRI, X-Ray exam queues and radiologist report signatures.',
  },
  {
    name: 'TeleTracking Bed Management',
    type: 'Capacity & Bed Sensors',
    status: 'connected',
    latency: '22ms',
    throughput: '340 status/min',
    desc: 'Bed sensor occupancy, EVS cleaning progress, and ready-for-occupancy signals.',
  },
  {
    name: 'Kronos / QGenda Staff Scheduler',
    type: 'Workforce Roster',
    status: 'connected',
    latency: '120ms',
    throughput: '12 syncs/hr',
    desc: 'Shift rosters, on-duty nurse-to-patient ratios, and physician coverage schedules.',
  },
]

export default function IntegrationsPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Demo Controls */}
      <DemoController />

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Cable className="size-3" /> System Interoperability
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Data Connectors & Telemetry Integrations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            FlowPulse ingests standards-compliant hospital feeds (HL7, FHIR R4, DICOM, ADT) into its real-time flow graph.
          </p>
        </div>
      </div>

      {/* Connectivity Health Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Active Connectors</span>
          <p className="mt-1 text-2xl font-bold text-foreground">6 / 6 Online</p>
          <span className="text-[11px] text-success font-medium">100% telemetry uptime</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Mean Ingest Latency</span>
          <p className="mt-1 text-2xl font-bold text-foreground">36 ms</p>
          <span className="text-[11px] text-muted-foreground">Sub-second stream processing</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Events Processed</span>
          <p className="mt-1 text-2xl font-bold text-primary">4.8M / 24h</p>
          <span className="text-[11px] text-muted-foreground">Zero dropped messages</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">ABDM / ABHA Ready</span>
          <p className="mt-1 text-2xl font-bold text-foreground">Compliant</p>
          <span className="text-[11px] text-success font-medium">Standardized FHIR schemas</span>
        </div>
      </div>

      {/* Connectors Catalog */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONNECTORS.map((c) => (
          <div
            key={c.name}
            className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {c.type}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success">
                  <span className="size-2 rounded-full bg-success" /> Online
                </span>
              </div>

              <h3 className="mt-3 text-base font-bold text-foreground">{c.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {c.desc}
              </p>
            </div>

            <div className="mt-5 border-t border-border/60 pt-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>Latency:</span>
                <span className="font-mono font-semibold text-foreground">{c.latency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Throughput:</span>
                <span className="font-mono font-semibold text-foreground">{c.throughput}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
