import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { THEME } from '../../lib/constants/theme'

export default function ConfirmationScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()

  const [calendarAdded, setCalendarAdded] = useState(false)

  const appointmentId = (params.id as string) || 'FP-2026-10482'
  const patientName = (params.patientName as string) || 'Arjun Kumar'
  const departmentName = (params.departmentName as string) || 'Cardiology'
  const doctorName = (params.doctorName as string) || 'Dr. Ananya Rao'
  const scheduledTime = (params.scheduledTime as string) || '10:30 AM'
  const recommendedArrival = (params.recommendedArrival as string) || '10:40 AM'
  const expectedWait = (params.expectedWait as string) || '14'
  const expectedCompletion = (params.expectedCompletion as string) || '12:05 PM'
  const token = (params.token as string) || 'C-023'

  const handleAddToCalendar = () => {
    setCalendarAdded(true)
    Alert.alert(
      'Calendar Event Added',
      `FlowPulse appointment with ${doctorName} on Today at ${scheduledTime} (Arrival: ${recommendedArrival}) has been added to your calendar.`,
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon & Header */}
        <View style={styles.successHeader}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkSymbol}>✓</Text>
          </View>
          <Text style={styles.successTitle}>APPOINTMENT CONFIRMED</Text>
          <Text style={styles.successSub}>
            Your digital appointment & hospital token have been activated.
          </Text>
        </View>

        {/* Token Callout */}
        <View style={styles.tokenBox}>
          <Text style={styles.tokenTitle}>YOUR DIGITAL CLINIC TOKEN</Text>
          <Text style={styles.tokenValue}>{token}</Text>
          <Text style={styles.tokenSub}>Please present this token at reception / Suite 204</Text>
        </View>

        {/* Confirmation Details Card */}
        <View style={[styles.card, THEME.shadows.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEyebrow}>BOOKING REFERENCE</Text>
            <Badge label={appointmentId} tone="ai" size="sm" />
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.dLabel}>Patient:</Text>
              <Text style={styles.dValBold}>{patientName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.dLabel}>Specialist:</Text>
              <Text style={styles.dVal}>{doctorName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.dLabel}>Department:</Text>
              <Text style={styles.dVal}>{departmentName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.dLabel}>Scheduled Time:</Text>
              <Text style={styles.dVal}>{scheduledTime}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.dLabel}>Recommended Arrival:</Text>
              <Text style={[styles.dValBold, { color: THEME.colors.primaryDark }]}>
                {recommendedArrival}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.dLabel}>Estimated Wait:</Text>
              <Text style={[styles.dVal, { color: THEME.colors.healthyDark, fontWeight: '700' }]}>
                {expectedWait} min
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.dLabel}>Expected Completion:</Text>
              <Text style={[styles.dValBold, { color: THEME.colors.navy }]}>
                {expectedCompletion}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          <Button
            title="TRACK MY VISIT"
            onPress={() => router.replace('/(tabs)/visit')}
            variant="primary"
            size="lg"
            style={styles.actionBtn}
          />

          <Button
            title="VIEW APPOINTMENT"
            onPress={() => router.replace('/(tabs)/appointments')}
            variant="secondary"
            size="md"
            style={styles.actionBtn}
          />

          <Button
            title={calendarAdded ? '✓ ADDED TO CALENDAR' : '📅 ADD TO CALENDAR'}
            onPress={handleAddToCalendar}
            variant="outline"
            size="md"
            disabled={calendarAdded}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl,
    paddingBottom: THEME.spacing.xxxl,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: THEME.colors.healthy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.hero,
  },
  checkSymbol: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  successTitle: {
    fontSize: THEME.typography.sizes.xl,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
    letterSpacing: 0.5,
  },
  successSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: THEME.spacing.lg,
  },
  tokenBox: {
    backgroundColor: THEME.colors.primarySubtle,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1.5,
    borderColor: THEME.colors.primaryBorder,
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  tokenTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 0.8,
  },
  tokenValue: {
    fontSize: 42,
    fontWeight: '900',
    color: THEME.colors.primaryDark,
    marginVertical: 4,
  },
  tokenSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  detailsGrid: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dLabel: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
  dVal: {
    fontSize: 12,
    color: THEME.colors.slate700,
    fontWeight: '600',
  },
  dValBold: {
    fontSize: 12,
    color: THEME.colors.navy,
    fontWeight: '700',
  },
  actionSection: {
    gap: THEME.spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
})
