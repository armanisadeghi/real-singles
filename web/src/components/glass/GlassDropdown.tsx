"use client";

/**
 * GlassDropdown
 *
 * iOS 26 Liquid Glass dropdown menu container.
 * For use with header menus, filter dropdowns, etc.
 *
 * Features:
 * - True liquid glass effect with edge refraction
 * - Proper ARIA menu semantics
 * - Animation support
 */

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { GlassContainer } from "./GlassContainer";

interface GlassDropdownProps {
  children: React.ReactNode;
  /** Whether the dropdown is currently open */
  isOpen: boolean;
  /** Optional className for the container */
  className?: string;
  /** Optional ARIA label */
  ariaLabel?: string;
}

export const GlassDropdown = forwardRef<HTMLDivElement, GlassDropdownProps>(
  function GlassDropdown({ children, isOpen, className, ariaLabel }, ref) {
    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        role="menu"
        aria-orientation="vertical"
        aria-label={ariaLabel}
        className={cn(
          "absolute z-50",
          "animate-in fade-in slide-in-from-top-2 duration-200",
          className
        )}
      >
        <GlassContainer variant="menu" className="py-1.5 shadow-xl shadow-black/10">
          {children}
        </GlassContainer>
      </div>
    );
  }
);

/**
 * GlassDropdownItem
 *
 * Individual menu item for GlassDropdown.
 */
interface GlassDropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  /** Whether this is a destructive action (shows in red) */
  destructive?: boolean;
  /** Optional className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function GlassDropdownItem({
  children,
  onClick,
  href,
  destructive = false,
  className,
  disabled = false,
}: GlassDropdownItemProps) {
  const baseClasses = cn(
    "block w-full text-left px-4 py-2.5 text-sm transition-colors",
    "focus:outline-none focus:bg-white/40",
    destructive
      ? "text-red-600 hover:bg-red-50/50 focus:bg-red-50/50"
      : "text-gray-700 hover:bg-white/40",
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  if (href && !disabled) {
    // Using dynamic import to avoid issues with Link
    const Link = require("next/link").default;
    return (
      <Link href={href} role="menuitem" tabIndex={-1} className={baseClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={baseClasses}
    >
      {children}
    </button>
  );
}

/**
 * GlassDropdownDivider
 *
 * Separator line for GlassDropdown.
 */
export function GlassDropdownDivider() {
  return <hr className="my-1.5 border-white/20" aria-hidden="true" />;
}
