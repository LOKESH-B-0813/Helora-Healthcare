import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { THEME } from '../../lib/constants/theme'
import type { DepartmentInfo } from '../../lib/types'
import { Badge } from '../ui/Badge'

interface DepartmentCardProps {
  department: DepartmentInfo
  selected?: boolean
  onSelect?: () => void
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  department,
  selected = false,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onSelect}
      style={[
        styles.card,
        selected && styles.cardSelected,
        THEME.shadows.subtle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.codePill}>
          <Text style={styles.codeText}>{department.code}</Text>
        </View>
        <Badge
          label={`~${department.avgWaitMinutes}m wait`}
          tone={department.status}
          size="sm"
        />
      </View>

      <Text style={styles.name}>{department.name}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {department.description}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.doctorsCount}>
          {department.activeDoctorsCount} Specialists Available
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.md,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  cardSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primarySubtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
  },
  codePill: {
    backgroundColor: THEME.colors.slate100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
  },
  codeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.slate700,
    letterSpacing: 0.5,
  },
  name: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 16,
    marginBottom: THEME.spacing.md,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: THEME.spacing.sm,
  },
  doctorsCount: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
})
