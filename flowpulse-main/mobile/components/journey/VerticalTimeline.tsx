import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { THEME } from '../../lib/constants/theme'
import type { PatientVisitJourney } from '../../lib/types'
import { Badge } from '../ui/Badge'
import { TimelineStageItem } from './TimelineStageItem'

interface VerticalTimelineProps {
  journey: PatientVisitJourney
}

export const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ journey }) => {
  return (
    <View style={styles.container}>
      {/* Top Current Status Card */}
      <View style={[styles.statusHero, THEME.shadows.card]}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroEyebrow}>CURRENT STATUS</Text>
          <Badge
            label={journey.isRecovered ? 'Flow Recovered' : journey.hasDiagnosticDelay ? 'Estimate Adjusted' : 'On Schedule'}
            tone={journey.isRecovered ? 'healthy' : journey.hasDiagnosticDelay ? 'warning' : 'healthy'}
            size="sm"
          />
        </View>

        <View style={styles.heroMetricsGrid}>
          <View style={styles.heroMetricCol}>
            <Text style={styles.hmLabel}>QUEUE POSITION</Text>
            <Text style={styles.hmValueBold}>#{journey.currentQueuePosition}</Text>
            <Text style={styles.hmSub}>{journey.patientsAhead} ahead of you</Text>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroMetricCol}>
            <Text style={styles.hmLabel}>CURRENT WAIT</Text>
            <Text style={[styles.hmValueBold, { color: THEME.colors.healthyDark }]}>
              {journey.currentWaitMinutes} min
            </Text>
            <Text style={styles.hmSub}>Until consult</Text>
          </View>
        </View>

        <View style={[styles.heroMetricsGrid, { marginTop: THEME.spacing.sm }]}>
          <View style={styles.heroMetricCol}>
            <Text style={styles.hmLabel}>EXPECTED COMPLETION</Text>
            <Text style={[styles.hmValueBold, { color: journey.hasDiagnosticDelay ? THEME.colors.warningDark : THEME.colors.navy }]}>
              {journey.estimatedCompletionTime}
            </Text>
            <Text style={styles.hmSub}>Door-to-door</Text>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroMetricCol}>
            <Text style={styles.hmLabel}>REMAINING TIME</Text>
            <Text style={styles.hmValueBold}>{journey.remainingVisitTime}</Text>
            <Text style={styles.hmSub}>Estimated total</Text>
          </View>
        </View>

        {journey.alertMessage && (
          <View
            style={[
              styles.alertBox,
              journey.isRecovered ? styles.alertBoxRecovered : styles.alertBoxWarning,
            ]}
          >
            <Text
              style={[
                styles.alertText,
                journey.isRecovered ? styles.alertTextRecovered : styles.alertTextWarning,
              ]}
            >
              {journey.isRecovered ? '✓ ' : '⚠️ '}
              {journey.alertMessage}
            </Text>
          </View>
        )}
      </View>

      {/* Hospital Location & Indoor Wayfinding Card */}
      <View style={[styles.locationCard, THEME.shadows.card]}>
        <View style={styles.locationHeader}>
          <View style={styles.locationTitleRow}>
            <Text style={styles.locationEyebrow}>HOSPITAL INDOOR LOCATION & GPS</Text>
            <Badge label="GPS Synced" tone="healthy" size="sm" />
          </View>
          <Text style={styles.hospitalNameText}>Metro General Super Specialty Hospital</Text>
          <Text style={styles.hospitalAddressText}>120 Victoria Road, Ashok Nagar, Bengaluru</Text>
        </View>

        <View style={styles.locationDivider} />

        <View style={styles.locationGrid}>
          <View style={styles.locationGridItem}>
            <Text style={styles.locLabel}>CURRENT BUILDING</Text>
            <Text style={styles.locValue}>Block C (Specialty)</Text>
            <Text style={styles.locSub}>Level 2 • Suite 204</Text>
          </View>
          <View style={styles.locationGridDivider} />
          <View style={styles.locationGridItem}>
            <Text style={styles.locLabel}>NEXT CARE UNIT</Text>
            <Text style={[styles.locValue, { color: THEME.colors.primary }]}>Block B (Diagnostics)</Text>
            <Text style={styles.locSub}>Ground Floor • Lab 04</Text>
          </View>
        </View>

        <View style={styles.wayfindingBox}>
          <Text style={styles.wayfindingTitle}>🚶 INDOOR WAYFINDING DIRECTIONS</Text>
          <Text style={styles.wayfindingText}>
            Take Express Elevator C-3 down to Ground Floor → Turn right into Central Concourse → Proceed 30m to Diagnostic Phlebotomy Desk.
          </Text>
        </View>
      </View>

      {/* Vertical Care Pathway */}
      <View style={styles.pathwaySection}>
        <Text style={styles.pathwayTitle}>CARE PATHWAY TIMELINE</Text>
        {journey.stages.map((stage, idx) => (
          <TimelineStageItem
            key={stage.id || idx}
            stage={stage}
            isLast={idx === journey.stages.length - 1}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: THEME.spacing.xxxl,
  },
  statusHero: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xxl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  heroEyebrow: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.primary,
    letterSpacing: 0.8,
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.slate50,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
  },
  heroMetricCol: {
    flex: 1,
  },
  heroDivider: {
    width: 1,
    backgroundColor: THEME.colors.slate200,
    marginHorizontal: THEME.spacing.md,
  },
  hmLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hmValueBold: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
  },
  hmSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  alertBox: {
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.md,
    borderWidth: 1,
  },
  alertBoxWarning: {
    backgroundColor: THEME.colors.warningSubtle,
    borderColor: THEME.colors.warningBorder,
  },
  alertBoxRecovered: {
    backgroundColor: THEME.colors.healthySubtle,
    borderColor: THEME.colors.healthyBorder,
  },
  alertText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  alertTextWarning: {
    color: THEME.colors.warningDark,
  },
  alertTextRecovered: {
    color: THEME.colors.healthyDark,
  },
  pathwaySection: {
    marginTop: THEME.spacing.sm,
  },
  pathwayTitle: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: THEME.spacing.md,
  },
  locationCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xxl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.xl,
  },
  locationHeader: {
    marginBottom: THEME.spacing.sm,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  locationEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 0.8,
  },
  hospitalNameText: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
  },
  hospitalAddressText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  locationDivider: {
    height: 1,
    backgroundColor: THEME.colors.slate200,
    marginVertical: THEME.spacing.sm,
  },
  locationGrid: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.slate50,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
  },
  locationGridItem: {
    flex: 1,
  },
  locationGridDivider: {
    width: 1,
    backgroundColor: THEME.colors.slate200,
    marginHorizontal: THEME.spacing.md,
  },
  locLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locValue: {
    fontSize: 13,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
  },
  locSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  wayfindingBox: {
    marginTop: THEME.spacing.sm,
    backgroundColor: THEME.colors.primarySubtle,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.primaryBorder,
  },
  wayfindingTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  wayfindingText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
  },
})
