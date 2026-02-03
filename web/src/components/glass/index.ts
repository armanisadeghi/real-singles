/**
 * Glass Components
 *
 * iOS 26 Liquid Glass design system for RealSingles web app.
 *
 * Components:
 * - GlassContainer: Base wrapper with liquid glass effect
 * - GlassBottomNav: Floating pill bottom navigation dock
 * - GlassTabs: Pill-style tab navigation
 * - GlassDropdown: Dropdown menus with glass effect
 * - GlassSearch: Spotlight-style search bar
 * - GlassCard: Feature/CTA cards with glass effect
 *
 * Utilities:
 * - glassPresets: Default effect presets for each variant
 * - useGlassPreset: Hook to get appropriate preset based on device/preferences
 * - useReducedMotion: Hook to detect reduced motion preference
 * - useIsMobile: Hook to detect mobile viewport
 */

// Base container
export { GlassContainer } from "./GlassContainer";

// Navigation components
export { GlassBottomNav } from "./GlassBottomNav";
export { GlassTabs, type Tab } from "./GlassTabs";

// Menu components
export {
  GlassDropdown,
  GlassDropdownItem,
  GlassDropdownDivider,
} from "./GlassDropdown";

// Input components
export { GlassSearch } from "./GlassSearch";

// Card components
export { GlassCard, GlassCardHeader, GlassBadge } from "./GlassCard";

// Utilities and hooks
export {
  glassPresets,
  mobileGlassPresets,
  reducedMotionPresets,
  useGlassPreset,
  useReducedMotion,
  useIsMobile,
  type GlassVariant,
  type GlassPreset,
} from "./glass-utils";
