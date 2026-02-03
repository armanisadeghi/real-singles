"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  /** Image URL - can be a full URL, Supabase storage path, or null */
  src?: string | null;
  /** Name used for fallback initials */
  name: string;
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Additional CSS classes */
  className?: string;
  /** Show online indicator */
  showOnlineIndicator?: boolean;
  /** Whether user is online */
  isOnline?: boolean;
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

const onlineIndicatorSizes = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-4 h-4",
};

// Supabase storage base URL
const SUPABASE_STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`
  : "";

/**
 * Convert a storage path or URL to a full image URL
 * Handles:
 * - Full URLs (http/https) - passed through as-is
 * - Supabase storage paths (avatars/, gallery/, etc.) - converted to full URL
 * - Empty/null values - returns empty string
 */
function getImageUrl(path: string | null | undefined): string {
  if (!path) return "";

  // Already a full URL
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Supabase storage path (starts with bucket name)
  if (
    path.startsWith("avatars/") ||
    path.startsWith("gallery/") ||
    path.startsWith("events/")
  ) {
    return `${SUPABASE_STORAGE_URL}/${path}`;
  }

  // Assume Supabase path without bucket prefix - default to avatars
  if (SUPABASE_STORAGE_URL) {
    return `${SUPABASE_STORAGE_URL}/avatars/${path}`;
  }

  return path;
}

/**
 * Get initials from a name
 * Takes first letter of first and last name, or first two letters if single word
 */
function getInitials(name: string): string {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Generate a consistent color based on name
 * Uses a simple hash to pick from a predefined palette
 */
function getAvatarColor(name: string): string {
  const colors = [
    "from-pink-500 to-rose-500",
    "from-purple-500 to-indigo-500",
    "from-blue-500 to-cyan-500",
    "from-teal-500 to-emerald-500",
    "from-green-500 to-lime-500",
    "from-yellow-500 to-orange-500",
    "from-orange-500 to-red-500",
    "from-red-500 to-pink-500",
    "from-indigo-500 to-purple-500",
    "from-cyan-500 to-blue-500",
  ];

  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

/**
 * Reusable Avatar component with consistent styling and error handling
 *
 * Features:
 * - Displays user image with graceful fallback to initials
 * - Automatically converts Supabase storage paths to full URLs
 * - Consistent gradient colors based on name
 * - Multiple size variants
 * - Optional online indicator
 * - Error handling for broken images
 */
export function Avatar({
  src,
  name,
  size = "md",
  className,
  showOnlineIndicator = false,
  isOnline = false,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Convert storage path to full URL
  const imageUrl = useMemo(() => getImageUrl(src), [src]);

  const showImage = imageUrl && !imageError;
  const initials = getInitials(name);
  const gradientColor = getAvatarColor(name);

  return (
    <div className={cn("relative inline-flex shrink-0 rounded-full", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center overflow-hidden",
          sizeClasses[size],
          !showImage && `bg-gradient-to-br ${gradientColor}`
        )}
      >
        {showImage ? (
          <img
            src={imageUrl}
            alt={`${name}'s avatar`}
            className={cn(
              "w-full h-full object-cover",
              isLoading && "opacity-0"
            )}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setImageError(true);
              setIsLoading(false);
            }}
          />
        ) : null}

        {/* Show initials when no image or image failed to load */}
        {(!showImage || isLoading) && (
          <span
            className={cn(
              "font-semibold text-white select-none",
              showImage && isLoading && "absolute"
            )}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Online indicator */}
      {showOnlineIndicator && isOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full bg-green-500 ring-2 ring-white dark:ring-neutral-900",
            onlineIndicatorSizes[size]
          )}
        />
      )}
    </div>
  );
}
