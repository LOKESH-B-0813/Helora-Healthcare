'use client'

import React, { useMemo, useRef, useState, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react'
import { FlowNodeMemo, type FlowNodeData } from './flow-node'
import { FlowEdgeMemo, type FlowEdgeData } from './flow-edge'
import { useFlowPulse } from '@/components/providers/flowpulse-provider'
import type { DepartmentId, FlowStageId } from '@/lib/data/types'
import { cn } from '@/lib/utils'

// Map flow stage IDs to corresponding department IDs
const STAGE_TO_DEPT: Record<FlowStageId, DepartmentId> = {
  registration: 'general-opd',
  emergency: 'emergency',
  opd: 'general-opd',
  consultation: 'cardiology',
  laboratory: 'laboratory',
  radiology: 'radiology',
  review: 'cardiology',
  ward: 'ward-a',
  icu: 'icu',
  pharmacy: 'pharmacy',
  discharge: 'discharge',
}

const STAGE_CODES: Record<FlowStageId, string> = {
  registration: 'REG',
  emergency: 'ED',
  opd: 'OPD',
  consultation: 'CONS',
  laboratory: 'LAB',
  radiology: 'RAD',
  review: 'REV',
  ward: 'WARD',
  icu: 'ICU',
  pharmacy: 'RX',
  discharge: 'DC',
}

// Optimized, high-visibility 7-Column Stage Layout (Width: ~1780px, Height: ~460px)
const STAGE_POSITIONS: Record<FlowStageId, { x: number; y: number }> = {
  registration: { x: 30, y: 190 },
  emergency: { x: 320, y: 30 },
  opd: { x: 320, y: 350 },
  consultation: { x: 610, y: 350 },
  laboratory: { x: 900, y: 50 },
  radiology: { x: 900, y: 350 },
  review: { x: 1190, y: 190 },
  icu: { x: 1480, y: 30 },
  pharmacy: { x: 1480, y: 190 },
  ward: { x: 1480, y: 350 },
  discharge: { x: 1770, y: 190 },
}

const nodeTypes = {
  flowNode: FlowNodeMemo,
}

const edgeTypes = {
  flowEdge: FlowEdgeMemo,
}

function FlowCanvasInner({
  onSelectDepartment,
  selectedDepartmentId,
  isExpanded,
  onToggleExpand,
}: {
  onSelectDepartment?: (deptId: DepartmentId) => void
  selectedDepartmentId?: DepartmentId | null
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  const { state } = useFlowPulse()
  const reactFlowInstance = useReactFlow()

  const isLabFailure =
    state.activeScenario === 'lab-analyzer-failure' && state.scenarioPhase >= 2 && state.scenarioPhase < 5

  // Convert state nodes to React Flow nodes
  const nodes: Node<FlowNodeData>[] = useMemo(() => {
    return state.flowGraph.nodes.map((node) => {
      const deptId = STAGE_TO_DEPT[node.id]
      const dept = state.departments.find((d) => d.id === deptId)
      const isSelected = selectedDepartmentId === deptId

      const isEmergencyFutureRisk = isLabFailure && node.id === 'emergency'

      return {
        id: node.id,
        type: 'flowNode',
        position: STAGE_POSITIONS[node.id] || { x: 100, y: 100 },
        selected: isSelected,
        data: {
          id: node.id,
          label: node.label,
          code: STAGE_CODES[node.id] || node.id.toUpperCase(),
          count: node.count,
          capacity: dept?.capacity,
          utilization: dept?.utilization,
          avgWaitMinutes: dept?.avgWaitMinutes,
          status: node.status,
          futureRisk: isEmergencyFutureRisk ? 'HIGH RISK (+25m wait)' : undefined,
          futureRiskTone: isEmergencyFutureRisk ? 'purple' : undefined,
          onClick: () => {
            if (onSelectDepartment && deptId) {
              onSelectDepartment(deptId)
            }
          },
        },
      }
    })
  }, [state.flowGraph.nodes, state.departments, selectedDepartmentId, onSelectDepartment, isLabFailure])

  // Convert state edges to React Flow edges
  const edges: Edge<FlowEdgeData>[] = useMemo(() => {
    return state.flowGraph.edges.map((edge) => {
      const isLabPath =
        isLabFailure &&
        (edge.from === 'laboratory' ||
          edge.to === 'laboratory' ||
          (edge.from === 'review' && edge.to === 'discharge') ||
          (edge.from === 'ward' && edge.to === 'discharge'))

      return {
        id: edge.id,
        source: edge.from,
        target: edge.to,
        type: 'flowEdge',
        animated: true,
        data: {
          volume: edge.volume,
          avgMinutes: edge.avgMinutes,
          isBottleneckPath: isLabPath,
        },
      }
    })
  }, [state.flowGraph.edges, isLabFailure])

  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn({ duration: 300 })
  }, [reactFlowInstance])

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut({ duration: 300 })
  }, [reactFlowInstance])

  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.08, duration: 400 })
  }, [reactFlowInstance])

  const handleResetZoom = useCallback(() => {
    reactFlowInstance.setViewport({ x: 50, y: 40, zoom: 0.95 }, { duration: 400 })
  }, [reactFlowInstance])

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-3xl border border-border bg-slate-50/50 shadow-sm transition-all duration-300 dark:bg-card',
        isExpanded ? 'h-[750px] shadow-2xl' : 'h-[620px]',
      )}
    >
      {/* Quick Action Canvas Header Controls */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-2xl border border-border/80 bg-background/95 p-1.5 shadow-md backdrop-blur-md">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          className="flex size-8 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 hover:text-foreground active:scale-95"
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="flex size-8 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 hover:text-foreground active:scale-95"
        >
          <ZoomOut className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleFitView}
          title="Fit to Screen"
          className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-foreground active:scale-95"
        >
          <RotateCcw className="size-3.5" />
          <span className="hidden sm:inline">Fit</span>
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          title="100% Zoom Scale"
          className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold text-primary hover:bg-primary/10 active:scale-95"
        >
          <span>100%</span>
        </button>
        <div className="h-4 w-px bg-border mx-0.5" />
        <button
          type="button"
          onClick={onToggleExpand}
          title={isExpanded ? 'Collapse Map' : 'Expand Full Height'}
          className="flex size-8 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
        >
          {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.08, minZoom: 0.65, maxZoom: 1.15 }}
        minZoom={0.4}
        maxZoom={2.0}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.8} color="#94a3b8" />
        <Controls
          showInteractive={false}
          className="!hidden !border-border !bg-background/90 !shadow-sm fill-foreground text-foreground"
        />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            const data = node.data as FlowNodeData
            if (data?.status === 'critical') return '#ef4444'
            if (data?.status === 'warning') return '#f59e0b'
            return '#10b981'
          }}
          className="!hidden !border-border !bg-background/90 !rounded-2xl !shadow-md lg:!block"
        />
      </ReactFlow>

      {/* Floating High-Contrast Legend */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-3.5 rounded-2xl border border-border bg-background/95 px-4 py-2.5 text-xs font-bold shadow-md backdrop-blur-md">
        <span className="flex items-center gap-1.5 text-slate-800">
          <span className="size-2.5 rounded-full bg-emerald-500 shadow-xs" /> Healthy
        </span>
        <span className="flex items-center gap-1.5 text-slate-800">
          <span className="size-2.5 rounded-full bg-amber-500 shadow-xs" /> Warning
        </span>
        <span className="flex items-center gap-1.5 text-red-600 font-extrabold">
          <span className="size-2.5 rounded-full bg-critical shadow-xs animate-ping" /> Critical (Red)
        </span>
        <span className="flex items-center gap-1.5 text-purple-700 font-black">
          <span className="size-2.5 rounded-full bg-purple-600 shadow-xs" /> +120m Prediction (Purple)
        </span>
      </div>
    </div>
  )
}

export function HospitalFlowCanvas(props: {
  onSelectDepartment?: (deptId: DepartmentId) => void
  selectedDepartmentId?: DepartmentId | null
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <ReactFlowProvider>
      <FlowCanvasInner
        {...props}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded((prev) => !prev)}
      />
    </ReactFlowProvider>
  )
}
