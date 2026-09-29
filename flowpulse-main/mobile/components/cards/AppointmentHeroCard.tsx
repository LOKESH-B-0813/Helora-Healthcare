import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { THEME } from '../../lib/constants/theme'
import type { UserAppointment } from '../../lib/types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface AppointmentHeroCardProps {
  appointment: UserAppointment
  onTrackVisit: () => void
  onViewQueue: () => void
}

export const AppointmentHeroCard: React.FC<AppointmentHeroCardProps> = ({
  appointment,
  onTrackVisit,
  onViewQueue,
}) => {
  return (
    <View style={styles.card}>
      {/* Header Badge */}
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>YOUR NEXT APPOINTMENT</Text>
        <Badge label="Confirmed" tone="healthy" size="sm" />
      </View>

      {/* Doctor & Dept Info */}
      <View style={styles.doctorRow}>
        <Image
          source={{ uri: appointment.doctorImageUrl }}
          style={styles.doctorImage}
        />
        <View style={styles.doctorInfo}>
          <Text style={styles.deptName}>{appointment.departmentName}</Text>
          <Text style={styles.doctorName}>{appointment.doctorName}</Text>
          <Text style={styles.doctorQual}>{appointment.doctorQualification}</Text>
        </View>
      </View>

      {/* Schedule & Operational Telemetry Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>APPOINTMENT</Text>
          <Text style={styles.metricValueBold}>{appointment.scheduledTime}</Text>
          <Text style={styles.metricSub}>{appointment.scheduledDate}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>RECOMMENDED ARRIVAL</Text>
          <Text style={[styles.metricValueBold, { color: THEME.colors.primaryDark }]}>
            {appointment.recommendedArrivalWindow}
          </Text>
          <Text style={styles.metricSub}>Adaptive window</Text>
        </View>
      </View>

      <View style={[styles.metricsGrid, styles.metricsGridBottom]}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>ESTIMATED WAIT</Text>
          <Text style={[styles.metricValueBold, { color: THEME.colors.healthyDark }]}>
            {appointment.expectedQueueWaitMinutes} min
          </Text>
          <Text style={styles.metricSub}>Queue backlog</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>EXPECTED COMPLETION</Text>
          <Text style={[styles.metricValueBold, { color: THEME.colors.navy }]}>
            {appointment.estimatedCompletionTime}
          </Text>
          <Text style={styles.metricSub}>Door-to-door estimate</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Button
          title="TRACK MY VISIT"
          onPress={onTrackVisit}
          variant="primary"
          size="md"
          style={styles.primaryBtn}
        />
        <Button
          title="VIEW LIVE QUEUE"
          onPress={onViewQueue}
          variant="secondary"
          size="md"
          style={styles.secondaryBtn}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xxl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.primaryBorder,
    ...THEME.shadows.hero,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  eyebrow: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.primary,
    letterSpacing: 0.8,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  doctorImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: THEME.colors.slate100,
    borderWidth: 2,
    borderColor: THEME.colors.primaryLight,
  },
  doctorInfo: {
    marginLeft: THEME.spacing.md,
    flex: 1,
  },
  deptName: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.bold,
    color: THEME.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  doctorName: {
    fontSize: THEME.typography.sizes.lg,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
    marginTop: 1,
  },
  doctorQual: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.slate50,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
  },
  metricsGridBottom: {
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
  },
  metricItem: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    backgroundColor: THEME.colors.slate200,
    marginHorizontal: THEME.spacing.md,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: THEME.typography.weights.bold,
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValueBold: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
  },
  metricSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    gap: THEME.spacing.sm,
  },
  primaryBtn: {
    width: '100%',
  },
  secondaryBtn: {
    width: '100%',
  },
})
