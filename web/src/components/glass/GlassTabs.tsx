"use client";

/**
 * GlassTabs
 *
 * iOS 26-inspired pill-style tab navigation.
 * Uses CSS glassmorphism (compatible with all layouts).
 *
 * Features:
 * - Frosted glass pill container
 * - Active tab indicator with subtle highlight
 * - Proper ARIA accessibility
 * - Smooth transitions
 */

import { cn } from "@/lib/utils";

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
    <div
      className={cn(
        "rounded-full p-1",
        "bg-gray-100/80 dark:bg-neutral-800/80 backdrop-blur-sm",
        className
      )}
    >
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
                "flex-1 py-2 px-3 rounded-full text-sm font-medium transition-all relative",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 dark:focus-visible:ring-pink-400 focus-visible:ring-offset-1",
                isActive
                  ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-black/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
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
                      : "bg-gray-400 dark:bg-neutral-600 text-white"
                  )}
                >
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
