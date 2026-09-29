import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { THEME } from '../../lib/constants/theme'
import type { Doctor } from '../../lib/types'
import { Badge } from '../ui/Badge'

interface DoctorCardProps {
  doctor: Doctor
  selected?: boolean
  onSelect?: () => void
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
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
      <View style={styles.topRow}>
        <Image source={{ uri: doctor.imageUrl }} style={styles.avatar} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{doctor.name}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.ratingText}>{doctor.rating.toFixed(1)}</Text>
            </View>
          </View>
          <Text style={styles.qualification}>{doctor.qualification}</Text>
          <Text style={styles.experience}>
            {doctor.yearsExperience} yrs experience • {doctor.languages.slice(0, 2).join(', ')}
          </Text>
        </View>
      </View>

      {/* Specialty Tags */}
      <View style={styles.tagsRow}>
        {doctor.specialtyTags.slice(0, 3).map((tag, idx) => (
          <View key={idx} style={styles.tagPill}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* Footer Next Slot */}
      <View style={styles.footerRow}>
        <Text style={styles.slotLabel}>Next Available:</Text>
        <Badge label={doctor.nextAvailableSlot} tone="healthy" size="sm" />
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.colors.slate100,
    borderWidth: 1.5,
    borderColor: THEME.colors.primaryBorder,
  },
  info: {
    marginLeft: THEME.spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.warningSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.full,
    borderWidth: 1,
    borderColor: THEME.colors.warningBorder,
  },
  star: {
    color: THEME.colors.warningDark,
    fontSize: 10,
    marginRight: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: THEME.typography.weights.bold,
    color: THEME.colors.warningDark,
  },
  qualification: {
    fontSize: 12,
    color: THEME.colors.primaryDark,
    fontWeight: THEME.typography.weights.medium,
    marginTop: 2,
  },
  experience: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: THEME.spacing.sm,
  },
  tagPill: {
    backgroundColor: THEME.colors.slate100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
  },
  tagText: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  slotLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
})
