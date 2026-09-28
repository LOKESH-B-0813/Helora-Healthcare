'use client'

import React, { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from 'reactflow'
import { cn } from '@/lib/utils'

export interface FlowEdgeData {
  volume?: number
  avgMinutes?: number
  isBottleneckPath?: boolean
}

function FlowEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<FlowEdgeData>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  })

  const isBottleneck = data?.isBottleneckPath

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isBottleneck ? '#ef4444' : '#94a3b8',
          strokeWidth: isBottleneck ? 2.5 : 1.5,
          strokeDasharray: isBottleneck ? '5 5' : undefined,
          transition: 'all 0.3s ease',
        }}
      />

      {data?.volume && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={cn(
              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold backdrop-blur-xs transition-colors',
              isBottleneck
                ? 'border-critical/40 bg-critical-muted text-critical shadow-xs'
                : 'border-border/80 bg-background/90 text-muted-foreground shadow-xs',
            )}
          >
            <span>{data.volume} pts</span>
            {data.avgMinutes && (
              <span className="opacity-70">· {data.avgMinutes}m</span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const FlowEdgeMemo = memo(FlowEdgeComponent)
