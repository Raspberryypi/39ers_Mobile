/**
 * App theme. Brand colors come from the 39ers logo (see ./brand.ts).
 * `Colors`, `Fonts`, `Spacing` keep the shape the Expo template components expect.
 */

import '@/global.css';

import { Platform } from 'react-native';

import { colors as brand } from '@/constants/brand';

export { brand };

export const Colors = {
  light: {
    text: brand.textPrimary,
    background: brand.background,
    backgroundElement: brand.surfaceAlt,
    backgroundSelected: brand.brown100,
    textSecondary: brand.textSecondary,
  },
  dark: {
    text: '#FFFFFF',
    background: brand.brown900,
    backgroundElement: brand.brown800,
    backgroundSelected: brand.brown700,
    textSecondary: brand.brown300,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** Rounded display face for the wordmark, headings, prices and big numbers. */
export const Display = {
  semibold: 'BalooChettan2_600SemiBold',
  bold: 'BalooChettan2_700Bold',
  extrabold: 'BalooChettan2_800ExtraBold',
} as const;

/** Style for display text. The line height is set explicitly because this font has tall metrics. */
export const displayText = (size: number, weight: keyof typeof Display = 'bold') => ({
  fontFamily: Display[weight],
  fontSize: size,
  lineHeight: Math.round(size * 1.25),
});

export const Radius = { sm: 10, md: 14, lg: 22, xl: 30, pill: 999 } as const;

/** Windows at least this wide (tablets, browsers) get the side rail and split layouts. */
export const BREAKPOINT = 720;
