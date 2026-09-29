import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { THEME } from '../../lib/constants/theme'
import type { QueuePatientPosition } from '../../lib/types'
import { Badge } from '../ui/Badge'

interface QueueProgressListProps {
  queueStream: QueuePatientPosition[]
}

export const QueueProgressList: React.FC<QueueProgressListProps> = ({ queueStream }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>QUEUE ORDER & TELEMETRY</Text>

      {queueStream.map((item, idx) => {
        const isSelf = item.isSelf
        const isServing = item.status === 'SERVING'
        const isNext = item.status === 'NEXT'

        return (
          <View
            key={idx}
            style={[
              styles.row,
              isSelf && styles.rowSelf,
              THEME.shadows.subtle,
            ]}
          >
            {/* Position badge */}
            <View style={[styles.posBadge, isSelf && styles.posBadgeSelf]}>
              <Text style={[styles.posText, isSelf && styles.posTextSelf]}>
                #{item.position}
              </Text>
            </View>

            {/* Token & Patient Name */}
            <View style={styles.infoCol}>
              <View style={styles.tokenRow}>
                <Text style={[styles.tokenText, isSelf && styles.tokenTextSelf]}>
                  {item.token}
                </Text>
                {isSelf && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youText}>YOU</Text>
                  </View>
                )}
              </View>
              <Text style={styles.patientName}>
                {isSelf ? `${item.patientName} (You)` : item.patientName}
              </Text>
            </View>

            {/* Status & Service Time */}
            <View style={styles.statusCol}>
              <Badge
                label={isServing ? 'SERVING' : isNext ? 'NEXT' : `~${item.estimatedWaitMinutes}m`}
                tone={isServing ? 'healthy' : isNext ? 'ai' : 'neutral'}
                size="sm"
              />
              <Text style={styles.timeText}>{item.expectedServiceTime}</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: THEME.typography.weights.heavy,
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: THEME.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  rowSelf: {
    backgroundColor: THEME.colors.primarySubtle,
    borderColor: THEME.colors.primaryBorder,
    borderWidth: 1.5,
  },
  posBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.md,
  },
  posBadgeSelf: {
    backgroundColor: THEME.colors.primary,
  },
  posText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.slate700,
  },
  posTextSelf: {
    color: '#FFFFFF',
  },
  infoCol: {
    flex: 1,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenText: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: '800',
    color: THEME.colors.navy,
  },
  tokenTextSelf: {
    color: THEME.colors.primaryDark,
  },
  youBadge: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  youText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  patientName: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 3,
  },
})
