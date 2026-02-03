"use client";

/**
 * GlassTabs
 *
 * iOS 26 Liquid Glass pill-style tab navigation.
 * Designed for inline tab switching like Tinder's Likes page.
 *
 * Features:
 * - Floating glass pill container
 * - Active tab indicator with subtle glass effect
 * - Proper ARIA accessibility
 * - Smooth transitions
 */

import { cn } from "@/lib/utils";
import { GlassContainer } from "./GlassContainer";

export interface Tab {
  id: string;
  label: string;
  /** Optional badge count */
  badge?: number;
}

interface GlassTabsProps {
  /** Array of tab definitions */
  tabs: Tab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab changes */
  onChange: (id: string) => void;
  /** Optional ARIA label for the tablist */
  ariaLabel?: string;
  /** Optional className for the container */
  className?: string;
}

export function GlassTabs({
  tabs,
  activeTab,
  onChange,
  ariaLabel = "Tab navigation",
  className,
}: GlassTabsProps) {
  return (
    <GlassContainer variant="tabs" className={cn("p-1", className)}>
      <div role="tablist" aria-label={ariaLabel} className="flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-full text-sm font-medium transition-all relative",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1",
                isActive
                  ? "bg-white/80 text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/30"
              )}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={cn(
                    "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1",
                    "flex items-center justify-center",
                    "text-[10px] font-bold rounded-full",
                    isActive
                      ? "bg-pink-500 text-white"
                      : "bg-gray-400 text-white"
                  )}
                >
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </GlassContainer>
  );
}
