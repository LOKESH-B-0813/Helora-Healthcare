import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { THEME } from '../../lib/constants/theme'
import { Badge } from '../ui/Badge'

interface VisitEstimateCardProps {
  patientName: string
  doctorName: string
  departmentName: string
  scheduledDate: string
  scheduledTime: string
  recommendedArrival: string
  expectedWaitMinutes: number
  expectedConsultationTime: string
  estimatedVisitDuration: string
  expectedCompletionTime: string
}

export const VisitEstimateCard: React.FC<VisitEstimateCardProps> = ({
  patientName,
  doctorName,
  departmentName,
  scheduledDate,
  scheduledTime,
  recommendedArrival,
  expectedWaitMinutes,
  expectedConsultationTime,
  estimatedVisitDuration,
  expectedCompletionTime,
}) => {
  return (
    <View style={[styles.card, THEME.shadows.card]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>FLOWPULSE AI VISIT ESTIMATE</Text>
          <Text style={styles.title}>Predicted Care Timeline</Text>
        </View>
        <Badge label="AI Calculated" tone="ai" size="sm" />
      </View>

      {/* Patient & Booking Summary */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryRow}>
          <Text style={styles.sLabel}>Patient:</Text>
          <Text style={styles.sValueBold}>{patientName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.sLabel}>Specialist:</Text>
          <Text style={styles.sValue}>{doctorName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.sLabel}>Department:</Text>
          <Text style={styles.sValue}>{departmentName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.sLabel}>Date & Time:</Text>
          <Text style={styles.sValue}>{scheduledDate} • {scheduledTime}</Text>
        </View>
      </View>

      {/* Breakdown Grid */}
      <View style={styles.breakdownGrid}>
        <View style={styles.breakdownItem}>
          <Text style={styles.bLabel}>RECOMMENDED ARRIVAL</Text>
          <Text style={[styles.bValue, { color: THEME.colors.primaryDark }]}>
            {recommendedArrival}
          </Text>
          <Text style={styles.bSub}>Adaptive check-in buffer</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.breakdownItem}>
          <Text style={styles.bLabel}>EXPECTED QUEUE WAIT</Text>
          <Text style={[styles.bValue, { color: THEME.colors.healthyDark }]}>
            ~{expectedWaitMinutes} min
          </Text>
          <Text style={styles.bSub}>Estimated clinic backlog</Text>
        </View>
      </View>

      <View style={[styles.breakdownGrid, { marginTop: THEME.spacing.sm }]}>
        <View style={styles.breakdownItem}>
          <Text style={styles.bLabel}>EXPECTED CONSULTATION</Text>
          <Text style={styles.bValue}>{expectedConsultationTime}</Text>
          <Text style={styles.bSub}>Doctor intake starts</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.breakdownItem}>
          <Text style={styles.bLabel}>TOTAL VISIT DURATION</Text>
          <Text style={[styles.bValue, { color: THEME.colors.ai }]}>
            {estimatedVisitDuration}
          </Text>
          <Text style={styles.bSub}>Door-to-door</Text>
        </View>
      </View>

      {/* Completion Highlight */}
      <View style={styles.completionBanner}>
        <Text style={styles.compLabel}>EXPECTED COMPLETION</Text>
        <Text style={styles.compTime}>{expectedCompletionTime}</Text>
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
    borderColor: THEME.colors.aiBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.ai,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: THEME.colors.slate50,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
    marginBottom: THEME.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sLabel: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
  sValue: {
    fontSize: 12,
    color: THEME.colors.slate700,
    fontWeight: '600',
  },
  sValueBold: {
    fontSize: 12,
    color: THEME.colors.navy,
    fontWeight: '700',
  },
  breakdownGrid: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.slate50,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
  },
  breakdownItem: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: THEME.colors.slate200,
    marginHorizontal: THEME.spacing.md,
  },
  bLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bValue: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
  },
  bSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  completionBanner: {
    backgroundColor: THEME.colors.aiSubtle,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.aiBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.aiDark,
    letterSpacing: 0.5,
  },
  compTime: {
    fontSize: THEME.typography.sizes.lg,
    fontWeight: '800',
    color: THEME.colors.aiDark,
  },
})
