/**
 * LiquidGlass Component and Hook
 * 
 * Provides Liquid Glass effect for iOS 26+ with proper availability checks
 * and accessibility support. Falls back to solid backgrounds when:
 * - Not on iOS
 * - iOS 26 Liquid Glass is not available
 * - User has "Reduce Transparency" enabled
 * 
 * @see https://docs.expo.dev/versions/latest/sdk/glass-effect/
 */

import React, { useEffect, useState } from 'react';
import { 
  AccessibilityInfo, 
  Platform, 
  StyleProp, 
  View, 
  ViewStyle 
} from 'react-native';

// Type for glass effect styles
type GlassStyle = 'clear' | 'regular';

// Conditionally import expo-glass-effect with proper error handling
let GlassView: React.ComponentType<{
  style?: StyleProp<ViewStyle>;
  isInteractive?: boolean;
  glassEffectStyle?: GlassStyle;
  tintColor?: string;
  children?: React.ReactNode;
}> | null = null;

let GlassContainer: React.ComponentType<{
  style?: StyleProp<ViewStyle>;
  spacing?: number;
  children?: React.ReactNode;
}> | null = null;

// Flags for availability
let glassEffectLoaded = false;
let liquidGlassAvailableResult = false;
let glassEffectAPIAvailableResult = true; // Default true if function doesn't exist

// Only attempt to load on iOS
if (Platform.OS === 'ios') {
  try {
    const glassEffect = require('expo-glass-effect');
    
    if (glassEffect.GlassView) {
      GlassView = glassEffect.GlassView;
      glassEffectLoaded = true;
    }
    
    if (glassEffect.GlassContainer) {
      GlassContainer = glassEffect.GlassContainer;
    }
    
    // Safely call availability checks
    if (typeof glassEffect.isLiquidGlassAvailable === 'function') {
      try {
        liquidGlassAvailableResult = glassEffect.isLiquidGlassAvailable();
      } catch (e) {
        console.log('[LiquidGlass] isLiquidGlassAvailable check failed:', e);
        liquidGlassAvailableResult = false;
      }
    }
    
    if (typeof glassEffect.isGlassEffectAPIAvailable === 'function') {
      try {
        glassEffectAPIAvailableResult = glassEffect.isGlassEffectAPIAvailable();
      } catch (e) {
        console.log('[LiquidGlass] isGlassEffectAPIAvailable check failed:', e);
        glassEffectAPIAvailableResult = false;
      }
    }
  } catch (e) {
    // expo-glass-effect not installed or not available
    console.log('[LiquidGlass] expo-glass-effect not available:', e);
  }
}

/**
 * Hook to determine if Liquid Glass should be shown
 * Checks iOS availability, API availability, and accessibility preferences
 */
export function useLiquidGlass(): {
  showGlass: boolean;
  isAvailable: boolean;
  reduceTransparency: boolean;
} {
  const [reduceTransparency, setReduceTransparency] = useState(false);
  
  useEffect(() => {
    // Check reduce transparency preference on mount
    if (Platform.OS === 'ios') {
      AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
      
      // Listen for changes
      const subscription = AccessibilityInfo.addEventListener(
        'reduceTransparencyChanged',
        setReduceTransparency
      );
      
      return () => {
        subscription.remove();
      };
    }
  }, []);
  
  // Use pre-computed availability results
  const isAvailable = Platform.OS === 'ios' && 
    glassEffectLoaded &&
    liquidGlassAvailableResult && 
    glassEffectAPIAvailableResult &&
    GlassView !== null;
  
  const showGlass = isAvailable && !reduceTransparency;
  
  return { showGlass, isAvailable, reduceTransparency };
}

/**
 * Props for LiquidGlassView component
 */
export interface LiquidGlassViewProps {
  /** Content to render inside the glass container */
  children: React.ReactNode;
  /** Style to apply to the container */
  style?: StyleProp<ViewStyle>;
  /** Fallback background color when glass is not available */
  fallbackColor?: string;
  /** Whether the element is interactive (affects rendering) */
  isInteractive?: boolean;
  /** Glass effect style: 'clear' or 'regular' (default: 'regular') */
  glassEffectStyle?: GlassStyle;
  /** Tint color to apply to the glass effect */
  tintColor?: string;
}

/**
 * LiquidGlassView Component
 * 
 * Renders content with Liquid Glass effect on iOS 26+ or falls back to
 * solid background on older iOS versions, Android, or when accessibility
 * reduce transparency is enabled.
 * 
 * @example
 * <LiquidGlassView fallbackColor="#FFFFFF">
 *   <Text>Content with glass effect</Text>
 * </LiquidGlassView>
 */
export function LiquidGlassView({
  children,
  style,
  fallbackColor = 'rgba(255, 255, 255, 0.95)',
  isInteractive = false,
  glassEffectStyle = 'regular',
  tintColor,
}: LiquidGlassViewProps) {
  const { showGlass } = useLiquidGlass();
  
  // Render with Liquid Glass if available
  if (showGlass && GlassView) {
    return (
      <GlassView
        style={style}
        isInteractive={isInteractive}
        glassEffectStyle={glassEffectStyle}
        tintColor={tintColor}
      >
        {children}
      </GlassView>
    );
  }
  
  // Fallback to solid background
  return (
    <View style={[style, { backgroundColor: fallbackColor }]}>
      {children}
    </View>
  );
}

/**
 * LiquidGlassHeader Component
 * 
 * Specialized glass view for navigation headers with proper blur effect.
 */
export interface LiquidGlassHeaderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Whether header should be transparent with glass effect */
  transparent?: boolean;
}

export function LiquidGlassHeader({
  children,
  style,
  transparent = true,
}: LiquidGlassHeaderProps) {
  const { showGlass } = useLiquidGlass();
  
  if (!transparent) {
    return (
      <View style={[style, { backgroundColor: '#FFFFFF' }]}>
        {children}
      </View>
    );
  }
  
  if (showGlass && GlassView) {
    return (
      <GlassView
        style={style}
        isInteractive={false}
        glassEffectStyle="regular"
      >
        {children}
      </GlassView>
    );
  }
  
  // Fallback with subtle transparency
  return (
    <View style={[style, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
      {children}
    </View>
  );
}

/**
 * LiquidGlassFAB Component
 * 
 * Floating Action Button with Liquid Glass effect
 */
export interface LiquidGlassFABProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Size of the FAB */
  size?: number;
}

export function LiquidGlassFAB({
  children,
  style,
  size = 56,
}: LiquidGlassFABProps) {
  const { showGlass } = useLiquidGlass();
  
  const fabStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  };
  
  if (showGlass && GlassView) {
    return (
      <GlassView
        style={[fabStyle, style]}
        isInteractive={true}
        glassEffectStyle="regular"
      >
        {children}
      </GlassView>
    );
  }
  
  // Fallback with subtle shadow and background
  return (
    <View 
      style={[
        fabStyle, 
        { 
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

export default LiquidGlassView;
