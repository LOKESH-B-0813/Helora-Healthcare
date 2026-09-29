// ============================================================================
// FlowPulse AI — Patient Mobile Theme & Design Tokens
// Calm, clean, clinical design system built specifically for patient mobile UX.
// ============================================================================

export const THEME = {
  colors: {
    // Primary Brand
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: '#3B82F6',
    primarySubtle: '#EFF6FF',
    primaryBorder: '#BFDBFE',

    // Neutrals
    navy: '#0F172A',
    slate900: '#0F172A',
    slate800: '#1E293B',
    slate700: '#334155',
    slate600: '#475569',
    slate500: '#64748B',
    slate400: '#94A3B8',
    slate300: '#CBD5E1',
    slate200: '#E2E8F0',
    slate100: '#F1F5F9',
    slate50: '#F8FAFC',
    background: '#F8FAFC',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',

    // Typography
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    textInverse: '#FFFFFF',

    // Status Tones
    healthy: '#10B981',
    healthyDark: '#059669',
    healthyLight: '#34D399',
    healthySubtle: '#ECFDF5',
    healthyBorder: '#A7F3D0',

    warning: '#F59E0B',
    warningDark: '#D97706',
    warningLight: '#FBBF24',
    warningSubtle: '#FFFBEB',
    warningBorder: '#FDE68A',

    critical: '#EF4444',
    criticalDark: '#DC2626',
    criticalLight: '#F87171',
    criticalSubtle: '#FEF2F2',
    criticalBorder: '#FECACA',

    // AI & Predictive Intelligence
    ai: '#7C3AED',
    aiDark: '#6D28D9',
    aiLight: '#8B5CF6',
    aiSubtle: '#F5F3FF',
    aiBorder: '#DDD6FE',

    // Offline Indicator
    offline: '#64748B',
    offlineSubtle: '#F1F5F9',
  },

  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      display: 32,
      hero: 48,
      queueLarge: 56,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      heavy: '800' as const,
    },
    lineHeights: {
      tight: 1.15,
      normal: 1.35,
      relaxed: 1.5,
    },
  },

  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
  },

  radii: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },

  shadows: {
    subtle: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    hover: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    hero: {
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
  },
}
