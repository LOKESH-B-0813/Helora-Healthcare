import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { THEME } from '../../lib/constants/theme'

interface SlotPickerProps {
  selectedDate: string
  onSelectDate: (date: string) => void
  selectedSlot: string
  onSelectSlot: (slot: string) => void
}

const DATES = [
  { label: 'Today', day: '28 Aug', full: 'Today, 28 Aug 2026' },
  { label: 'Tomorrow', day: '29 Aug', full: 'Tomorrow, 29 Aug 2026' },
  { label: 'Sat', day: '30 Aug', full: 'Saturday, 30 Aug 2026' },
  { label: 'Sun', day: '31 Aug', full: 'Sunday, 31 Aug 2026' },
  { label: 'Mon', day: '01 Sep', full: 'Monday, 01 Sep 2026' },
]

const TIME_SLOTS = {
  morning: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
  afternoon: ['02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'],
  evening: ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM'],
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  selectedDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
}) => {
  return (
    <View style={styles.container}>
      {/* Date Picker Horizontal Scroll */}
      <Text style={styles.groupTitle}>SELECT DATE</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateList}
      >
        {DATES.map((item, idx) => {
          const isSelected = selectedDate === item.full
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => onSelectDate(item.full)}
              style={[
                styles.dateCard,
                isSelected && styles.dateCardSelected,
                THEME.shadows.subtle,
              ]}
            >
              <Text style={[styles.dateLabel, isSelected && styles.dateTextSelected]}>
                {item.label}
              </Text>
              <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
                {item.day}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Time Slots Groups */}
      <Text style={[styles.groupTitle, { marginTop: THEME.spacing.lg }]}>
        PREFERRED TIME SLOT
      </Text>

      {/* Morning */}
      <Text style={styles.subgroupTitle}>🌅 Morning (09:00 AM – 12:00 PM)</Text>
      <View style={styles.slotsGrid}>
        {TIME_SLOTS.morning.map((slot, idx) => {
          const isSelected = selectedSlot === slot
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => onSelectSlot(slot)}
              style={[styles.slotPill, isSelected && styles.slotPillSelected]}
            >
              <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                {slot}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Afternoon */}
      <Text style={styles.subgroupTitle}>☀️ Afternoon (02:00 PM – 05:00 PM)</Text>
      <View style={styles.slotsGrid}>
        {TIME_SLOTS.afternoon.map((slot, idx) => {
          const isSelected = selectedSlot === slot
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => onSelectSlot(slot)}
              style={[styles.slotPill, isSelected && styles.slotPillSelected]}
            >
              <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                {slot}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Evening */}
      <Text style={styles.subgroupTitle}>🌙 Evening (05:00 PM – 07:00 PM)</Text>
      <View style={styles.slotsGrid}>
        {TIME_SLOTS.evening.map((slot, idx) => {
          const isSelected = selectedSlot === slot
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => onSelectSlot(slot)}
              style={[styles.slotPill, isSelected && styles.slotPillSelected]}
            >
              <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                {slot}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: THEME.spacing.sm,
  },
  groupTitle: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: THEME.spacing.sm,
  },
  dateList: {
    gap: THEME.spacing.sm,
    paddingVertical: 4,
  },
  dateCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    minWidth: 80,
  },
  dateCardSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primaryDark,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  dateDay: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: '800',
    color: THEME.colors.navy,
    marginTop: 4,
  },
  dateTextSelected: {
    color: '#FFFFFF',
  },
  subgroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.slate600,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.xs,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
  },
  slotPill: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.md,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    minWidth: 95,
    alignItems: 'center',
  },
  slotPillSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primaryDark,
  },
  slotText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.slate700,
  },
  slotTextSelected: {
    color: '#FFFFFF',
  },
})
