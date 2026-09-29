import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { THEME } from '../../lib/constants/theme'
import type { DemoScenarioMode } from '../../lib/types'
import { Badge } from '../ui/Badge'
import { StatusDot } from '../ui/StatusDot'

interface HospitalFlowCardProps {
  scenarioMode?: DemoScenarioMode
}

export const HospitalFlowCard: React.FC<HospitalFlowCardProps> = ({
  scenarioMode = 'NORMAL',
}) => {
  const isIncident = scenarioMode === 'LAB_INCIDENT'
  const isRecovered = scenarioMode === 'STAFF_RECOVERY'

  const labWait = isIncident ? '34 min' : isRecovered ? '20 min' : '14 min'
  const labTone = isIncident ? 'warning' : 'healthy'

  const flowStatus = isIncident ? 'Elevated' : 'Moderate'
  const flowTone = isIncident ? 'warning' : 'healthy'

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>TODAY AT THE HOSPITAL</Text>
        <Badge
          label={`● ${flowStatus}`}
          tone={flowTone}
          size="sm"
        />
      </View>

      <View style={styles.grid}>
        {/* Cardiology */}
        <View style={styles.deptBox}>
          <Text style={styles.deptName}>Cardiology</Text>
          <Text style={styles.deptWait}>18 min</Text>
          <View style={styles.statusRow}>
            <StatusDot tone="healthy" size={6} />
            <Text style={styles.statusLabel}>Normal flow</Text>
          </View>
        </View>

        {/* Laboratory */}
        <View style={[styles.deptBox, isIncident && styles.deptBoxWarning]}>
          <Text style={styles.deptName}>Laboratory</Text>
          <Text style={[styles.deptWait, isIncident && { color: THEME.colors.warningDark }]}>
            {labWait}
          </Text>
          <View style={styles.statusRow}>
            <StatusDot tone={labTone} size={6} pulsing={isIncident} />
            <Text style={[styles.statusLabel, isIncident && { color: THEME.colors.warningDark, fontWeight: '700' }]}>
              {isIncident ? 'High wait' : isRecovered ? 'Recovering' : 'Normal flow'}
            </Text>
          </View>
        </View>

        {/* Radiology */}
        <View style={styles.deptBox}>
          <Text style={styles.deptName}>Radiology</Text>
          <Text style={styles.deptWait}>11 min</Text>
          <View style={styles.statusRow}>
            <StatusDot tone="healthy" size={6} />
            <Text style={styles.statusLabel}>Normal flow</Text>
          </View>
        </View>
      </View>

      {isIncident && (
        <View style={styles.alertNotice}>
          <Text style={styles.alertText}>
            ⚠️ Diagnostic Lab analyzer maintenance active. Visit estimates include current queue backlog.
          </Text>
        </View>
      )}

      {isRecovered && (
        <View style={styles.recoveryNotice}>
          <Text style={styles.recoveryText}>
            ✓ Backup analyzer online. Laboratory wait times improving rapidly.
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  title: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  deptBox: {
    flex: 1,
    backgroundColor: THEME.colors.slate50,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
  },
  deptBoxWarning: {
    backgroundColor: THEME.colors.warningSubtle,
    borderColor: THEME.colors.warningBorder,
  },
  deptName: {
    fontSize: 11,
    fontWeight: THEME.typography.weights.semibold,
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  deptWait: {
    fontSize: THEME.typography.sizes.lg,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  alertNotice: {
    backgroundColor: THEME.colors.warningSubtle,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.warningBorder,
  },
  alertText: {
    fontSize: 11,
    color: THEME.colors.warningDark,
    fontWeight: '600',
  },
  recoveryNotice: {
    backgroundColor: THEME.colors.healthySubtle,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.healthyBorder,
  },
  recoveryText: {
    fontSize: 11,
    color: THEME.colors.healthyDark,
    fontWeight: '600',
  },
})
