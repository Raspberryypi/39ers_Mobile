/**
 * 39ers Aklan — brand theme
 * Base colors are sampled directly from the logo:
 *   Espresso brown  #3A1401  (logo background)
 *   White           #FFFFFF  (logo lettering and ring)
 * Everything else is derived from those two, plus one caramel accent
 * (proposed, not from the logo) so primary actions stand out on dark brown.
 */

export const colors = {
  // Brand (from logo)
  brand: '#3A1401',
  white: '#FFFFFF',

  // Brown scale (derived from brand)
  brown900: '#2A0E01',
  brown800: '#3A1401', // brand
  brown700: '#55290F',
  brown600: '#74421F',
  brown500: '#94603A',
  brown300: '#C9A98C',
  brown100: '#F1E6DC',

  // Surfaces
  background: '#FBF7F2', // warm cream
  surface: '#FFFFFF',
  surfaceAlt: '#F5EDE4',
  border: '#E6D8CA',

  // Accent (proposed): caramel, used for primary CTA (Charge, Add to cart)
  accent: '#D08A3C',
  accentPressed: '#B87329',
  onAccent: '#2A0E01',

  // Text
  textPrimary: '#2A0E01',
  textSecondary: '#6B5444',
  textMuted: '#9A8576',
  textOnBrand: '#FFFFFF',

  // Status
  success: '#2E7D4F',
  warning: '#C98A00',
  danger: '#B3261E',
  info: '#2F6A8F',

  // Station tags used on tickets and the POS grid
  stationBar: '#6F4E37', // drinks
  stationKitchen: '#C2571A', // food
} as const;

export type ColorToken = keyof typeof colors;
