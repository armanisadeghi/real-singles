/**
 * Theme Context for RealSingles Mobile App
 * 
 * Provides platform-native theming:
 * - Android: Material You dynamic colors via @pchmn/expo-material3-theme
 * - iOS: PlatformColor for native system colors
 * 
 * Also handles dark/light mode detection via useColorScheme()
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { useMaterial3Theme, Material3Theme } from '@pchmn/expo-material3-theme';
import { 
  MD3LightTheme, 
  MD3DarkTheme, 
  Provider as PaperProvider,
  adaptNavigationTheme,
  MD3Theme,
} from 'react-native-paper';
import { Colors } from '@/utils/platformColors';

// Brand color for both platforms
const BRAND_PRIMARY = '#B06D1E';
const BRAND_BACKGROUND = '#FFFAF2';

/**
 * Combined theme interface for both platforms
 */
interface ThemeColors {
  // Core
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  
  // Secondary
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  
  // Tertiary
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  
  // Background & Surface
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  
  // Error
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  
  // Outline & Inverse
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  
  // Special
  elevation: {
    level0: string;
    level1: string;
    level2: string;
    level3: string;
    level4: string;
    level5: string;
  };
}

interface AppTheme {
  dark: boolean;
  colors: ThemeColors;
  paperTheme: MD3Theme;
}

const ThemeContext = createContext<AppTheme | null>(null);

/**
 * Create iOS theme colors from PlatformColor
 */
function createIOSColors(isDark: boolean): ThemeColors {
  return {
    // Core - Brand colors for iOS
    primary: BRAND_PRIMARY,
    onPrimary: '#FFFFFF',
    primaryContainer: isDark ? '#4A2E0D' : '#FFE0C4',
    onPrimaryContainer: isDark ? '#FFE0C4' : '#3D2408',
    
    // Secondary
    secondary: '#725747',
    onSecondary: '#FFFFFF',
    secondaryContainer: isDark ? '#5B4035' : '#FFE0D0',
    onSecondaryContainer: isDark ? '#FFE0D0' : '#2B1608',
    
    // Tertiary
    tertiary: '#5D5F34',
    onTertiary: '#FFFFFF',
    tertiaryContainer: isDark ? '#464825' : '#E2E4AE',
    onTertiaryContainer: isDark ? '#E2E4AE' : '#1A1C00',
    
    // Background & Surface - Use iOS system colors
    background: isDark ? '#000000' : BRAND_BACKGROUND,
    onBackground: isDark ? '#E6E1DC' : '#1F1B16',
    surface: isDark ? '#1C1B1F' : '#FFFBFF',
    onSurface: isDark ? '#E6E1DC' : '#1F1B16',
    surfaceVariant: isDark ? '#4F4539' : '#F4DFD1',
    onSurfaceVariant: isDark ? '#D3C4B4' : '#52443A',
    surfaceContainerLowest: isDark ? '#0E0E0E' : '#FFFFFF',
    surfaceContainerLow: isDark ? '#1C1B1A' : '#FEF6EE',
    surfaceContainer: isDark ? '#201F1E' : '#F9F0E8',
    surfaceContainerHigh: isDark ? '#2B2928' : '#F3EAE2',
    surfaceContainerHighest: isDark ? '#363433' : '#EDE5DC',
    
    // Error
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: isDark ? '#8C1D18' : '#FFDAD6',
    onErrorContainer: isDark ? '#FFDAD6' : '#410E0B',
    
    // Outline & Inverse
    outline: isDark ? '#9D8E81' : '#847468',
    outlineVariant: isDark ? '#4F4539' : '#D8C8BB',
    inverseSurface: isDark ? '#E6E1DC' : '#352F2B',
    inverseOnSurface: isDark ? '#352F2B' : '#FCEEEA',
    inversePrimary: isDark ? '#FFBA70' : '#7F4E19',
    
    // Elevation
    elevation: {
      level0: 'transparent',
      level1: isDark ? '#26201C' : '#FEF6EE',
      level2: isDark ? '#2C2520' : '#FCF0E5',
      level3: isDark ? '#322B25' : '#FAEADE',
      level4: isDark ? '#342D26' : '#F9E7DA',
      level5: isDark ? '#38302A' : '#F7E3D3',
    },
  };
}

/**
 * Create Android theme colors from Material You
 */
function createAndroidColors(
  material3Theme: Material3Theme,
  isDark: boolean
): ThemeColors {
  const scheme = isDark ? material3Theme.dark : material3Theme.light;
  
  return {
    // Core - Use Material You colors but override primary with brand
    primary: scheme.primary,
    onPrimary: scheme.onPrimary,
    primaryContainer: scheme.primaryContainer,
    onPrimaryContainer: scheme.onPrimaryContainer,
    
    // Secondary
    secondary: scheme.secondary,
    onSecondary: scheme.onSecondary,
    secondaryContainer: scheme.secondaryContainer,
    onSecondaryContainer: scheme.onSecondaryContainer,
    
    // Tertiary
    tertiary: scheme.tertiary,
    onTertiary: scheme.onTertiary,
    tertiaryContainer: scheme.tertiaryContainer,
    onTertiaryContainer: scheme.onTertiaryContainer,
    
    // Background & Surface
    background: scheme.background,
    onBackground: scheme.onBackground,
    surface: scheme.surface,
    onSurface: scheme.onSurface,
    surfaceVariant: scheme.surfaceVariant,
    onSurfaceVariant: scheme.onSurfaceVariant,
    surfaceContainerLowest: scheme.surfaceContainerLowest || scheme.surface,
    surfaceContainerLow: scheme.surfaceContainerLow || scheme.surface,
    surfaceContainer: scheme.surfaceContainer || scheme.surfaceVariant,
    surfaceContainerHigh: scheme.surfaceContainerHigh || scheme.surfaceVariant,
    surfaceContainerHighest: scheme.surfaceContainerHighest || scheme.surfaceVariant,
    
    // Error
    error: scheme.error,
    onError: scheme.onError,
    errorContainer: scheme.errorContainer,
    onErrorContainer: scheme.onErrorContainer,
    
    // Outline & Inverse
    outline: scheme.outline,
    outlineVariant: scheme.outlineVariant,
    inverseSurface: scheme.inverseSurface,
    inverseOnSurface: scheme.inverseOnSurface,
    inversePrimary: scheme.inversePrimary,
    
    // Elevation
    elevation: {
      level0: 'transparent',
      level1: scheme.surfaceContainerLow || scheme.surface,
      level2: scheme.surfaceContainer || scheme.surfaceVariant,
      level3: scheme.surfaceContainerHigh || scheme.surfaceVariant,
      level4: scheme.surfaceContainerHigh || scheme.surfaceVariant,
      level5: scheme.surfaceContainerHighest || scheme.surfaceVariant,
    },
  };
}

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * 
 * Wraps the app with Material 3 theming for Android
 * and provides color scheme detection for both platforms.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Get Material 3 theme from system (Android) or use fallback
  const { theme: material3Theme } = useMaterial3Theme({
    fallbackSourceColor: BRAND_PRIMARY,
  });
  
  // Build theme based on platform
  const appTheme = useMemo<AppTheme>(() => {
    const colors = Platform.OS === 'android'
      ? createAndroidColors(material3Theme, isDark)
      : createIOSColors(isDark);
    
    // Create Paper theme
    const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
    const paperTheme: MD3Theme = {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        onPrimary: colors.onPrimary,
        primaryContainer: colors.primaryContainer,
        onPrimaryContainer: colors.onPrimaryContainer,
        secondary: colors.secondary,
        onSecondary: colors.onSecondary,
        secondaryContainer: colors.secondaryContainer,
        onSecondaryContainer: colors.onSecondaryContainer,
        tertiary: colors.tertiary,
        onTertiary: colors.onTertiary,
        tertiaryContainer: colors.tertiaryContainer,
        onTertiaryContainer: colors.onTertiaryContainer,
        error: colors.error,
        onError: colors.onError,
        errorContainer: colors.errorContainer,
        onErrorContainer: colors.onErrorContainer,
        background: colors.background,
        onBackground: colors.onBackground,
        surface: colors.surface,
        onSurface: colors.onSurface,
        surfaceVariant: colors.surfaceVariant,
        onSurfaceVariant: colors.onSurfaceVariant,
        outline: colors.outline,
        outlineVariant: colors.outlineVariant,
        inverseSurface: colors.inverseSurface,
        inverseOnSurface: colors.inverseOnSurface,
        inversePrimary: colors.inversePrimary,
        elevation: colors.elevation,
      },
    };
    
    return {
      dark: isDark,
      colors,
      paperTheme,
    };
  }, [material3Theme, isDark]);
  
  return (
    <ThemeContext.Provider value={appTheme}>
      <PaperProvider theme={appTheme.paperTheme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme colors
 * 
 * @example
 * const { colors, dark } = useTheme();
 * <View style={{ backgroundColor: colors.surface }} />
 */
export function useTheme(): AppTheme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}

/**
 * Hook to get just the colors
 */
export function useThemeColors(): ThemeColors {
  const { colors } = useTheme();
  return colors;
}

/**
 * Hook to check if dark mode is enabled
 */
export function useIsDarkMode(): boolean {
  const { dark } = useTheme();
  return dark;
}

export default ThemeProvider;
