/**
 * High-Accessibility Theme Tokens for Local General Store App
 * Specially calibrated for high contrast, elderly legibility, and daylight visibility.
 */
export const Colors = {
  // Brand & Grocery Greens
  primary: '#15803D', // Forest Green (WCAG AAA compliant with white)
  primaryLight: '#DCFCE7', // Soft mint for badges & active states
  primaryDark: '#166534', // Deep green for pressed states

  // Call-to-Action Vibrant Oranges
  accent: '#EA580C', // Vibrant Orange for prominent Buy / Add / Checkout actions
  accentLight: '#FFEDD5', // Light amber background for accents
  accentDark: '#C2410C',

  // Status Colors
  success: '#16A34A',
  successBg: '#F0FDF4',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',

  // Neutrals & High Contrast Text (essential for elderly eyes)
  textPrimary: '#0F172A', // Slate 900: extra-crisp dark text
  textSecondary: '#475569', // Slate 600: legible secondary text
  textMuted: '#64748B', // Slate 500: subtle hints
  textWhite: '#FFFFFF',

  // Backgrounds & Surfaces
  background: '#F8FAFC', // Slate 50: clean, soft off-white canvas
  surface: '#FFFFFF', // Pure white card surfaces
  surfaceSecondary: '#F1F5F9', // Slate 100 for chips and search bars
  border: '#E2E8F0', // Slate 200 clean borders
  divider: '#CBD5E1',

  // Discounts
  discountBg: '#FEF2F2',
  discountText: '#B91C1C',

  // Aliases
  brandPrimary: '#15803D',
};

export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16, // Accessible standard body text
    lg: 18, // Card titles & prices
    xl: 20, // Section headers
    xxl: 24, // Screen titles
    hero: 30,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  titleLarge: {
    fontSize: 24,
    fontWeight: '800' as const,
    lineHeight: 30,
  },
  titleMedium: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  labelMedium: {
    fontSize: 14,
    fontWeight: '700' as const,
    lineHeight: 18,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  touchTarget: 48, // Minimum 48x48dp touch targets for accessibility
};

export const TouchTargets = {
  minHeight: 48,
  minWidth: 48,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
};
