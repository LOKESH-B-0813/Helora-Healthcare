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
import { LiveQueueHero } from '../../components/queue/LiveQueueHero'
import { QueueProgressList } from '../../components/queue/QueueProgressList'
import { Header } from '../../components/ui/Header'
import { OfflineBanner } from '../../components/ui/OfflineBanner'
import { useQueue } from '../../hooks/useQueue'
import { useRealtimeHospital } from '../../hooks/useRealtimeHospital'
import { DEMO_LIVE_QUEUE } from '../../lib/data/demo-data'
import { THEME } from '../../lib/constants/theme'

export default function QueueScreen() {
  const { isDemoMode, queueProgressionStep } = useRealtimeHospital()
  const { queue, loading, onRefresh, advanceQueue } = useQueue('cardiology', 'C-023')

  const liveQueue = queue || DEMO_LIVE_QUEUE

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {isDemoMode && <OfflineBanner isDemo />}

      <Header
        title="Live Queue Tracker"
        subtitle="Cardiology Clinic • Suite 204"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={THEME.colors.primary}
          />
        }
      >
        {/* Core Live Queue Hero */}
        <LiveQueueHero queue={liveQueue} />

        {/* Demo Queue Progression Tester */}
        <View style={styles.demoAdvanceBox}>
          <View style={styles.demoHeader}>
            <Text style={styles.demoTitle}>⚡ Interactive Queue Progression</Text>
            <Text style={styles.demoStep}>Current: #{queueProgressionStep}</Text>
          </View>
          <Text style={styles.demoSub}>
            Tap below to simulate real-time queue advancement without refreshing.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={advanceQueue}
            style={styles.advanceBtn}
          >
            <Text style={styles.advanceBtnText}>
              {queueProgressionStep <= 1
                ? '✓ Patient Now In Consultation (Suite 204)'
                : `Next Patient Calls → Advance to Position #${queueProgressionStep - 1}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Waiting Patients List */}
        <QueueProgressList queueStream={liveQueue.queueStream} />

        {/* Patient Guidance Tips */}
        <View style={styles.guidanceBox}>
          <Text style={styles.guidanceTitle}>💡 What should I do while waiting?</Text>
          <Text style={styles.guidanceText}>
            • Free hospital Wi-Fi is available in Lounge B (Network: FlowPulse-Guest).{'\n'}
            • You will receive a mobile chime when your token is 2 positions away.{'\n'}
            • Please ensure you have your digital token ready at Suite 204 entrance.
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
  demoAdvanceBox: {
    backgroundColor: THEME.colors.slate100,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.slate300,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.navy,
  },
  demoStep: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  demoSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.sm,
  },
  advanceBtn: {
    backgroundColor: THEME.colors.navy,
    borderRadius: THEME.radii.md,
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.md,
    alignItems: 'center',
  },
  advanceBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  guidanceBox: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  guidanceTitle: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
    marginBottom: THEME.spacing.sm,
  },
  guidanceText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
})
