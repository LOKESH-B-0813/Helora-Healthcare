import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { THEME } from '../../lib/constants/theme'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
          indicatorColor: THEME.colors.primary,
        }
      case 'outline':
        return {
          container: styles.outlineContainer,
          text: styles.outlineText,
          indicatorColor: THEME.colors.primary,
        }
      case 'ghost':
        return {
          container: styles.ghostContainer,
          text: styles.ghostText,
          indicatorColor: THEME.colors.primary,
        }
      case 'danger':
        return {
          container: styles.dangerContainer,
          text: styles.dangerText,
          indicatorColor: THEME.colors.card,
        }
      case 'primary':
      default:
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
          indicatorColor: THEME.colors.card,
        }
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { container: styles.sizeSm, text: styles.textSm }
      case 'lg':
        return { container: styles.sizeLg, text: styles.textLg }
      case 'md':
      default:
        return { container: styles.sizeMd, text: styles.textMd }
    }
  }

  const vStyles = getVariantStyles()
  const sStyles = getSizeStyles()

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.baseButton,
        vStyles.container,
        sStyles.container,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vStyles.indicatorColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.baseText, vStyles.text, sStyles.text, textStyle]}>
            {title}
          </Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: THEME.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontWeight: THEME.typography.weights.semibold,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: THEME.spacing.sm,
  },
  iconRight: {
    marginLeft: THEME.spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },

  // Sizes
  sizeSm: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
  },
  textSm: {
    fontSize: THEME.typography.sizes.sm,
  },
  sizeMd: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    minHeight: 48,
  },
  textMd: {
    fontSize: THEME.typography.sizes.base,
  },
  sizeLg: {
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.xl,
    minHeight: 56,
  },
  textLg: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: THEME.typography.weights.bold,
  },

  // Variants
  primaryContainer: {
    backgroundColor: THEME.colors.primary,
    ...THEME.shadows.subtle,
  },
  primaryText: {
    color: THEME.colors.textInverse,
  },
  secondaryContainer: {
    backgroundColor: THEME.colors.primarySubtle,
    borderWidth: 1,
    borderColor: THEME.colors.primaryBorder,
  },
  secondaryText: {
    color: THEME.colors.primary,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
  },
  outlineText: {
    color: THEME.colors.textPrimary,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: THEME.colors.primary,
  },
  dangerContainer: {
    backgroundColor: THEME.colors.critical,
  },
  dangerText: {
    color: THEME.colors.textInverse,
  },
})
