import React, { useEffect, useState } from 'react'
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Badge } from '../../components/ui/Badge'
import { Header } from '../../components/ui/Header'
import { OfflineBanner } from '../../components/ui/OfflineBanner'
import { useRealtimeHospital } from '../../hooks/useRealtimeHospital'
import { DEMO_PATIENT } from '../../lib/data/demo-data'
import { getPatientProfile, updatePatientPreferences } from '../../lib/services/patient-service'
import { THEME } from '../../lib/constants/theme'
import type { PatientProfile } from '../../lib/types'

export default function ProfileScreen() {
  const {
    isDemoMode,
    scenarioMode,
    triggerIncidentDemo,
    triggerRecoveryDemo,
    resetToNormalDemo,
  } = useRealtimeHospital()

  const [profile, setProfile] = useState<PatientProfile>(DEMO_PATIENT)

  useEffect(() => {
    getPatientProfile().then(setProfile)
  }, [])

  const handleToggle = async (key: keyof PatientProfile['notificationPreferences']) => {
    const updatedPrefs = {
      ...profile.notificationPreferences,
      [key]: !profile.notificationPreferences[key],
    }
    const updated = await updatePatientPreferences(updatedPrefs)
    setProfile(updated)
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {isDemoMode && <OfflineBanner isDemo />}

      <Header title="Patient Profile" subtitle="Account details & demo controller" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, THEME.shadows.card]}>
          <View style={styles.avatarRow}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
              }}
              style={styles.avatar}
            />
            <View style={styles.avatarMeta}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.patientId}>Patient ID: {profile.id}</Text>
              <Badge label="Verified Patient" tone="healthy" size="sm" style={styles.verifiedBadge} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>{profile.phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{profile.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Blood Group</Text>
            <Text style={styles.infoValue}>{profile.bloodGroup}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Emergency Contact</Text>
            <Text style={styles.infoValue}>
              {profile.emergencyContact.name} ({profile.emergencyContact.relationship}) • {profile.emergencyContact.phone}
            </Text>
          </View>
        </View>

        {/* Notification Preferences */}
        <View style={[styles.sectionCard, THEME.shadows.subtle]}>
          <Text style={styles.sectionTitle}>NOTIFICATION PREFERENCES</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelCol}>
              <Text style={styles.switchTitle}>Push Notifications</Text>
              <Text style={styles.switchSubtitle}>Real-time hospital alerts and arrival prompts</Text>
            </View>
            <Switch
              value={profile.notificationPreferences.pushEnabled}
              onValueChange={() => handleToggle('pushEnabled')}
              trackColor={{ false: THEME.colors.slate200, true: THEME.colors.primary }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelCol}>
              <Text style={styles.switchTitle}>Live Queue Chimes</Text>
              <Text style={styles.switchSubtitle}>Alerts when your token is 2 positions away</Text>
            </View>
            <Switch
              value={profile.notificationPreferences.queueAlerts}
              onValueChange={() => handleToggle('queueAlerts')}
              trackColor={{ false: THEME.colors.slate200, true: THEME.colors.primary }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelCol}>
              <Text style={styles.switchTitle}>Adaptive Estimate Updates</Text>
              <Text style={styles.switchSubtitle}>Notifies when door-to-door visit timeline shifts</Text>
            </View>
            <Switch
              value={profile.notificationPreferences.estimateUpdates}
              onValueChange={() => handleToggle('estimateUpdates')}
              trackColor={{ false: THEME.colors.slate200, true: THEME.colors.primary }}
            />
          </View>
        </View>

        {/* Cross-Platform Judge Demo Controller */}
        <View style={[styles.demoControllerCard, THEME.shadows.hero]}>
          <View style={styles.demoHeader}>
            <Text style={styles.demoTitle}>🎯 Hackathon Demo Controller</Text>
            <Badge
              label={`Active: ${scenarioMode}`}
              tone={scenarioMode === 'LAB_INCIDENT' ? 'warning' : scenarioMode === 'STAFF_RECOVERY' ? 'healthy' : 'ai'}
              size="sm"
            />
          </View>
          <Text style={styles.demoDesc}>
            Test cross-platform synchronization with the staff portal command center:
          </Text>

          {/* Normal */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={resetToNormalDemo}
            style={[
              styles.scenarioBtn,
              scenarioMode === 'NORMAL' && styles.scenarioBtnActive,
            ]}
          >
            <Text style={styles.scenarioBtnTitle}>1. Normal Hospital Baseline</Text>
            <Text style={styles.scenarioBtnSub}>
              Lab Wait: 14m • Expected Completion: 12:00 PM / 12:07 PM
            </Text>
          </TouchableOpacity>

          {/* Incident */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={triggerIncidentDemo}
            style={[
              styles.scenarioBtn,
              scenarioMode === 'LAB_INCIDENT' && styles.scenarioBtnWarning,
            ]}
          >
            <Text style={[styles.scenarioBtnTitle, { color: THEME.colors.warningDark }]}>
              2. Trigger Lab Analyzer Failure (LAB-AN-02)
            </Text>
            <Text style={styles.scenarioBtnSub}>
              Simulates website ripple effect • Lab Wait: 34m • Completion: 12:16 PM
            </Text>
          </TouchableOpacity>

          {/* Recovery */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={triggerRecoveryDemo}
            style={[
              styles.scenarioBtn,
              scenarioMode === 'STAFF_RECOVERY' && styles.scenarioBtnHealthy,
            ]}
          >
            <Text style={[styles.scenarioBtnTitle, { color: THEME.colors.healthyDark }]}>
              3. Staff Approves Backup Analyzer (Option C)
            </Text>
            <Text style={styles.scenarioBtnSub}>
              Simulates hospital recovery • Lab Wait: 20m • Completion: 12:07 PM (9m saved)
            </Text>
          </TouchableOpacity>
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
  profileCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xxl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: THEME.colors.primaryLight,
  },
  avatarMeta: {
    marginLeft: THEME.spacing.md,
    flex: 1,
  },
  name: {
    fontSize: THEME.typography.sizes.lg,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
  },
  patientId: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primary,
    marginTop: 2,
  },
  verifiedBadge: {
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: THEME.spacing.md,
  },
  infoRow: {
    marginBottom: THEME.spacing.sm,
  },
  infoLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.navy,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: THEME.spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.slate100,
  },
  switchLabelCol: {
    flex: 1,
    paddingRight: THEME.spacing.md,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.navy,
  },
  switchSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  demoControllerCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xxl,
    padding: THEME.spacing.lg,
    borderWidth: 1.5,
    borderColor: THEME.colors.primaryBorder,
    marginBottom: THEME.spacing.lg,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  demoTitle: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
  },
  demoDesc: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.md,
  },
  scenarioBtn: {
    backgroundColor: THEME.colors.slate50,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.md,
    borderWidth: 1.5,
    borderColor: THEME.colors.slate200,
    marginBottom: THEME.spacing.sm,
  },
  scenarioBtnActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primarySubtle,
  },
  scenarioBtnWarning: {
    borderColor: THEME.colors.warning,
    backgroundColor: THEME.colors.warningSubtle,
  },
  scenarioBtnHealthy: {
    borderColor: THEME.colors.healthy,
    backgroundColor: THEME.colors.healthySubtle,
  },
  scenarioBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.navy,
  },
  scenarioBtnSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
})
