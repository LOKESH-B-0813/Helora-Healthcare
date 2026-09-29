import React from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { THEME } from '../../lib/constants/theme'
import type { StatusTone } from '../../lib/types'

interface StatusDotProps {
  tone?: StatusTone
  size?: number
  pulsing?: boolean
  style?: StyleProp<ViewStyle>
}

export const StatusDot: React.FC<StatusDotProps> = ({
  tone = 'healthy',
  size = 8,
  pulsing = false,
  style,
}) => {
  const getColor = () => {
    switch (tone) {
      case 'warning':
        return THEME.colors.warning
      case 'critical':
        return THEME.colors.critical
      case 'ai':
        return THEME.colors.ai
      case 'neutral':
        return THEME.colors.slate400
      case 'healthy':
      default:
        return THEME.colors.healthy
    }
  }

  const dotColor = getColor()

  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dotColor,
        },
        pulsing && {
          shadowColor: dotColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 4,
        },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  dot: {
    marginRight: 6,
  },
})
