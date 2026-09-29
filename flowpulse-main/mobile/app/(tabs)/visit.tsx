import React from 'react'
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { VerticalTimeline } from '../../components/journey/VerticalTimeline'
import { Header } from '../../components/ui/Header'
import { OfflineBanner } from '../../components/ui/OfflineBanner'
import { usePatientJourney } from '../../hooks/usePatientJourney'
import { useRealtimeHospital } from '../../hooks/useRealtimeHospital'
import { getDemoPatientJourney } from '../../lib/data/demo-data'
import { THEME } from '../../lib/constants/theme'

export default function VisitScreen() {
  const { isDemoMode, scenarioMode } = useRealtimeHospital()
  const { journey, loading, onRefresh } = usePatientJourney('FP-P10023')

  const activeJourney = journey || getDemoPatientJourney(scenarioMode)

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {isDemoMode && <OfflineBanner isDemo />}

      <Header
        title="My Hospital Visit"
        subtitle={`Token: C-023 • ${activeJourney.departmentName} • ${activeJourney.doctorName}`}
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
        <VerticalTimeline journey={activeJourney} />
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
})
