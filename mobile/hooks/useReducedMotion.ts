/**
 * useReducedMotion Hook
 * 
 * Checks if the user has enabled reduced motion in accessibility settings.
 * When enabled, animations should be minimized or skipped entirely.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Returns true if the user prefers reduced motion.
 * Use this to conditionally skip or minimize animations.
 * 
 * @example
 * const reduceMotion = useReducedMotion();
 * const animatedValue = reduceMotion 
 *   ? targetValue 
 *   : withSpring(targetValue, SPRING_CONFIG);
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Web doesn't have AccessibilityInfo
    if (Platform.OS === 'web') {
      // Check CSS prefers-reduced-motion
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReduceMotion(mediaQuery.matches);
        
        const handler = (event: MediaQueryListEvent) => {
          setReduceMotion(event.matches);
        };
        
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      }
      return;
    }

    // Mobile platforms
    const checkReduceMotion = async () => {
      try {
        const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        setReduceMotion(isEnabled);
      } catch (error) {
        console.warn('Failed to check reduce motion setting:', error);
      }
    };

    checkReduceMotion();

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled) => setReduceMotion(isEnabled)
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return reduceMotion;
}

/**
 * Spring configuration that respects reduced motion.
 * Returns instant transition config when reduce motion is enabled.
 */
export function getSpringConfig(reduceMotion: boolean, config?: {
  damping?: number;
  stiffness?: number;
  mass?: number;
}) {
  if (reduceMotion) {
    // Instant transition - no animation
    return {
      damping: 100,
      stiffness: 1000,
      mass: 0.1,
    };
  }

  // Default M3 Expressive spring config
  return {
    damping: config?.damping ?? 15,
    stiffness: config?.stiffness ?? 150,
    mass: config?.mass ?? 1,
  };
}

export default useReducedMotion;
