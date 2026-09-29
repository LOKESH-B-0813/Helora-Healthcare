import React from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { THEME } from '../../lib/constants/theme'
import type { StatusTone } from '../../lib/types'

interface BadgeProps {
  label: string
  tone?: StatusTone
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  tone = 'healthy',
  size = 'md',
  icon,
  style,
}) => {
  const getColors = () => {
    switch (tone) {
      case 'healthy':
        return { bg: THEME.colors.healthySubtle, text: THEME.colors.healthyDark, border: THEME.colors.healthyBorder }
      case 'warning':
        return { bg: THEME.colors.warningSubtle, text: THEME.colors.warningDark, border: THEME.colors.warningBorder }
      case 'critical':
        return { bg: THEME.colors.criticalSubtle, text: THEME.colors.criticalDark, border: THEME.colors.criticalBorder }
      case 'ai':
        return { bg: THEME.colors.aiSubtle, text: THEME.colors.ai, border: THEME.colors.aiBorder }
      case 'neutral':
      default:
        return { bg: THEME.colors.slate100, text: THEME.colors.slate700, border: THEME.colors.slate200 }
    }
  }

  const { bg, text, border } = getColors()
  const isSmall = size === 'sm'

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, borderColor: border },
        isSmall && styles.badgeSmall,
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.text, { color: text }, isSmall && styles.textSmall]}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 4,
    borderRadius: THEME.radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 2,
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: THEME.typography.weights.semibold,
  },
  textSmall: {
    fontSize: THEME.typography.sizes.xs,
  },
})
