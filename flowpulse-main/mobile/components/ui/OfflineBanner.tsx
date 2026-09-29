import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { THEME } from '../../lib/constants/theme'

interface OfflineBannerProps {
  isDemo?: boolean
  lastUpdated?: string
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isDemo = false,
  lastUpdated = '10:42 AM',
}) => {
  return (
    <View style={styles.banner}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{isDemo ? 'DEMO DATA' : 'OFFLINE'}</Text>
      </View>
      <Text style={styles.text}>
        {isDemo
          ? 'Running on high-fidelity offline engine. Realtime active.'
          : `Cached mode • Last updated: ${lastUpdated}`}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: THEME.colors.slate800,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  text: {
    color: THEME.colors.slate300,
    fontSize: 11,
    fontWeight: '500',
  },
})
