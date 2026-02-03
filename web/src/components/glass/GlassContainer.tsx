"use client";

/**
 * GlassContainer
 *
 * Base wrapper component for iOS 26 Liquid Glass effects.
 * Wraps content with LiquidGlass and applies app-consistent defaults.
 *
 * Features:
 * - Multiple variants for different UI contexts (nav, card, menu, search, etc.)
 * - Automatic mobile optimization (reduced displacement for performance)
 * - Respects user's reduced motion preference
 * - Graceful fallback for unsupported browsers
 */

import LiquidGlass from "liquid-glass-react";
import { cn } from "@/lib/utils";
import { useGlassPreset, type GlassVariant } from "./glass-utils";

interface GlassContainerProps {
  children: React.ReactNode;
  /** Glass effect variant - determines displacement, blur, and corner radius */
  variant?: GlassVariant;
  /** Additional CSS classes */
  className?: string;
  /** Override the default mode (standard, polar, prominent, shader) */
  mode?: "standard" | "polar" | "prominent" | "shader";
  /** Custom inline styles */
  style?: React.CSSProperties;
}

export function GlassContainer({
  children,
  variant = "card",
  className,
  mode = "prominent",
  style,
}: GlassContainerProps) {
  const preset = useGlassPreset(variant);

  return (
    <LiquidGlass
      displacementScale={preset.displacementScale}
      blurAmount={preset.blurAmount}
      saturation={preset.saturation}
      cornerRadius={preset.cornerRadius}
      mode={mode}
      className={cn(className)}
      style={style}
    >
      {children}
    </LiquidGlass>
  );
}
