// ============================================================================
// FlowPulse AI — High-Contrast Clinical Mode Tokens & Theme Customizer
// WCAG AAA-compliant high-contrast tokens for emergency room display monitors and night shifts.
// ============================================================================

export type ThemeMode = 'clinical-light' | 'midnight-dark' | 'high-contrast-emergency'

export interface ThemeColorTokens {
  mode: ThemeMode
  background: string
  cardBackground: string
  textPrimary: string
  textSecondary: string
  primaryAccent: string
  border: string
  statusHealthy: string
  statusWarning: string
  statusCritical: string
}

export const CLINICAL_THEMES: Record<ThemeMode, ThemeColorTokens> = {
  'clinical-light': {
    mode: 'clinical-light',
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    primaryAccent: '#0284C7',
    border: '#E2E8F0',
    statusHealthy: '#10B981',
    statusWarning: '#F59E0B',
    statusCritical: '#EF4444',
  },
  'midnight-dark': {
    mode: 'midnight-dark',
    background: '#0B0F19',
    cardBackground: '#111827',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    primaryAccent: '#38BDF8',
    border: '#1F2937',
    statusHealthy: '#34D399',
    statusWarning: '#FBBF24',
    statusCritical: '#F87171',
  },
  'high-contrast-emergency': {
    mode: 'high-contrast-emergency',
    background: '#000000',
    cardBackground: '#050505',
    textPrimary: '#FFFFFF',
    textSecondary: '#E2E8F0',
    primaryAccent: '#00E5FF',
    border: '#FFFFFF',
    statusHealthy: '#00FF66',
    statusWarning: '#FFD700',
    statusCritical: '#FF0033',
  },
}

export function getThemeTokens(mode: ThemeMode = 'clinical-light'): ThemeColorTokens {
  return CLINICAL_THEMES[mode] || CLINICAL_THEMES['clinical-light']
}
