"use client";

import { useState, useCallback } from "react";
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
import { MediaBadge } from "@/components/profile";

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
    // Voice & Video Prompts
    voice_prompt_url?: string | null;
    video_intro_url?: string | null;
    voice_prompt_duration_seconds?: number | null;
    video_intro_duration_seconds?: number | null;
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
  /** Base path for profile links (default: /profile, use /search/profile for unmatched profiles) */
  linkBasePath?: string;
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
  linkBasePath = "/profile",
}: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  const goNextPhoto = useCallback(() => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  }, [photos.length]);

  const goPrevPhoto = useCallback(() => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  }, [photos.length]);

  const nextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goNextPhoto();
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goPrevPhoto();
  };

  // Minimum swipe distance threshold (in pixels)
  const minSwipeDistance = 50;

  // Touch handlers for swipe navigation
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isTransitioning) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeOffset(0);
  }, [isTransitioning]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (isTransitioning || touchStart === null) return;
    const currentX = e.targetTouches[0].clientX;
    setTouchEnd(currentX);
    // Calculate swipe offset with resistance at edges
    const rawOffset = currentX - touchStart;
    const isAtStart = currentPhotoIndex === 0 && rawOffset > 0;
    const isAtEnd = currentPhotoIndex === photos.length - 1 && rawOffset < 0;
    const resistance = isAtStart || isAtEnd ? 0.3 : 1;
    setSwipeOffset(rawOffset * resistance);
  }, [isTransitioning, touchStart, currentPhotoIndex, photos.length]);

  const onTouchEnd = useCallback(() => {
    if (isTransitioning || touchStart === null) return;

    const distance = touchStart - (touchEnd ?? touchStart);
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    setIsTransitioning(true);

    if (isLeftSwipe && currentPhotoIndex < photos.length - 1) {
      goNextPhoto();
    } else if (isRightSwipe && currentPhotoIndex > 0) {
      goPrevPhoto();
    }

    // Reset swipe offset with animation
    setSwipeOffset(0);

    // Reset touch state after transition
    setTimeout(() => {
      setTouchStart(null);
      setTouchEnd(null);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, touchStart, touchEnd, goNextPhoto, goPrevPhoto, currentPhotoIndex, photos.length]);

  // Compact card layout (for horizontal scrolling sections like mobile)
  if (size === "compact") {
    return (
      <Link
        href={profile.user_id ? `${linkBasePath}/${profile.user_id}` : "#"}
        className={cn(
          "block relative bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-black/20 overflow-hidden group",
          "transition-all duration-200 hover:shadow-md dark:hover:shadow-black/30",
          className
        )}
      >
        {/* Photo */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950 dark:to-purple-950">
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
          
          {/* Badges row */}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {/* Media Badge */}
            {(profile.voice_prompt_url || profile.video_intro_url) && (
              <MediaBadge
                hasVoicePrompt={!!profile.voice_prompt_url}
                hasVideoIntro={!!profile.video_intro_url}
                size="sm"
                className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm"
              />
            )}
            
            {/* Verified Badge */}
            {profile.is_verified && (
              <div className="w-5 h-5 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
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
        "relative bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-black/20 overflow-hidden group",
        "transition-all duration-300 hover:shadow-lg dark:hover:shadow-black/30",
        size === "large" ? "md:max-w-md" : "",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Photo Section */}
      <div
        className="relative aspect-[3/4] bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950 dark:to-purple-950 touch-pan-y select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Link
          href={profile.user_id ? `${linkBasePath}/${profile.user_id}` : "#"}
          className="block w-full h-full"
        >
          {photos.length > 0 ? (
            <img
              src={photos[currentPhotoIndex]}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
              style={{
                transform: `translateX(${swipeOffset}px)`,
                transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">👤</span>
            </div>
          )}
        </Link>

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

        {/* Top badges row */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          {/* Media Badge */}
          {(profile.voice_prompt_url || profile.video_intro_url) && (
            <MediaBadge
              hasVoicePrompt={!!profile.voice_prompt_url}
              hasVideoIntro={!!profile.video_intro_url}
              size="md"
              className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm shadow-sm"
            />
          )}
          
          {/* Verified Badge */}
          {profile.is_verified && (
            <div className="bg-blue-500 dark:bg-blue-600 text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Verified
            </div>
          )}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-none">
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
      </div>

      {/* Quick info bar */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-neutral-800">
        {profile.bio ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{profile.bio}</p>
        ) : profile.interests && profile.interests.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {profile.interests.slice(0, 3).map((interest) => (
              <span
                key={interest}
                className="px-2 py-1 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-xs"
              >
                {interest}
              </span>
            ))}
            {profile.interests.length > 3 && (
              <span className="px-2 py-1 text-gray-400 dark:text-gray-500 text-xs">
                +{profile.interests.length - 3}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">No bio yet</p>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
          {/* Pass Button */}
          <button
            onClick={() => profile.user_id && onPass?.(profile.user_id)}
            disabled={actionLoading || !profile.user_id}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              "bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400",
              "hover:border-red-300 dark:hover:border-red-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
              "transition-all active:scale-95 disabled:opacity-50",
              "shadow-sm hover:shadow dark:shadow-black/20"
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
              "bg-white dark:bg-neutral-900 border-2 border-blue-200 dark:border-blue-500/30 text-blue-500 dark:text-blue-400",
              "hover:border-blue-400 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
              "transition-all active:scale-95 disabled:opacity-50",
              "shadow-sm hover:shadow dark:shadow-black/20"
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
              "shadow-md hover:shadow-lg dark:shadow-black/30"
            )}
          >
            <Heart className="w-7 h-7" />
          </button>

          {/* Info Button */}
          <Link
            href={profile.user_id ? `${linkBasePath}/${profile.user_id}` : "#"}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400",
              "hover:border-purple-300 dark:hover:border-purple-400 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20",
              "transition-all active:scale-95",
              "shadow-sm hover:shadow dark:shadow-black/20"
            )}
          >
            <Info className="w-5 h-5" />
          </Link>
        </div>
      )}
    </div>
  );
}
