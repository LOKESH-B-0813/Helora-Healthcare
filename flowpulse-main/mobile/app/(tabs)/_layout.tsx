import { Tabs } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { THEME } from '../../lib/constants/theme'

function TabIcon({ name, focused, badgeCount }: { name: string; focused: boolean; badgeCount?: number }) {
  const getSymbol = () => {
    switch (name) {
      case 'home':
        return '🏠'
      case 'appointments':
        return '📅'
      case 'queue':
        return '⏱️'
      case 'visit':
        return '🏥'
      case 'notifications':
        return '🔔'
      case 'profile':
        return '👤'
      default:
        return '●'
    }
  }

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.symbol, focused && styles.symbolFocused]}>
        {getSymbol()}
      </Text>
      {badgeCount !== undefined && badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount}</Text>
        </View>
      )}
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.slate400,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ focused }) => <TabIcon name="appointments" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Live Queue',
          tabBarIcon: ({ focused }) => <TabIcon name="queue" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="visit"
        options={{
          title: 'My Visit',
          tabBarIcon: ({ focused }) => <TabIcon name="visit" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => <TabIcon name="notifications" focused={focused} badgeCount={1} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    ...THEME.shadows.card,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  symbol: {
    fontSize: 18,
    opacity: 0.7,
  },
  symbolFocused: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: THEME.colors.critical,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
})
