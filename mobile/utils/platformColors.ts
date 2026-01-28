/**
 * Platform Colors Utility
 * 
 * Provides platform-native colors that adapt to light/dark mode.
 * - iOS: Uses PlatformColor which adapts automatically
 * - Android: Requires isDark parameter for proper dark mode support
 * 
 * Usage:
 * import { useAdaptiveColor, Colors } from '@/utils/platformColors';
 * 
 * // In a component:
 * const colorScheme = useColorScheme();
 * const isDark = colorScheme === 'dark';
 * const bgColor = useAdaptiveColor('systemBackground', '#FFFFFF', '#000000', isDark);
 * 
 * // Or use the Colors object (iOS-only automatic adaptation):
 * <View style={{ backgroundColor: Colors.background }} />
 */

import { Platform, PlatformColor, useColorScheme } from 'react-native';

/**
 * Get a platform-appropriate color with dark mode support
 * On iOS: Returns PlatformColor that adapts to light/dark mode automatically
 * On Android: Returns the appropriate color based on isDark parameter
 * 
 * @param iosColorName - iOS PlatformColor name (e.g., 'systemBackground')
 * @param androidLight - Android light mode color
 * @param androidDark - Android dark mode color
 * @param isDark - Whether dark mode is active (required for Android)
 */
export function useAdaptiveColor(
  iosColorName: string,
  androidLight: string,
  androidDark: string,
  isDark: boolean
): string {
  if (Platform.OS === 'ios') {
    return PlatformColor(iosColorName) as unknown as string;
  }
  return isDark ? androidDark : androidLight;
}

/**
 * Hook to get all theme-aware colors
 * Use this in components for full dark mode support on both platforms
 */
export function useSemanticColors() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return {
    isDark,
    // Backgrounds
    background: useAdaptiveColor('systemBackground', '#FFFFFF', '#000000', isDark),
    backgroundSecondary: useAdaptiveColor('secondarySystemBackground', '#F5F5F5', '#1C1C1E', isDark),
    backgroundTertiary: useAdaptiveColor('tertiarySystemBackground', '#EEEEEE', '#2C2C2E', isDark),
    surface: useAdaptiveColor('systemBackground', '#FFFFFF', '#1C1C1E', isDark),
    surfaceSecondary: useAdaptiveColor('secondarySystemBackground', '#F5F5F5', '#2C2C2E', isDark),
    
    // Text/Labels
    label: useAdaptiveColor('label', '#000000', '#FFFFFF', isDark),
    labelSecondary: useAdaptiveColor('secondaryLabel', '#6B7280', '#9CA3AF', isDark),
    labelTertiary: useAdaptiveColor('tertiaryLabel', '#9CA3AF', '#6B7280', isDark),
    
    // Separators/Borders
    separator: useAdaptiveColor('separator', '#E5E5EA', '#38383A', isDark),
    border: useAdaptiveColor('opaqueSeparator', '#EAEAEB', '#3A3A3C', isDark),
    
    // Skeleton loaders
    skeleton: useAdaptiveColor('systemGray5', '#E5E7EB', '#3A3A3C', isDark),
    
    // System colors (mostly the same in light/dark)
    systemBlue: useAdaptiveColor('systemBlue', '#007AFF', '#0A84FF', isDark),
    systemGreen: useAdaptiveColor('systemGreen', '#34C759', '#30D158', isDark),
    systemRed: useAdaptiveColor('systemRed', '#FF3B30', '#FF453A', isDark),
    systemOrange: useAdaptiveColor('systemOrange', '#FF9500', '#FF9F0A', isDark),
    systemPink: useAdaptiveColor('systemPink', '#FF2D55', '#FF375F', isDark),
  };
}

/**
 * Legacy: Get a platform-appropriate color (iOS adapts, Android uses light fallback)
 * @deprecated Use useAdaptiveColor or useSemanticColors for proper dark mode support
 */
function platformColor(iosColorName: string, androidFallback: string) {
  if (Platform.OS === 'ios') {
    return PlatformColor(iosColorName);
  }
  return androidFallback;
}

/**
 * Platform-native semantic colors
 * 
 * These colors automatically adapt to:
 * - Light/Dark mode
 * - High contrast modes
 * - Liquid Glass effects on iOS 26
 */
export const Colors = {
  // Backgrounds
  background: platformColor('systemBackground', '#FFFFFF'),
  secondaryBackground: platformColor('secondarySystemBackground', '#F2F2F7'),
  tertiaryBackground: platformColor('tertiarySystemBackground', '#FFFFFF'),
  groupedBackground: platformColor('systemGroupedBackground', '#F2F2F7'),
  
  // Labels (Text)
  label: platformColor('label', '#000000'),
  secondaryLabel: platformColor('secondaryLabel', '#8E8E93'),
  tertiaryLabel: platformColor('tertiaryLabel', '#C7C7CC'),
  quaternaryLabel: platformColor('quaternaryLabel', '#D1D1D6'),
  placeholderText: platformColor('placeholderText', '#C7C7CC'),
  
  // Separators
  separator: platformColor('separator', '#C6C6C8'),
  opaqueSeparator: platformColor('opaqueSeparator', '#C6C6C8'),
  
  // System Colors
  systemBlue: platformColor('systemBlue', '#007AFF'),
  systemGreen: platformColor('systemGreen', '#34C759'),
  systemIndigo: platformColor('systemIndigo', '#5856D6'),
  systemOrange: platformColor('systemOrange', '#FF9500'),
  systemPink: platformColor('systemPink', '#FF2D55'),
  systemPurple: platformColor('systemPurple', '#AF52DE'),
  systemRed: platformColor('systemRed', '#FF3B30'),
  systemTeal: platformColor('systemTeal', '#5AC8FA'),
  systemYellow: platformColor('systemYellow', '#FFCC00'),
  
  // Gray colors
  systemGray: platformColor('systemGray', '#8E8E93'),
  systemGray2: platformColor('systemGray2', '#AEAEB2'),
  systemGray3: platformColor('systemGray3', '#C7C7CC'),
  systemGray4: platformColor('systemGray4', '#D1D1D6'),
  systemGray5: platformColor('systemGray5', '#E5E5EA'),
  systemGray6: platformColor('systemGray6', '#F2F2F7'),
  
  // Fill colors
  fill: platformColor('systemFill', '#787880'),
  secondaryFill: platformColor('secondarySystemFill', '#787880'),
  tertiaryFill: platformColor('tertiarySystemFill', '#767680'),
  quaternaryFill: platformColor('quaternarySystemFill', '#747480'),
} as const;

/**
 * Common color mappings from hardcoded hex to semantic colors
 * Use this guide when updating files:
 * 
 * White backgrounds:
 *   #FFFFFF, #FFF → Colors.background
 * 
 * Gray backgrounds:
 *   #F2F2F7, #F5F5F5, #FAFAFA → Colors.secondaryBackground
 * 
 * Primary text:
 *   #000000, #000, #333333, #1A1A1A → Colors.label
 * 
 * Secondary text:
 *   #666666, #8E8E93, #6B7280 → Colors.secondaryLabel
 * 
 * Tertiary/muted text:
 *   #999999, #AEAEB2, #9CA3AF → Colors.tertiaryLabel
 * 
 * Borders:
 *   #E5E5EA, #E0E0E0, #D1D1D6 → Colors.separator
 * 
 * System actions:
 *   #007AFF, #0055CC → Colors.systemBlue
 *   #FF3B30 → Colors.systemRed
 *   #34C759 → Colors.systemGreen
 *   #FF9500 → Colors.systemOrange
 */

export default Colors;
