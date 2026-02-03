"use client";

/**
 * Glass Component Utilities
 *
 * Shared presets, hooks, and configurations for iOS 26 Liquid Glass effects.
 */

// ============================================================================
// Glass Effect Presets
// ============================================================================

/** Glass effect preset configuration */
export interface GlassPreset {
  displacementScale: number;
  blurAmount: number;
  saturation: number;
  cornerRadius: number;
}

export type GlassVariant = "nav" | "tabs" | "card" | "menu" | "search" | "chatInput";

export const glassPresets: Record<GlassVariant, GlassPreset> = {
  /** Bottom navigation dock - strongest effect */
  nav: {
    displacementScale: 50,
    blurAmount: 0.06,
    saturation: 140,
    cornerRadius: 24,
  },
  /** Tab navigation pills */
  tabs: {
    displacementScale: 35,
    blurAmount: 0.05,
    saturation: 140,
    cornerRadius: 999,
  },
  /** Cards and panels */
  card: {
    displacementScale: 40,
    blurAmount: 0.05,
    saturation: 140,
    cornerRadius: 20,
  },
  /** Dropdown menus */
  menu: {
    displacementScale: 30,
    blurAmount: 0.04,
    saturation: 140,
    cornerRadius: 16,
  },
  /** Search bars */
  search: {
    displacementScale: 35,
    blurAmount: 0.05,
    saturation: 140,
    cornerRadius: 999,
  },
  /** Chat input bar */
  chatInput: {
    displacementScale: 40,
    blurAmount: 0.06,
    saturation: 140,
    cornerRadius: 24,
  },
};

// ============================================================================
// Mobile-optimized presets (reduced for performance)
// ============================================================================

export const mobileGlassPresets: Record<GlassVariant, GlassPreset> = {
  nav: {
    displacementScale: 30,
    blurAmount: 0.04,
    saturation: 130,
    cornerRadius: 24,
  },
  tabs: {
    displacementScale: 20,
    blurAmount: 0.04,
    saturation: 130,
    cornerRadius: 999,
  },
  card: {
    displacementScale: 25,
    blurAmount: 0.04,
    saturation: 130,
    cornerRadius: 20,
  },
  menu: {
    displacementScale: 20,
    blurAmount: 0.03,
    saturation: 130,
    cornerRadius: 16,
  },
  search: {
    displacementScale: 20,
    blurAmount: 0.04,
    saturation: 130,
    cornerRadius: 999,
  },
  chatInput: {
    displacementScale: 25,
    blurAmount: 0.04,
    saturation: 130,
    cornerRadius: 24,
  },
};

// ============================================================================
// Reduced motion presets (no displacement, simple blur)
// ============================================================================

export const reducedMotionPresets: Record<GlassVariant, GlassPreset> = {
  nav: { displacementScale: 0, blurAmount: 0.06, saturation: 120, cornerRadius: 24 },
  tabs: { displacementScale: 0, blurAmount: 0.05, saturation: 120, cornerRadius: 999 },
  card: { displacementScale: 0, blurAmount: 0.05, saturation: 120, cornerRadius: 20 },
  menu: { displacementScale: 0, blurAmount: 0.04, saturation: 120, cornerRadius: 16 },
  search: { displacementScale: 0, blurAmount: 0.05, saturation: 120, cornerRadius: 999 },
  chatInput: { displacementScale: 0, blurAmount: 0.06, saturation: 120, cornerRadius: 24 },
};

// ============================================================================
// Hooks
// ============================================================================

import { useEffect, useState } from "react";

/**
 * Hook to detect if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to detect mobile viewport
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook to get the appropriate glass preset based on device and preferences
 */
export function useGlassPreset(variant: GlassVariant) {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  if (prefersReducedMotion) {
    return reducedMotionPresets[variant];
  }

  if (isMobile) {
    return mobileGlassPresets[variant];
  }

  return glassPresets[variant];
}
