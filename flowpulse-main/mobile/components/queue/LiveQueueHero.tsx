import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { THEME } from '../../lib/constants/theme'
import type { PatientLiveQueue } from '../../lib/types'
import { Badge } from '../ui/Badge'
import { StatusDot } from '../ui/StatusDot'

interface LiveQueueHeroProps {
  queue: PatientLiveQueue
}

export const LiveQueueHero: React.FC<LiveQueueHeroProps> = ({ queue }) => {
  const isNowServing = queue.myPosition <= 1
  const isNext = queue.myPosition === 2

  return (
    <View style={styles.card}>
      {/* Header Clinic & Token */}
      <View style={styles.header}>
        <View>
          <Text style={styles.clinicName}>{queue.departmentName}</Text>
          <Text style={styles.doctorName}>{queue.doctorName}</Text>
        </View>
        <View style={styles.tokenBadge}>
          <Text style={styles.tokenLabel}>YOUR TOKEN</Text>
          <Text style={styles.tokenValue}>{queue.myToken}</Text>
        </View>
      </View>

      {/* Large Center Queue Metric */}
      <View style={styles.centerMetricContainer}>
        <Text style={styles.queueLabel}>
          {isNowServing ? 'YOUR STATUS' : 'QUEUE POSITION'}
        </Text>
        <Text
          style={[
            styles.queueLargeNumber,
            isNowServing && { color: THEME.colors.healthyDark, fontSize: 36 },
          ]}
        >
          {isNowServing ? 'NOW SERVING' : queue.myPosition}
        </Text>
        <Text style={styles.queueSubtext}>
          {isNowServing
            ? 'Please enter Consultation Suite 204'
            : isNext
              ? 'You are next in line. Please wait near Suite 204.'
              : `${queue.patientsAhead} patients ahead of you`}
        </Text>
      </View>

      {/* 3 Telemetry Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.mLabel}>PATIENTS AHEAD</Text>
          <Text style={styles.mValue}>{queue.patientsAhead}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.mLabel}>ESTIMATED WAIT</Text>
          <Text style={[styles.mValue, { color: THEME.colors.healthyDark }]}>
            {queue.estimatedWaitMinutes} min
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.mLabel}>CONSULTATION</Text>
          <Text style={styles.mValue}>{queue.expectedConsultationTime}</Text>
        </View>
      </View>

      {/* Token Stream Progression */}
      <View style={styles.tokenStreamBox}>
        <View style={styles.streamItem}>
          <Text style={styles.streamLabel}>CURRENT</Text>
          <Text style={styles.streamToken}>{queue.currentToken}</Text>
        </View>

        <Text style={styles.streamArrow}>→</Text>

        <View style={styles.streamItem}>
          <Text style={styles.streamLabel}>NEXT</Text>
          <Text style={styles.streamToken}>{queue.nextToken}</Text>
        </View>

        <Text style={styles.streamArrow}>→</Text>

        <View style={[styles.streamItem, styles.streamItemSelf]}>
          <Text style={[styles.streamLabel, { color: THEME.colors.primaryDark, fontWeight: '800' }]}>
            YOU
          </Text>
          <Text style={[styles.streamToken, { color: THEME.colors.primaryDark, fontWeight: '800' }]}>
            {queue.myToken}
          </Text>
        </View>
      </View>

      {/* Live Badge Footer */}
      <View style={styles.footerRow}>
        <View style={styles.liveIndicator}>
          <StatusDot tone="healthy" size={8} pulsing />
          <Text style={styles.liveText}>● LIVE</Text>
        </View>
        <Text style={styles.updateText}>Updated moments ago</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xxl,
    padding: THEME.spacing.lg,
    borderWidth: 1.5,
    borderColor: THEME.colors.primaryBorder,
    ...THEME.shadows.hero,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  clinicName: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  doctorName: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
    marginTop: 2,
  },
  tokenBadge: {
    backgroundColor: THEME.colors.primarySubtle,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 6,
    borderRadius: THEME.radii.lg,
    borderWidth: 1,
    borderColor: THEME.colors.primaryBorder,
    alignItems: 'center',
  },
  tokenLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 0.5,
  },
  tokenValue: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  centerMetricContainer: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.lg,
  },
  queueLabel: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.textMuted,
    letterSpacing: 1.2,
  },
  queueLargeNumber: {
    fontSize: THEME.typography.sizes.queueLarge,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
    lineHeight: 64,
    marginVertical: 4,
  },
  queueSubtext: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: THEME.typography.weights.semibold,
    color: THEME.colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.slate50,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
    marginBottom: THEME.spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: THEME.colors.slate200,
  },
  mLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  mValue: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
  },
  tokenStreamBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: THEME.colors.slate50,
    borderRadius: THEME.radii.md,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  streamItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  streamItemSelf: {
    backgroundColor: THEME.colors.primarySubtle,
    borderRadius: THEME.radii.sm,
    borderWidth: 1,
    borderColor: THEME.colors.primaryBorder,
  },
  streamLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  streamToken: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: '700',
    color: THEME.colors.navy,
    marginTop: 2,
  },
  streamArrow: {
    fontSize: 14,
    color: THEME.colors.slate400,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: THEME.spacing.xs,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.healthyDark,
    letterSpacing: 0.5,
  },
  updateText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
})
