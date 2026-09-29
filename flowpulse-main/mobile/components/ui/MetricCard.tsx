import React from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { THEME } from '../../lib/constants/theme'
import type { StatusTone } from '../../lib/types'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  subtitle?: string
  tone?: StatusTone
  icon?: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtitle,
  tone = 'neutral',
  icon,
  style,
}) => {
  const getValueColor = () => {
    switch (tone) {
      case 'healthy':
        return THEME.colors.healthyDark
      case 'warning':
        return THEME.colors.warningDark
      case 'critical':
        return THEME.colors.criticalDark
      case 'ai':
        return THEME.colors.ai
      case 'neutral':
      default:
        return THEME.colors.navy
    }
  }

  return (
    <View style={[styles.container, THEME.shadows.subtle, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        {icon && <View style={styles.icon}>{icon}</View>}
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: getValueColor() }]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.xs,
  },
  label: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.semibold,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  icon: {
    marginLeft: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: THEME.typography.sizes.xl,
    fontWeight: THEME.typography.weights.heavy,
  },
  unit: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.medium,
    color: THEME.colors.textMuted,
    marginLeft: 4,
  },
  subtitle: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
})
