import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { THEME } from '../../lib/constants/theme'

interface HeaderProps {
  title?: string
  subtitle?: string
  patientName?: string
  avatarUrl?: string
  onProfilePress?: () => void
  rightElement?: React.ReactNode
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle = 'FlowPulse Patient',
  patientName = 'Arjun',
  avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
  onProfilePress,
  rightElement,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.greeting}>
          {title || `Good Morning, ${patientName}`}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {rightElement ? (
        rightElement
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onProfilePress}
          style={styles.avatarButton}
        >
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
  },
  left: {
    flex: 1,
  },
  greeting: {
    fontSize: THEME.typography.sizes.xl,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.navy,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: THEME.typography.weights.medium,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  avatarButton: {
    borderRadius: THEME.radii.full,
    borderWidth: 2,
    borderColor: THEME.colors.primaryLight,
    padding: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
})
