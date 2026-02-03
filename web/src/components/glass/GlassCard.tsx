"use client";

/**
 * GlassCard
 *
 * iOS 26 Liquid Glass card component for featured sections.
 *
 * Use cases:
 * - Likes page: "Boost Me" CTA section
 * - Messages page: "Get Likes" card
 * - Explore page: "Coming Soon" section
 *
 * Features:
 * - True liquid glass effect
 * - Optional border accent
 * - Flexible content container
 */

import { cn } from "@/lib/utils";
import { GlassContainer } from "./GlassContainer";

interface GlassCardProps {
  children: React.ReactNode;
  /** Optional className */
  className?: string;
  /** Add subtle border accent */
  bordered?: boolean;
  /** Padding size */
  padding?: "none" | "sm" | "md" | "lg";
  /** Click handler (makes card interactive) */
  onClick?: () => void;
  /** Make it a link */
  href?: string;
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-6 sm:p-8",
};

export function GlassCard({
  children,
  className,
  bordered = false,
  padding = "md",
  onClick,
  href,
}: GlassCardProps) {
  const content = (
    <GlassContainer
      variant="card"
      className={cn(
        paddingClasses[padding],
        bordered && "ring-1 ring-white/30",
        (onClick || href) && "cursor-pointer active:scale-[0.98] transition-transform",
        className
      )}
    >
      {children}
    </GlassContainer>
  );

  if (href) {
    const Link = require("next/link").default;
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left">
        {content}
      </button>
    );
  }

  return content;
}

/**
 * GlassCardHeader
 *
 * Header section for GlassCard with title and optional action.
 */
interface GlassCardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function GlassCardHeader({
  title,
  subtitle,
  action,
  className,
}: GlassCardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 mb-4", className)}>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/**
 * GlassBadge
 *
 * Small badge with glass effect for status/labels.
 */
interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning";
  className?: string;
}

export function GlassBadge({
  children,
  variant = "default",
  className,
}: GlassBadgeProps) {
  const variantClasses = {
    default: "bg-white/50 text-gray-700",
    primary: "bg-pink-500/20 text-pink-700",
    success: "bg-green-500/20 text-green-700",
    warning: "bg-amber-500/20 text-amber-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full",
        "text-xs font-semibold",
        "backdrop-blur-sm",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
