"use client";

/**
 * PointsBadge Component
 * 
 * An elegant, modern badge displaying reward points.
 * Clean pill design that matches the mobile app version.
 * Designed for a premium dating app aesthetic.
 */

import { Heart } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BadgeSize = "sm" | "md" | "lg";

interface PointsBadgeProps {
  /** Number of points to display */
  points: number;
  /** Size variant */
  size?: BadgeSize;
  /** Optional link destination */
  href?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
  /** Show "pts" label (default: true) */
  showLabel?: boolean;
}

// Size configurations
const SIZE_CONFIG = {
  sm: {
    padding: "px-2.5 py-1.5",
    iconSize: "w-3.5 h-3.5",
    textSize: "text-xs",
    labelSize: "text-[10px]",
    gap: "gap-1.5",
  },
  md: {
    padding: "px-3.5 py-2",
    iconSize: "w-4 h-4",
    textSize: "text-sm",
    labelSize: "text-xs",
    gap: "gap-2",
  },
  lg: {
    padding: "px-5 py-2.5",
    iconSize: "w-5 h-5",
    textSize: "text-base",
    labelSize: "text-xs",
    gap: "gap-2.5",
  },
} as const;

// Format points with thousands separator
function formatPoints(points: number): string {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return points.toLocaleString();
}

export function PointsBadge({
  points,
  size = "md",
  href,
  onClick,
  className,
  showLabel = true,
}: PointsBadgeProps) {
  const config = SIZE_CONFIG[size];

  const badgeContent = (
    <div
      className={cn(
        // Base styles
        "inline-flex items-center",
        config.padding,
        config.gap,
        // Gradient background
        "bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600",
        // Shape and shadow
        "rounded-full",
        "shadow-md shadow-pink-500/25",
        // Transition for hover states
        "transition-all duration-200",
        // Hover effect when clickable
        (href || onClick) && "hover:shadow-lg hover:shadow-pink-500/35 hover:scale-[1.02] cursor-pointer",
        className
      )}
    >
      <Heart
        className={cn(config.iconSize, "text-white/95 fill-white/95")}
      />
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            config.textSize,
            "font-bold text-white tracking-wide"
          )}
        >
          {formatPoints(points)}
        </span>
        {showLabel && (
          <span
            className={cn(
              config.labelSize,
              "font-medium text-white/85 lowercase"
            )}
          >
            pts
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {badgeContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="inline-block">
        {badgeContent}
      </button>
    );
  }

  return badgeContent;
}

export default PointsBadge;
