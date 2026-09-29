import { useRouter } from 'expo-router'
import React from 'react'
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppointmentHeroCard } from '../../components/cards/AppointmentHeroCard'
import { HospitalFlowCard } from '../../components/cards/HospitalFlowCard'
import { Header } from '../../components/ui/Header'
import { OfflineBanner } from '../../components/ui/OfflineBanner'
import { useAppointment } from '../../hooks/useAppointment'
import { useRealtimeHospital } from '../../hooks/useRealtimeHospital'
import { DEMO_ACTIVE_APPOINTMENT } from '../../lib/data/demo-data'
import { THEME } from '../../lib/constants/theme'

export default function HomeScreen() {
  const router = useRouter()
  const { activeAppointment, loading, refreshAppointments } = useAppointment()
  const { scenarioMode, isDemoMode } = useRealtimeHospital()

  const appointment = activeAppointment || DEMO_ACTIVE_APPOINTMENT

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {isDemoMode && <OfflineBanner isDemo />}

      <Header
        title="Good Morning, Arjun"
        subtitle="FlowPulse Patient • ID: FP-P10023"
        onProfilePress={() => router.push('/(tabs)/profile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshAppointments}
            tintColor={THEME.colors.primary}
          />
        }
      >
        {/* Next Appointment Hero Card */}
        <AppointmentHeroCard
          appointment={appointment}
          onTrackVisit={() => router.push('/(tabs)/visit')}
          onViewQueue={() => router.push('/(tabs)/queue')}
        />

        {/* Quick Booking CTA Bar */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/appointment/book')}
          style={[styles.bookingCta, THEME.shadows.subtle]}
        >
          <View style={styles.ctaLeft}>
            <Text style={styles.ctaTitle}>Need a new appointment?</Text>
            <Text style={styles.ctaSubtitle}>Select from 6 clinical specialties</Text>
          </View>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Book Now →</Text>
          </View>
        </TouchableOpacity>

        {/* Hospital Flow Live Snapshot */}
        <View style={styles.sectionMargin}>
          <HospitalFlowCard scenarioMode={scenarioMode} />
        </View>

        {/* Patient Trust & Safety Notice */}
        <View style={styles.trustBox}>
          <Text style={styles.trustTitle}>🔒 Clinical Integrity Guarantee</Text>
          <Text style={styles.trustText}>
            Medical consultation times are strictly preserved. FlowPulse uses predictive intelligence exclusively to optimize administrative and diagnostic waiting times.
          </Text>
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
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xxxl,
  },
  sectionMargin: {
    marginTop: THEME.spacing.lg,
  },
  bookingCta: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  ctaLeft: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
  },
  ctaSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  ctaButton: {
    backgroundColor: THEME.colors.primarySubtle,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.primaryBorder,
  },
  ctaButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  trustBox: {
    backgroundColor: THEME.colors.slate100,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
  },
  trustTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.slate700,
    marginBottom: 4,
  },
  trustText: {
    fontSize: 11,
    color: THEME.colors.slate600,
    lineHeight: 16,
  },
})
