"use client";

/**
 * ProfileListItem Component (Web)
 * 
 * A horizontal list item for displaying user profiles in lists.
 * Photo on left, info on right. No action buttons - clicks navigate to ProfileFocusView.
 */

import Link from "next/link";
import { MapPin, CheckCircle, ChevronRight } from "lucide-react";
import { cn, calculateAge } from "@/lib/utils";

interface ProfileListItemProps {
  profile: {
    id: string;
    user_id: string | null;
    first_name?: string | null;
    last_name?: string | null;
    date_of_birth?: string | null;
    city?: string | null;
    state?: string | null;
    profile_image_url?: string | null;
    is_verified?: boolean | null;
    distance_km?: number | null;
    user?: {
      display_name?: string | null;
    } | null;
  };
  /** Navigate to focus view instead of profile page */
  navigateToFocus?: boolean;
  /** Custom class name */
  className?: string;
  /** Optional onClick handler */
  onClick?: () => void;
}

// Background colors for initials (consistent with mobile)
const BACKGROUND_COLORS = [
  "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
  "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
  "#8BC34A", "#FF9800", "#FF5722", "#795548", "#607D8B",
];

// Generate consistent background color based on ID
function getBgColor(seed: string): string {
  const index = Math.abs(
    seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % BACKGROUND_COLORS.length
  );
  return BACKGROUND_COLORS[index];
}

// Get initials from name
function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
}

export function ProfileListItem({
  profile,
  navigateToFocus = true,
  className,
  onClick,
}: ProfileListItemProps) {
  const name = profile.first_name || profile.user?.display_name || "Anonymous";
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const bgColor = getBgColor(profile.id || profile.user_id || name);
  const initials = getInitials(name);
  
  // Navigate to the discovery profile view for matching flow
  const href = navigateToFocus 
    ? `/discover/profile/${profile.user_id}`
    : `/profile/${profile.user_id}`;

  const distanceString = profile.distance_km 
    ? `${profile.distance_km.toFixed(1)} km away`
    : null;

  const content = (
    <div className={cn(
      "flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm",
      "transition-all duration-200 hover:shadow-md hover:bg-gray-50",
      "cursor-pointer",
      className
    )}>
      {/* Photo */}
      <div className="relative w-[72px] h-[72px] rounded-lg overflow-hidden flex-shrink-0">
        {profile.profile_image_url ? (
          <img
            src={profile.profile_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Name */}
        <h3 className="text-base font-semibold text-gray-900 truncate">
          {name}
        </h3>

        {/* Location */}
        {location && (
          <p className="text-sm text-gray-500 truncate mt-0.5">
            {location}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Verified Badge */}
          {profile.is_verified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
              <CheckCircle className="w-3 h-3" />
              Verified
            </span>
          )}

          {/* Distance Badge */}
          {distanceString && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
              <MapPin className="w-3 h-3" />
              {distanceString}
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </div>
  );

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className="w-full text-left"
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={profile.user_id ? href : "#"} className="block">
      {content}
    </Link>
  );
}

export default ProfileListItem;
