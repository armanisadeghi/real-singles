"use client";

/**
 * GlassSearch
 *
 * iOS 26 Liquid Glass spotlight-style search bar.
 * Similar to iOS Messages search bar.
 *
 * Features:
 * - Pill-shaped glass effect
 * - Search icon with proper alignment
 * - Clear button when text is present
 * - Keyboard shortcut hint (optional)
 */

import { forwardRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassContainer } from "./GlassContainer";

interface GlassSearchProps {
  /** Current search value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Optional keyboard shortcut hint (e.g., "⌘K") */
  shortcutHint?: string;
  /** Callback when search is submitted */
  onSubmit?: (value: string) => void;
  /** Optional className */
  className?: string;
  /** Auto focus on mount */
  autoFocus?: boolean;
}

export const GlassSearch = forwardRef<HTMLInputElement, GlassSearchProps>(
  function GlassSearch(
    {
      value,
      onChange,
      placeholder = "Search...",
      shortcutHint,
      onSubmit,
      className,
      autoFocus = false,
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit?.(value);
    };

    const handleClear = () => {
      onChange("");
    };

    return (
      <GlassContainer variant="search" className={cn("w-full", className)}>
        <form
          onSubmit={handleSubmit}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5",
            "transition-all duration-200",
            isFocused && "ring-2 ring-pink-500/50 ring-inset rounded-full"
          )}
        >
          {/* Search icon */}
          <Search
            className={cn(
              "w-5 h-5 flex-shrink-0 transition-colors",
              isFocused ? "text-pink-500" : "text-gray-400"
            )}
            aria-hidden="true"
          />

          {/* Input */}
          <input
            ref={ref}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "flex-1 bg-transparent border-none outline-none",
              "text-gray-900 placeholder:text-gray-400",
              "text-base", // 16px minimum for iOS to prevent zoom
              "min-w-0" // Allow shrinking
            )}
          />

          {/* Clear button or keyboard shortcut hint */}
          {value ? (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "flex-shrink-0 p-1 rounded-full",
                "text-gray-400 hover:text-gray-600 hover:bg-white/50",
                "transition-colors"
              )}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : shortcutHint ? (
            <span className="flex-shrink-0 text-xs text-gray-400 font-medium px-1.5 py-0.5 bg-white/30 rounded">
              {shortcutHint}
            </span>
          ) : null}
        </form>
      </GlassContainer>
    );
  }
);
