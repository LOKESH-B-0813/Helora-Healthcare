import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { THEME } from '../../lib/constants/theme'
import type { CareStage } from '../../lib/types'
import { Badge } from '../ui/Badge'

interface TimelineStageItemProps {
  stage: CareStage
  isLast?: boolean
}

export const TimelineStageItem: React.FC<TimelineStageItemProps> = ({
  stage,
  isLast = false,
}) => {
  const isCompleted = stage.status === 'completed'
  const isCurrent = stage.status === 'in-progress'
  const isUpcoming = stage.status === 'upcoming'

  const getNodeStyle = () => {
    if (isCompleted) {
      return { bg: THEME.colors.healthy, border: THEME.colors.healthyDark, symbol: '✓' }
    }
    if (isCurrent) {
      return { bg: THEME.colors.primary, border: THEME.colors.primaryLight, symbol: '●' }
    }
    return { bg: THEME.colors.slate100, border: THEME.colors.slate300, symbol: '○' }
  }

  const node = getNodeStyle()

  return (
    <View style={styles.container}>
      {/* Left Column: Icon Node & Vertical Connector Line */}
      <View style={styles.leftCol}>
        <View
          style={[
            styles.nodeCircle,
            { backgroundColor: node.bg, borderColor: node.border },
            isCurrent && styles.nodeCurrentPulsing,
          ]}
        >
          <Text
            style={[
              styles.nodeSymbol,
              isCompleted && styles.nodeSymbolCompleted,
              isCurrent && styles.nodeSymbolCurrent,
              isUpcoming && styles.nodeSymbolUpcoming,
            ]}
          >
            {node.symbol}
          </Text>
        </View>

        {!isLast && (
          <View
            style={[
              styles.connectorLine,
              isCompleted ? styles.connectorCompleted : styles.connectorUpcoming,
            ]}
          />
        )}
      </View>

      {/* Right Column: Stage Content Card */}
      <View
        style={[
          styles.contentCard,
          isCurrent && styles.contentCardCurrent,
          THEME.shadows.subtle,
        ]}
      >
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.stageName,
              isCurrent && styles.stageNameCurrent,
              isCompleted && styles.stageNameCompleted,
            ]}
          >
            {stage.name}
          </Text>

          {isCurrent && <Badge label="CURRENT" tone="healthy" size="sm" />}
          {stage.badgeLabel && (
            <Badge
              label={stage.badgeLabel}
              tone={stage.badgeTone || 'warning'}
              size="sm"
            />
          )}
        </View>

        {/* Expected Time & Location */}
        <View style={styles.metaRow}>
          <Text style={styles.timeText}>
            {isCompleted ? `Completed: ${stage.actualOrEstimatedTime}` : `Expected: ${stage.actualOrEstimatedTime}`}
          </Text>
          {stage.waitMinutes !== undefined && stage.waitMinutes > 0 && (
            <Text style={[styles.waitText, stage.badgeTone === 'warning' && { color: THEME.colors.warningDark, fontWeight: '700' }]}>
              • Wait ~{stage.waitMinutes}m
            </Text>
          )}
        </View>

        {stage.location && (
          <Text style={styles.locationText}>📍 {stage.location}</Text>
        )}

        {stage.note && (
          <Text style={styles.noteText}>{stage.note}</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.sm,
  },
  leftCol: {
    alignItems: 'center',
    width: 36,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeCurrentPulsing: {
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  nodeSymbol: {
    fontSize: 12,
    fontWeight: '800',
  },
  nodeSymbolCompleted: {
    color: '#FFFFFF',
  },
  nodeSymbolCurrent: {
    color: '#FFFFFF',
  },
  nodeSymbolUpcoming: {
    color: THEME.colors.slate400,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  connectorCompleted: {
    backgroundColor: THEME.colors.healthy,
  },
  connectorUpcoming: {
    backgroundColor: THEME.colors.slate200,
  },
  contentCard: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.md,
    marginLeft: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  contentCardCurrent: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primarySubtle,
    borderWidth: 1.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stageName: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
    flex: 1,
  },
  stageNameCurrent: {
    color: THEME.colors.primaryDark,
  },
  stageNameCompleted: {
    color: THEME.colors.slate700,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: THEME.typography.weights.semibold,
    color: THEME.colors.textSecondary,
  },
  waitText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginLeft: 4,
  },
  locationText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  noteText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
})
