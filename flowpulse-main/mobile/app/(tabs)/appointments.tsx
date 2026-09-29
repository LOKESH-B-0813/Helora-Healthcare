import { useRouter } from 'expo-router'
import React from 'react'
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Header } from '../../components/ui/Header'
import { useAppointment } from '../../hooks/useAppointment'
import { THEME } from '../../lib/constants/theme'
import type { UserAppointment } from '../../lib/types'

export default function AppointmentsScreen() {
  const router = useRouter()
  const { appointments, loading, refreshAppointments } = useAppointment()

  const renderAppointmentItem = ({ item }: { item: UserAppointment }) => {
    return (
      <View style={[styles.card, THEME.shadows.card]}>
        <View style={styles.cardHeader}>
          <View style={styles.deptBadge}>
            <Text style={styles.deptText}>{item.departmentName}</Text>
          </View>
          <Badge label={item.status.toUpperCase()} tone="healthy" size="sm" />
        </View>

        <View style={styles.doctorRow}>
          <Image source={{ uri: item.doctorImageUrl }} style={styles.doctorAvatar} />
          <View style={styles.doctorMeta}>
            <Text style={styles.doctorName}>{item.doctorName}</Text>
            <Text style={styles.doctorQual}>{item.doctorQualification}</Text>
            <Text style={styles.tokenText}>Token: {item.token}</Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailCol}>
            <Text style={styles.dLabel}>SCHEDULED TIME</Text>
            <Text style={styles.dVal}>{item.scheduledDate}</Text>
            <Text style={styles.dValBold}>{item.scheduledTime}</Text>
          </View>

          <View style={styles.dDivider} />

          <View style={styles.detailCol}>
            <Text style={styles.dLabel}>RECOMMENDED ARRIVAL</Text>
            <Text style={[styles.dValBold, { color: THEME.colors.primaryDark }]}>
              {item.recommendedArrivalWindow}
            </Text>
            <Text style={styles.dSub}>Arrival Buffer</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Button
            title="TRACK MY VISIT"
            onPress={() => router.push('/(tabs)/visit')}
            variant="primary"
            size="sm"
            style={styles.actionBtn}
          />
          <Button
            title="LIVE QUEUE"
            onPress={() => router.push('/(tabs)/queue')}
            variant="secondary"
            size="sm"
            style={styles.actionBtn}
          />
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="My Appointments"
        subtitle="Manage upcoming & past hospital visits"
        rightElement={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/appointment/book')}
            style={styles.bookPlusBtn}
          >
            <Text style={styles.bookPlusText}>+ Book</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointmentItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshAppointments}
            tintColor={THEME.colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerCtaBox}>
            <Button
              title="+ Book New Appointment"
              onPress={() => router.push('/appointment/book')}
              variant="primary"
              size="lg"
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No appointments found</Text>
            <Text style={styles.emptySubtitle}>Book an appointment with a specialist</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  listContainer: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xxxl,
  },
  headerCtaBox: {
    marginBottom: THEME.spacing.lg,
  },
  bookPlusBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radii.lg,
  },
  bookPlusText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  deptBadge: {
    backgroundColor: THEME.colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  deptText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
    textTransform: 'uppercase',
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.slate100,
    borderWidth: 1.5,
    borderColor: THEME.colors.primaryBorder,
  },
  doctorMeta: {
    marginLeft: THEME.spacing.md,
    flex: 1,
  },
  doctorName: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
  },
  doctorQual: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  tokenText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginTop: 2,
  },
  detailsGrid: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.slate50,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
    marginBottom: THEME.spacing.md,
  },
  detailCol: {
    flex: 1,
  },
  dDivider: {
    width: 1,
    backgroundColor: THEME.colors.slate200,
    marginHorizontal: THEME.spacing.md,
  },
  dLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dVal: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  dValBold: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.navy,
    marginTop: 1,
  },
  dSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xxxl,
  },
  emptyTitle: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: '700',
    color: THEME.colors.slate600,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
})
