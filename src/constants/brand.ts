/**
 * 39ers Aklan brand colors.
 *
 * From the logo: espresso brown #3A1401 and white.
 * Chosen for the app: a cool "milk" background, matcha green for action buttons
 * (it reads as go / pay on a POS), and an iced-blue vs. fries-orange pair that marks
 * which drinks go to the bar and which food goes to the kitchen.
 */

export const colors = {
  // Brand (from the logo)
  brand: '#3A1401',
  white: '#FFFFFF',

  // Espresso scale
  brown900: '#240C01',
  brown800: '#3A1401', // brand
  brown700: '#56301A',
  brown600: '#74492F',
  brown500: '#94694D',
  brown300: '#C4AB98',
  brown100: '#EDE4DD',

  // Surfaces
  background: '#F4F2EF',
  surface: '#FFFFFF',
  surfaceAlt: '#ECE8E4',
  border: '#E3DDD7',

  // Action color: matcha
  accent: '#A6D45E',
  accentPressed: '#8FC042',
  accentText: '#3F6B14',
  accentSoft: '#E9F4D3',
  onAccent: '#2A0E01',

  // Text
  textPrimary: '#2A0E01',
  textSecondary: '#6E5B50',
  textMuted: '#9C8C82',
  textOnBrand: '#FFFFFF',

  // Status
  success: '#2E7D4F',
  warning: '#B7791F',
  danger: '#C0392B',
  info: '#2F6A8F',

  // Stations: drinks (bar) vs food (kitchen)
  stationBar: '#4F86B5',
  stationKitchen: '#E58A2E',
  barSoft: '#E1EDF8',
  kitchenSoft: '#FCEBD3',
} as const;

export type ColorToken = keyof typeof colors;
