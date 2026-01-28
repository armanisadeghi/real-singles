/**
 * Responsive Design Hooks
 * Modern 2026 utilities for native mobile development
 */

import { useMemo } from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { BREAKPOINTS, SPACING, VERTICAL_SPACING } from '@/constants/designTokens';

/**
 * Hook to get safe area insets with convenient accessors
 * Replaces hard-coded padding like pt-10, pb-28
 */
export const useSafeArea = () => {
  const insets = useSafeAreaInsets();

  return useMemo(() => ({
    // Raw insets
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,

    // Padding styles (add safe area to standard spacing)
    paddingTop: insets.top + VERTICAL_SPACING.base,
    paddingBottom: insets.bottom + VERTICAL_SPACING.base,
    paddingLeft: insets.left + SPACING.screenPadding,
    paddingRight: insets.right + SPACING.screenPadding,

    // Screen-specific padding (with additional spacing)
    screenTop: insets.top + VERTICAL_SPACING.lg,
    screenBottom: insets.bottom + VERTICAL_SPACING.lg,

    // Container padding (includes safe area)
    container: {
      paddingTop: insets.top + VERTICAL_SPACING.md,
      paddingBottom: insets.bottom + VERTICAL_SPACING.md,
      paddingLeft: insets.left + SPACING.screenPadding,
      paddingRight: insets.right + SPACING.screenPadding,
    },

    // Tab bar spacing (for content that should sit above bottom tabs)
    tabBarPadding: insets.bottom + (Platform.OS === 'ios' ? 83 : 56),

    // Keyboard avoiding offset
    keyboardOffset: insets.bottom > 0 ? insets.bottom : VERTICAL_SPACING.md,
  }), [insets]);
};

/**
 * Hook to get device size category and responsive utilities
 */
export const useDeviceSize = () => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isSmall = width < BREAKPOINTS.medium;
    const isMedium = width >= BREAKPOINTS.medium && width < BREAKPOINTS.large;
    const isLarge = width >= BREAKPOINTS.large && width < BREAKPOINTS.xl;
    const isXL = width >= BREAKPOINTS.xl && width < BREAKPOINTS.tablet;
    
    // Android 16 requires adaptive layouts at 600dp, iOS uses 768px
    // This ensures compliance with Android 16's mandatory adaptive layout requirements
    const tabletBreakpoint = Platform.OS === 'android' 
      ? BREAKPOINTS.adaptiveLayout  // 600dp for Android 16
      : BREAKPOINTS.tablet;         // 768px for iOS
    const isTablet = width >= tabletBreakpoint;

    // Responsive columns for grids
    const gridColumns = isTablet ? 4 : isXL ? 3 : 2;

    // Responsive horizontal margins
    const screenMargin = isTablet ? SPACING['3xl'] : SPACING.screenPadding;

    return {
      width,
      height,
      isSmall,
      isMedium,
      isLarge,
      isXL,
      isTablet,
      isPhone: !isTablet,
      gridColumns,
      screenMargin,

      // Orientation
      isLandscape: width > height,
      isPortrait: width <= height,

      // Get responsive value based on device size
      responsive: <T,>(values: {
        small?: T;
        medium?: T;
        large?: T;
        xl?: T;
        tablet?: T;
        default: T;
      }) => {
        if (isTablet && values.tablet !== undefined) return values.tablet;
        if (isXL && values.xl !== undefined) return values.xl;
        if (isLarge && values.large !== undefined) return values.large;
        if (isMedium && values.medium !== undefined) return values.medium;
        if (isSmall && values.small !== undefined) return values.small;
        return values.default;
      },
    };
  }, [width, height]);
};

/**
 * Hook for responsive scaling utilities
 * Use these instead of hard-coded pixel values
 */
export const useScale = () => {
  return useMemo(() => ({
    // Horizontal scaling (for widths, horizontal margins/padding)
    scale,

    // Vertical scaling (for heights, vertical margins/padding)
    verticalScale,

    // Moderate scaling (for font sizes, border radius)
    moderateScale,

    // Quick helpers
    s: scale,
    vs: verticalScale,
    ms: moderateScale,
  }), []);
};

/**
 * Hook to calculate responsive card dimensions
 * Replaces hard-coded w-[149px] h-[176px]
 */
export const useCardDimensions = (
  columns: number = 2,
  aspectRatio: number = 1.18 // Default profile card ratio (176/149)
) => {
  const { width: screenWidth } = useWindowDimensions();
  const { screenMargin } = useDeviceSize();

  return useMemo(() => {
    const horizontalPadding = screenMargin * 2;
    const gap = SPACING.md;
    const totalGap = gap * (columns - 1);
    const availableWidth = screenWidth - horizontalPadding - totalGap;
    const cardWidth = availableWidth / columns;
    const cardHeight = cardWidth * aspectRatio;

    return {
      width: cardWidth,
      height: cardHeight,
      gap,
      containerPadding: screenMargin,
    };
  }, [screenWidth, columns, aspectRatio, screenMargin]);
};

/**
 * Hook for responsive spacing based on device size
 * Larger devices get more breathing room
 */
export const useResponsiveSpacing = () => {
  const { isTablet, isSmall } = useDeviceSize();

  return useMemo(() => {
    const multiplier = isTablet ? 1.5 : isSmall ? 0.85 : 1;

    return {
      xs: SPACING.xs * multiplier,
      sm: SPACING.sm * multiplier,
      md: SPACING.md * multiplier,
      base: SPACING.base * multiplier,
      lg: SPACING.lg * multiplier,
      xl: SPACING.xl * multiplier,
      '2xl': SPACING['2xl'] * multiplier,
      '3xl': SPACING['3xl'] * multiplier,
    };
  }, [isTablet, isSmall]);
};

/**
 * Hook for platform-specific values
 * Simplifies Platform.select() calls
 */
export const usePlatform = <T,>(ios: T, android: T): T => {
  return useMemo(() => Platform.OS === 'ios' ? ios : android, [ios, android]);
};

/**
 * Hook for adaptive bottom spacing
 * Accounts for tab bar, safe area, and keyboard
 */
export const useBottomSpacing = (hasTabBar: boolean = true) => {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const safeArea = insets.bottom || VERTICAL_SPACING.md;
    const tabBarHeight = hasTabBar
      ? (Platform.OS === 'ios' ? 83 : 56)
      : 0;

    return {
      // For ScrollView/FlatList contentContainerStyle
      contentPadding: safeArea + tabBarHeight + VERTICAL_SPACING.lg,

      // For fixed bottom buttons
      buttonBottom: safeArea + VERTICAL_SPACING.md,

      // For modal bottom sheets
      sheetBottom: safeArea,
    };
  }, [insets.bottom, hasTabBar]);
};

/**
 * Hook to get proper header spacing
 * Replaces hard-coded mt-16, pt-10 patterns
 */
export const useHeaderSpacing = (hasLargeTitle: boolean = false) => {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const statusBarHeight = insets.top;
    const headerHeight = Platform.OS === 'ios' ? 44 : 56;
    const largeTitleHeight = hasLargeTitle ? 52 : 0;

    return {
      // Total height including status bar
      totalHeight: statusBarHeight + headerHeight + largeTitleHeight,

      // Padding for content below header
      contentPadding: statusBarHeight + headerHeight + largeTitleHeight + VERTICAL_SPACING.md,

      // Just status bar + small spacing
      minimal: statusBarHeight + VERTICAL_SPACING.sm,

      // For absolutely positioned headers
      absolute: {
        top: statusBarHeight,
        height: headerHeight,
      },
    };
  }, [insets.top, hasLargeTitle]);
};

/**
 * Hook for dynamic typography scaling
 * Font sizes adapt to device size and accessibility settings
 */
export const useTypography = () => {
  const { isSmall, isTablet } = useDeviceSize();

  return useMemo(() => {
    // Scale factor based on device
    const scaleFactor = isTablet ? 1.1 : isSmall ? 0.95 : 1;

    return {
      scaleFactor,

      // Helper to scale font size
      fontSize: (base: number) => moderateScale(base * scaleFactor),
    };
  }, [isSmall, isTablet]);
};

/**
 * Hook for responsive image dimensions
 * Replaces fixed image sizes
 */
export const useImageSize = (aspectRatio: number = 1) => {
  const { width: screenWidth } = useWindowDimensions();
  const { screenMargin } = useDeviceSize();

  return useMemo(() => {
    const maxWidth = screenWidth - (screenMargin * 2);

    return {
      maxWidth,
      maxHeight: maxWidth / aspectRatio,

      // Common aspect ratios
      square: { width: maxWidth, height: maxWidth },
      landscape: { width: maxWidth, height: maxWidth * (9 / 16) },
      portrait: { width: maxWidth, height: maxWidth * (4 / 3) },
    };
  }, [screenWidth, aspectRatio, screenMargin]);
};
