/**
 * Platform Colors Utility
 * 
 * Provides platform-native colors that adapt to light/dark mode on iOS.
 * Uses PlatformColor on iOS and fallback colors on Android.
 * 
 * Usage:
 * import { Colors } from '@/utils/platformColors';
 * 
 * <View style={{ backgroundColor: Colors.background }} />
 * <Text style={{ color: Colors.label }} />
 */

import { Platform, PlatformColor } from 'react-native';

/**
 * Get a platform-appropriate color
 * On iOS: Returns PlatformColor that adapts to light/dark mode
 * On Android: Returns the provided fallback color
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
