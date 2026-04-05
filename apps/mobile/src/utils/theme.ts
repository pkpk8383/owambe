import { Platform } from 'react-native';

export const COLORS = {
  // Brand
  primary: '#2D6A4F',
  primaryLight: '#EEF7F2',
  primaryDark: '#1A4D38',
  accent: '#E76F2A',
  accentLight: '#FEF3C7',

  // Neutrals
  dark: '#1A1612',
  mid: '#3D3730',
  muted: '#9A9080',
  border: '#E2DDD5',
  surface: '#FDFAF4',
  bg: '#F5F2EB',
  white: '#FFFFFF',

  // Semantic
  success: '#059669',
  warning: '#D97706',
  danger: '#E63946',
  info: '#3B82F6',

  // Status badges
  confirmed: { bg: '#D1FAE5', text: '#065F46' },
  pending: { bg: '#FEF3C7', text: '#92400E' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
  live: { bg: '#D1FAE5', text: '#065F46' },
  draft: { bg: '#F3F4F6', text: '#374151' },
};

export const FONTS = {
  regular: Platform.select({ ios: 'System', android: 'Roboto' }),
  medium: Platform.select({ ios: 'System', android: 'Roboto-Medium' }),
  bold: Platform.select({ ios: 'System', android: 'Roboto-Bold' }),
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#1A1612',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1612',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1612',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5, color: COLORS.dark },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, color: COLORS.dark },
  h3: { fontSize: 18, fontWeight: '600' as const, color: COLORS.dark },
  h4: { fontSize: 16, fontWeight: '600' as const, color: COLORS.dark },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, color: COLORS.mid },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, color: COLORS.muted },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const, color: COLORS.muted },
  caption: { fontSize: 12, fontWeight: '400' as const, color: COLORS.muted },
  button: { fontSize: 15, fontWeight: '700' as const, letterSpacing: 0.2 },
};

export const VENDOR_EMOJIS: Record<string, string> = {
  VENUE: '🏛',
  CATERING: '🍽',
  AV_PRODUCTION: '🎛',
  PHOTOGRAPHY_VIDEO: '📸',
  DECOR_FLORALS: '💐',
  ENTERTAINMENT: '🎶',
  MAKEUP_ARTIST: '💄',
  SPEAKER: '🎤',
};

export const VENDOR_LABELS: Record<string, string> = {
  VENUE: 'Venue',
  CATERING: 'Catering & F&B',
  AV_PRODUCTION: 'AV & Production',
  PHOTOGRAPHY_VIDEO: 'Photography',
  DECOR_FLORALS: 'Décor & Florals',
  ENTERTAINMENT: 'Entertainment',
  MAKEUP_ARTIST: 'Makeup Artist',
  SPEAKER: 'Speaker',
};
