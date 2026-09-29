import React from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { THEME } from '../../lib/constants/theme'

interface CardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  elevated?: boolean
  bordered?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevated = true,
  bordered = true,
}) => {
  return (
    <View
      style={[
        styles.card,
        elevated && THEME.shadows.card,
        bordered && styles.bordered,
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.lg,
  },
  bordered: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
})
