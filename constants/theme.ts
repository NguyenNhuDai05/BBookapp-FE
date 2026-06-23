/**
 * B-Book Design System — Color tokens, spacing, and shadows.
 * All brand values derived from Figma designs.
 */

import { Platform } from 'react-native';

// ─── BRAND COLORS ───────────────────────────────────────────
export const BrandColors = {
  // Gradient (primary CTA, hero sections)
  gradientStart: '#FFC2D1',
  gradientEnd: '#E8436A',
  gradientHeroStart: '#FFE2D7',
  gradientHeroMid: '#F799A5',
  gradientHeroEnd: '#F55389',

  // Text
  textPrimary: '#8B1A2E',
  textDark: '#301726',
  textBody: '#5C5461',
  textSecondary: '#8D6674',
  textMuted: '#A397A6',
  textLight: '#BCA7B4',
  textWhite: '#FFFFFF',

  // Background
  bgPrimary: '#FFF6F8',
  bgCard: '#FFFFFF',
  bgPink: '#FFF0F4',
  bgPinkLight: '#FFF9FA',
  bgPinkSoft: '#FFE2D7',
  bgOverlay: 'rgba(48, 23, 38, 0.45)',

  // Accent
  accentPink: '#F55389',
  accentRose: '#E8436A',
  accentRoseDark: '#C71585',
  accentGold: '#F5A623',
  accentPinkMedium: '#D86D9A',
  accentPinkLight: '#F06A8B',

  // Status
  statusConfirmed: '#227A5C',
  statusConfirmedBg: '#EAF8F1',
  statusPending: '#D86D9A',
  statusPendingBg: '#FFF0F4',
  statusCompleted: '#3B6BB3',
  statusCompletedBg: '#EEF5FF',
  statusCancelled: '#B34444',
  statusCancelledBg: '#FFF0F0',

  // Border
  borderLight: '#F0E5EA',
  borderPink: '#F0C4CD',
  borderSoft: '#EDE4E8',
  borderDivider: '#F6EFF2',
  borderWhite: 'rgba(255,255,255,0.72)',

  // Verified badge
  verified: '#4ADE80',
} as const;

// ─── TYPOGRAPHY ──────────────────────────────────────────────
export const Typography = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

// ─── SPACING ────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
} as const;

// ─── BORDER RADIUS ──────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  full: 999,
} as const;

// ─── SHADOW PRESETS ─────────────────────────────────────────
export const Shadows = {
  card: {
    shadowColor: '#22152B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#22152B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  tabBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 14,
  },
  soft: {
    shadowColor: '#F55389',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

// ─── LEGACY THEME (kept for existing components) ────────────
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
