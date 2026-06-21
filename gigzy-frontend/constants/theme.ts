/**
 * Jobspot Design System
 * Warm, professional job-finding app palette
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const PROFESSIONAL_THEME = {
  colors: {
    bg: '#FAFAFC',
    card: '#FFFFFF',
    primary: '#0B132B',
    primaryDark: '#050914',
    primaryLight: '#5A4FCF',
    googleBtn: '#FFFFFF',
    googleBtnText: '#1F2937',
    secondary: '#EBE7FF',
    inputBg: '#FFFFFF',
    text: '#111827',
    textMuted: '#6B7280',
    textDim: '#9CA3AF',
    border: '#E5E7EB',
    checkboxBg: '#5A4FCF',
    success: '#10B981',
    successBg: '#ECFDF5',
    warning: '#EF4444',
    warningBg: '#FEF2F2',
    pending: '#F59E0B',
    pendingBg: '#FEF3C7',
    surfaceDark: '#111827',
    logoOrange: '#5A4FCF',
    statsCyan: '#E0F2FE',
    statsPurple: '#F3E8FF',
    statsOrange: '#FEF3C7',
    cardBackgroundLight: '#F3F4F6',
  },
  borders: {
    width: 1,
    radius: 12,               // Inputs and buttons
    radiusLg: 16,            // Cards
    pill: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 4,
    },
  },
  typography: {
    display: {
      fontSize: 32,
      fontWeight: '800' as const,
      letterSpacing: -0.5,
      lineHeight: 38,
    },
    h1: {
      fontSize: 26,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
      lineHeight: 32,
    },
    h2: {
      fontSize: 18,
      fontWeight: '700' as const,
      letterSpacing: -0.2,
      lineHeight: 24,
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    bodyMedium: {
      fontSize: 15,
      fontWeight: '500' as const,
      lineHeight: 22,
    },
    caption: {
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
  },
};
