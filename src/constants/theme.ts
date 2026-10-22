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
