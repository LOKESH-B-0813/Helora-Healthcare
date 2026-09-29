import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Badge } from '../../components/ui/Badge'
import { Header } from '../../components/ui/Header'
import { getNotifications, markAllAsRead, markAsRead } from '../../lib/services/notification-service'
import { THEME } from '../../lib/constants/theme'
import type { MobileNotification } from '../../lib/types'

export default function NotificationsScreen() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<MobileNotification[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const fetchNotifs = async () => {
    try {
      setLoading(true)
      const list = await getNotifications()
      setNotifications(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifs()
  }, [])

  const handleMarkAllRead = async () => {
    const updated = await markAllAsRead()
    setNotifications(updated)
  }

  const handleNotificationPress = async (item: MobileNotification) => {
    const updated = await markAsRead(item.id)
    setNotifications(updated)
    if (item.actionRoute) {
      router.push(item.actionRoute as any)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const renderNotification = ({ item }: { item: MobileNotification }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.itemCard,
          !item.read && styles.itemCardUnread,
          THEME.shadows.subtle,
        ]}
      >
        <View style={styles.itemHeader}>
          <Badge
            label={item.category.toUpperCase()}
            tone={item.tone}
            size="sm"
          />
          <Text style={styles.itemTime}>{item.timestamp}</Text>
        </View>

        <Text style={[styles.itemTitle, !item.read && styles.itemTitleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.itemMessage}>{item.message}</Text>

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Notifications"
        subtitle={`${unreadCount} unread hospital alert${unreadCount === 1 ? '' : 's'}`}
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleMarkAllRead}
              style={styles.markReadBtn}
            >
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchNotifs}
            tintColor={THEME.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No notifications at this time</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  listContainer: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xxxl,
  },
  markReadBtn: {
    backgroundColor: THEME.colors.slate100,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 6,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  itemCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.xl,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  itemCardUnread: {
    backgroundColor: THEME.colors.primarySubtle,
    borderColor: THEME.colors.primaryBorder,
    borderWidth: 1.5,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemTime: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  itemTitle: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: THEME.typography.weights.bold,
    color: THEME.colors.navy,
    marginBottom: 4,
  },
  itemTitleUnread: {
    color: THEME.colors.primaryDark,
  },
  itemMessage: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.primary,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xxxl,
  },
  emptyText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
})
