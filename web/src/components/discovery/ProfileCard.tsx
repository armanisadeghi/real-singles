"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Heart,
  Star,
  MapPin,
  Briefcase,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { cn, calculateAge, formatHeight } from "@/lib/utils";

interface ProfileCardProps {
  profile: {
    id: string;
    user_id: string | null;
    first_name?: string | null;
    last_name?: string | null;
    date_of_birth?: string | null;
    city?: string | null;
    state?: string | null;
    occupation?: string | null;
    bio?: string | null;
    profile_image_url?: string | null;
    is_verified?: boolean | null;
    height_inches?: number | null;
    interests?: string[] | null;
    user?: {
      display_name?: string | null;
    } | null;
  };
  /** Gallery images for this profile */
  gallery?: Array<{ media_url: string; media_type: string }>;
  /** Show action buttons */
  showActions?: boolean;
  /** Callback when like action is triggered */
  onLike?: (userId: string) => void;
  /** Callback when pass action is triggered */
  onPass?: (userId: string) => void;
  /** Callback when super like action is triggered */
  onSuperLike?: (userId: string) => void;
  /** Loading state for actions */
  actionLoading?: boolean;
  /** Size variant */
  size?: "compact" | "normal" | "large";
  /** Custom class name */
  className?: string;
}

export function ProfileCard({
  profile,
  gallery = [],
  showActions = true,
  onLike,
  onPass,
  onSuperLike,
  actionLoading = false,
  size = "normal",
  className,
}: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Combine profile image with gallery
  const photos = [
    profile.profile_image_url,
    ...gallery.filter((g) => g.media_type === "image").map((g) => g.media_url),
  ].filter(Boolean) as string[];

  const name =
    profile.first_name ||
    profile.user?.display_name ||
    "Anonymous";
  const age = profile.date_of_birth
    ? calculateAge(profile.date_of_birth)
    : null;
  const location =
    profile.city && profile.state
      ? `${profile.city}, ${profile.state}`
      : profile.city || profile.state;

  const nextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (photos.length > 1) {
      setCurrentPhotoIndex(
        (prev) => (prev - 1 + photos.length) % photos.length
      );
    }
  };

  // Compact card layout (for horizontal scrolling sections like mobile)
  if (size === "compact") {
    return (
      <Link
        href={profile.user_id ? `/profile/${profile.user_id}` : "#"}
        className={cn(
          "block relative bg-white rounded-xl shadow-sm overflow-hidden group",
          "transition-all duration-200 hover:shadow-md",
          className
        )}
      >
        {/* Photo */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-pink-100 to-purple-100">
          {photos.length > 0 ? (
            <img
              src={photos[0]}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>
          )}
          
          {/* Verified Badge */}
          {profile.is_verified && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <h3 className="text-sm font-bold truncate">
              {name}
              {age && <span className="font-normal">, {age}</span>}
            </h3>
            {location && (
              <p className="text-xs text-white/80 truncate mt-0.5">
                {location}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "relative bg-white rounded-2xl shadow-sm overflow-hidden group",
        "transition-all duration-300 hover:shadow-lg",
        size === "large" ? "md:max-w-md" : "",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Photo Section */}
      <Link
        href={profile.user_id ? `/profile/${profile.user_id}` : "#"}
        className="block relative aspect-[3/4] bg-gradient-to-br from-pink-100 to-purple-100"
      >
        {photos.length > 0 ? (
          <img
            src={photos[currentPhotoIndex]}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">👤</span>
          </div>
        )}

        {/* Photo navigation indicators */}
        {photos.length > 1 && (
          <>
            {/* Dots at top */}
            <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 z-10">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    i === currentPhotoIndex
                      ? "w-6 bg-white"
                      : "w-1 bg-white/50"
                  )}
                />
              ))}
            </div>

            {/* Navigation areas */}
            <button
              onClick={prevPhoto}
              className="absolute left-0 top-0 bottom-0 w-1/3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="sr-only">Previous photo</span>
              {isHovered && (
                <ChevronLeft className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 text-white drop-shadow-lg" />
              )}
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-0 top-0 bottom-0 w-1/3 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="sr-only">Next photo</span>
              {isHovered && (
                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 text-white drop-shadow-lg" />
              )}
            </button>
          </>
        )}

        {/* Verified Badge */}
        {profile.is_verified && (
          <div className="absolute top-3 right-3 bg-blue-500 text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 z-10">
            <CheckCircle className="w-3 h-3" />
            Verified
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">
              {name}
              {age && <span className="font-normal">, {age}</span>}
            </h3>
          </div>

          {location && (
            <div className="flex items-center gap-1 mt-1 text-sm text-white/90">
              <MapPin className="w-3 h-3" />
              {location}
            </div>
          )}

          {profile.occupation && (
            <div className="flex items-center gap-1 mt-1 text-sm text-white/90">
              <Briefcase className="w-3 h-3" />
              {profile.occupation}
            </div>
          )}
        </div>
      </Link>

      {/* Quick info bar */}
      <div className="px-4 py-3 border-t">
        {profile.bio ? (
          <p className="text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
        ) : profile.interests && profile.interests.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {profile.interests.slice(0, 3).map((interest) => (
              <span
                key={interest}
                className="px-2 py-1 bg-pink-50 text-pink-700 rounded-full text-xs"
              >
                {interest}
              </span>
            ))}
            {profile.interests.length > 3 && (
              <span className="px-2 py-1 text-gray-400 text-xs">
                +{profile.interests.length - 3}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No bio yet</p>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center justify-center gap-4 px-4 py-3 border-t bg-gray-50">
          {/* Pass Button */}
          <button
            onClick={() => profile.user_id && onPass?.(profile.user_id)}
            disabled={actionLoading || !profile.user_id}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              "bg-white border-2 border-gray-200 text-gray-500",
              "hover:border-red-300 hover:text-red-500 hover:bg-red-50",
              "transition-all active:scale-95 disabled:opacity-50",
              "shadow-sm hover:shadow"
            )}
          >
            <X className="w-7 h-7" />
          </button>

          {/* Super Like Button */}
          <button
            onClick={() => profile.user_id && onSuperLike?.(profile.user_id)}
            disabled={actionLoading || !profile.user_id}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-white border-2 border-blue-200 text-blue-500",
              "hover:border-blue-400 hover:bg-blue-50",
              "transition-all active:scale-95 disabled:opacity-50",
              "shadow-sm hover:shadow"
            )}
          >
            <Star className="w-5 h-5" />
          </button>

          {/* Like Button */}
          <button
            onClick={() => profile.user_id && onLike?.(profile.user_id)}
            disabled={actionLoading || !profile.user_id}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-pink-500 to-rose-500 text-white",
              "hover:from-pink-600 hover:to-rose-600",
              "transition-all active:scale-95 disabled:opacity-50",
              "shadow-md hover:shadow-lg"
            )}
          >
            <Heart className="w-7 h-7" />
          </button>

          {/* Info Button */}
          <Link
            href={profile.user_id ? `/profile/${profile.user_id}` : "#"}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-white border-2 border-gray-200 text-gray-500",
              "hover:border-purple-300 hover:text-purple-500 hover:bg-purple-50",
              "transition-all active:scale-95",
              "shadow-sm hover:shadow"
            )}
          >
            <Info className="w-5 h-5" />
          </Link>
        </div>
      )}
    </div>
  );
}
