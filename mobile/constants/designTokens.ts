/**
 * Design Tokens for RealSingles Mobile App
 * 2026 Modern Native Mobile Standards
 *
 * This file provides responsive design tokens that adapt to different screen sizes
 * and follow iOS/Android native design guidelines.
 */

import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device size breakpoints
export const BREAKPOINTS = {
  small: 320,   // Small phones (iPhone SE)
  medium: 375,  // Standard phones (iPhone 13/14)
  large: 390,   // Pro models (iPhone 14 Pro)
  xl: 428,      // Max models (iPhone 14 Pro Max)
  tablet: 768,  // iPads and tablets
} as const;

// Detect device category
export const getDeviceSize = () => {
  if (SCREEN_WIDTH >= BREAKPOINTS.tablet) return 'tablet';
  if (SCREEN_WIDTH >= BREAKPOINTS.xl) return 'xl';
  if (SCREEN_WIDTH >= BREAKPOINTS.large) return 'large';
  if (SCREEN_WIDTH >= BREAKPOINTS.medium) return 'medium';
  return 'small';
};

export const IS_TABLET = SCREEN_WIDTH >= BREAKPOINTS.tablet;
export const IS_SMALL_DEVICE = SCREEN_WIDTH < BREAKPOINTS.medium;

/**
 * Responsive Spacing System
 * Based on 8pt grid system (iOS/Material Design standard)
 * Uses scale() for horizontal spacing and verticalScale() for vertical spacing
 */
export const SPACING = {
  // Micro spacing
  xxs: scale(2),    // 2px base
  xs: scale(4),     // 4px base

  // Standard spacing (8pt grid)
  sm: scale(8),     // 8px base
  md: scale(12),    // 12px base
  base: scale(16),  // 16px base (1rem equivalent)
  lg: scale(20),    // 20px base
  xl: scale(24),    // 24px base
  '2xl': scale(32), // 32px base
  '3xl': scale(40), // 40px base
  '4xl': scale(48), // 48px base
  '5xl': scale(64), // 64px base

  // Component-specific
  cardPadding: scale(16),
  screenPadding: scale(20),
  sectionSpacing: verticalScale(24),
  inputPadding: moderateScale(14),
} as const;

/**
 * Vertical Spacing (for padding/margins that affect height)
 * Uses verticalScale() to maintain proper proportions on different screen heights
 */
export const VERTICAL_SPACING = {
  xxs: verticalScale(2),
  xs: verticalScale(4),
  sm: verticalScale(8),
  md: verticalScale(12),
  base: verticalScale(16),
  lg: verticalScale(20),
  xl: verticalScale(24),
  '2xl': verticalScale(32),
  '3xl': verticalScale(40),
  '4xl': verticalScale(48),
  '5xl': verticalScale(64),
} as const;

/**
 * Typography System
 * iOS: SF Pro (system default)
 * Android: Roboto (system default)
 *
 * Font sizes use moderateScale for balanced scaling
 * Line heights follow platform standards (iOS: 1.2-1.4, Android: 1.5)
 */
export const TYPOGRAPHY = {
  // Display sizes (hero sections, large headings)
  display: {
    fontSize: moderateScale(34),
    lineHeight: moderateScale(41),
    fontWeight: '700' as const,
    letterSpacing: Platform.OS === 'ios' ? 0.4 : 0,
  },

  // Headings
  h1: {
    fontSize: moderateScale(28),
    lineHeight: moderateScale(34),
    fontWeight: '700' as const,
    letterSpacing: Platform.OS === 'ios' ? 0.36 : 0,
  },
  h2: {
    fontSize: moderateScale(22),
    lineHeight: moderateScale(28),
    fontWeight: '600' as const,
    letterSpacing: Platform.OS === 'ios' ? 0.35 : 0,
  },
  h3: {
    fontSize: moderateScale(18),
    lineHeight: moderateScale(24),
    fontWeight: '600' as const,
    letterSpacing: Platform.OS === 'ios' ? 0 : 0.15,
  },

  // Body text
  body: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
    fontWeight: '400' as const,
    letterSpacing: Platform.OS === 'ios' ? 0 : 0.5,
  },
  bodyMedium: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
    fontWeight: '500' as const,
    letterSpacing: Platform.OS === 'ios' ? 0 : 0.5,
  },
  bodySemibold: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
    fontWeight: '600' as const,
    letterSpacing: Platform.OS === 'ios' ? 0 : 0.5,
  },

  // Secondary text
  callout: {
    fontSize: moderateScale(15),
    lineHeight: moderateScale(22),
    fontWeight: '400' as const,
    letterSpacing: Platform.OS === 'ios' ? 0 : 0.4,
  },

  // Small text
  subheadline: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    fontWeight: '400' as const,
    letterSpacing: Platform.OS === 'ios' ? 0 : 0.1,
  },
  footnote: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    fontWeight: '400' as const,
    letterSpacing: Platform.OS === 'ios' ? 0 : 0.4,
  },

  // Micro text (labels, badges)
  caption1: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(16),
    fontWeight: '400' as const,
    letterSpacing: Platform.OS === 'ios' ? 0 : 0.4,
  },
  caption2: {
    fontSize: moderateScale(11),
    lineHeight: moderateScale(14),
    fontWeight: '400' as const,
    letterSpacing: Platform.OS === 'ios' ? 0.07 : 0.5,
  },

  // Button text
  buttonLarge: {
    fontSize: moderateScale(17),
    lineHeight: moderateScale(22),
    fontWeight: '600' as const,
    letterSpacing: Platform.OS === 'ios' ? 0 : 0.5,
  },
  button: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(21),
    fontWeight: '600' as const,
    letterSpacing: Platform.OS === 'ios' ? 0 : 0.5,
  },
  buttonSmall: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(18),
    fontWeight: '600' as const,
    letterSpacing: Platform.OS === 'ios' ? 0 : 0.5,
  },
} as const;

/**
 * Border Radius System
 * iOS: Continuous curves (16-20px standard)
 * Android Material 3: Rounded corners (12-16px standard)
 */
export const BORDER_RADIUS = {
  none: 0,
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  '2xl': moderateScale(24),
  '3xl': moderateScale(32),
  full: 9999,

  // Component-specific
  card: moderateScale(16),
  button: moderateScale(12),
  input: moderateScale(10),
  badge: moderateScale(8),
  avatar: 9999,
} as const;

/**
 * Icon Sizes (responsive)
 */
export const ICON_SIZES = {
  xs: moderateScale(16),
  sm: moderateScale(20),
  md: moderateScale(24),
  lg: moderateScale(28),
  xl: moderateScale(32),
  '2xl': moderateScale(40),
  '3xl': moderateScale(48),
} as const;

/**
 * Shadow/Elevation System
 * iOS: Shadow with blur
 * Android: Elevation with Material Design specs
 */
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 12,
    },
  }),
} as const;

/**
 * Component Size Presets
 * For buttons, inputs, cards, etc.
 */
export const COMPONENT_SIZES = {
  button: {
    small: {
      height: verticalScale(36),
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(8),
    },
    medium: {
      height: verticalScale(48),
      paddingHorizontal: scale(24),
      paddingVertical: verticalScale(12),
    },
    large: {
      height: verticalScale(56),
      paddingHorizontal: scale(32),
      paddingVertical: verticalScale(16),
    },
  },
  input: {
    small: {
      height: verticalScale(40),
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(8),
    },
    medium: {
      height: verticalScale(48),
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(12),
    },
    large: {
      height: verticalScale(56),
      paddingHorizontal: scale(20),
      paddingVertical: verticalScale(16),
    },
  },
  avatar: {
    xs: moderateScale(24),
    sm: moderateScale(32),
    md: moderateScale(40),
    lg: moderateScale(56),
    xl: moderateScale(72),
    '2xl': moderateScale(96),
  },
} as const;

/**
 * Grid System for Card Layouts
 * Calculates card width based on columns and gaps
 */
export const getCardWidth = (columns: number = 2, gap: number = SPACING.md) => {
  const containerPadding = SPACING.screenPadding * 2;
  const totalGap = gap * (columns - 1);
  const availableWidth = SCREEN_WIDTH - containerPadding - totalGap;
  return availableWidth / columns;
};

/**
 * Responsive Card Dimensions
 * Replaces hard-coded w-[149px] h-[176px] patterns
 */
export const CARD_DIMENSIONS = {
  // Profile cards (2 columns on phone, 3-4 on tablet)
  profile: {
    width: IS_TABLET ? getCardWidth(4) : getCardWidth(2),
    height: IS_TABLET ? verticalScale(200) : verticalScale(176),
  },

  // Event cards (2 columns)
  event: {
    width: IS_TABLET ? getCardWidth(3) : getCardWidth(2),
    height: IS_TABLET ? verticalScale(200) : verticalScale(176),
  },

  // Video cards (2 columns, landscape aspect)
  video: {
    width: IS_TABLET ? getCardWidth(3) : getCardWidth(2),
    height: IS_TABLET ? verticalScale(140) : verticalScale(127),
  },

  // Large feature cards (1 column, spans most of width)
  featured: {
    width: SCREEN_WIDTH - (SPACING.screenPadding * 2),
    height: verticalScale(263),
  },

  // Horizontal list items (compact)
  listItem: {
    width: scale(154),
    height: verticalScale(175),
  },
} as const;

/**
 * Layout Constants
 */
export const LAYOUT = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  tabBarHeight: Platform.OS === 'ios' ? verticalScale(83) : verticalScale(56),
  headerHeight: Platform.OS === 'ios' ? verticalScale(44) : verticalScale(56),
  bottomSheetSnapPoints: ['78%', '85%'], // Percentages work better than fixed values
} as const;

/**
 * Animation Timings (Native feel - iOS/Android standard)
 * iOS: Shorter, snappier animations
 * Android: Slightly longer, material motion
 */
export const ANIMATION = {
  fast: Platform.OS === 'ios' ? 200 : 250,
  normal: Platform.OS === 'ios' ? 300 : 350,
  slow: Platform.OS === 'ios' ? 500 : 600,
} as const;

/**
 * Hit Slop for Touch Targets
 * Minimum 44x44pt for iOS, 48x48dp for Android (accessibility standard)
 */
export const HIT_SLOP = {
  small: { top: 8, bottom: 8, left: 8, right: 8 },
  medium: { top: 12, bottom: 12, left: 12, right: 12 },
  large: { top: 16, bottom: 16, left: 16, right: 16 },
} as const;

/**
 * Z-Index Layers (for proper stacking)
 */
export const Z_INDEX = {
  background: -1,
  base: 0,
  elevated: 10,
  overlay: 100,
  modal: 1000,
  toast: 2000,
  dropdown: 3000,
} as const;
