"use client";

/**
 * ProfileFocusView Component (Web)
 * 
 * A full-screen/modal view for viewing a single profile and taking actions
 * (Like, Pass, Super Like). Can be used as a modal overlay or standalone page.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Heart,
  Star,
  MapPin,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Ruler,
  Sparkles,
} from "lucide-react";
import { cn, calculateAge, formatHeight } from "@/lib/utils";
import { MatchCelebrationModal } from "./MatchCelebrationModal";
import { useToast } from "@/components/ui/Toast";
import { VoiceVideoDisplay } from "@/components/profile";

interface ProfileData {
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
  gender?: string | null;
  zodiac_sign?: string | null;
  distance_km?: number | null;
  // Voice & Video Prompts
  voice_prompt_url?: string | null;
  voice_prompt_duration_seconds?: number | null;
  video_intro_url?: string | null;
  video_intro_duration_seconds?: number | null;
  user?: {
    display_name?: string | null;
  } | null;
}

interface MatchActionResult {
  success: boolean;
  is_mutual?: boolean;
  conversation_id?: string | null;
  msg?: string;
}

interface ProfileFocusViewProps {
  profile: ProfileData;
  gallery?: Array<{ media_url: string; media_type: string }>;
  /** Current user's profile image for match celebration */
  currentUserImage?: string | null;
  /** Current user's name for match celebration */
  currentUserName?: string;
  /** Callback when like action is triggered */
  onLike?: (userId: string) => Promise<MatchActionResult>;
  /** Callback when pass action is triggered */
  onPass?: (userId: string) => Promise<{ success: boolean; msg?: string }>;
  /** Callback when super like action is triggered */
  onSuperLike?: (userId: string) => Promise<MatchActionResult>;
  /** Callback when close is triggered */
  onClose?: () => void;
  /** Whether this is a modal overlay */
  isModal?: boolean;
}

// Background colors for initials
const BACKGROUND_COLORS = [
  "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
  "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
  "#8BC34A", "#FF9800", "#FF5722", "#795548", "#607D8B",
];

function getBgColor(seed: string): string {
  const index = Math.abs(
    seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % BACKGROUND_COLORS.length
  );
  return BACKGROUND_COLORS[index];
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
}

export function ProfileFocusView({
  profile,
  gallery = [],
  currentUserImage,
  currentUserName,
  onLike,
  onPass,
  onSuperLike,
  onClose,
  isModal = false,
}: ProfileFocusViewProps) {
  const router = useRouter();
  const toast = useToast();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionComplete, setActionComplete] = useState<string | null>(null);

  // Match celebration state
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [matchConversationId, setMatchConversationId] = useState<string | null>(null);

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

  const name = profile.user?.display_name || profile.first_name || "Anonymous";
  const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const bgColor = getBgColor(profile.id || profile.user_id || name);
  const initials = getInitials(name);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const handleMatchCelebrationClose = () => {
    setShowMatchCelebration(false);
    setMatchConversationId(null);
    handleClose();
  };

  const handleAction = async (action: "like" | "pass" | "super_like") => {
    if (!profile.user_id) return;
    
    setActionLoading(action);
    
    try {
      let result: MatchActionResult | { success: boolean; msg?: string } | undefined;
      switch (action) {
        case "like":
          result = onLike ? await onLike(profile.user_id) : { success: true };
          break;
        case "pass":
          result = onPass ? await onPass(profile.user_id) : { success: true };
          break;
        case "super_like":
          result = onSuperLike ? await onSuperLike(profile.user_id) : { success: true };
          break;
      }

      if (result?.success) {
        setActionComplete(action);
        
        // Check if it's a mutual match
        if ('is_mutual' in result && result.is_mutual && 'conversation_id' in result) {
          // Show match celebration!
          setMatchConversationId(result.conversation_id || null);
          setShowMatchCelebration(true);
        } else {
          // Close after brief delay
          setTimeout(handleClose, 800);
        }
      } else {
        // Show error toast
        const errorMsg = result?.msg || "Action failed. Please try again.";
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Action failed:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const nextPhoto = useCallback(() => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  }, [photos.length]);

  const prevPhoto = useCallback(() => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  }, [photos.length]);

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
      nextPhoto();
    } else if (isRightSwipe && currentPhotoIndex > 0) {
      prevPhoto();
    }

    // Reset swipe offset with animation
    setSwipeOffset(0);

    // Reset touch state after transition
    setTimeout(() => {
      setTouchStart(null);
      setTouchEnd(null);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, touchStart, touchEnd, nextPhoto, prevPhoto, currentPhotoIndex, photos.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photos.length]);

  const content = (
    <div className={cn(
      "flex flex-col bg-white dark:bg-neutral-900",
      isModal ? "rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden" : "min-h-dvh"
    )}>
      {/* Photo Section */}
      <div
        className="relative aspect-[3/4] max-h-[60vh] bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950 dark:to-purple-950 touch-pan-y select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {photos.length > 0 ? (
          <img
            src={photos[currentPhotoIndex]}
            alt={`Photo of ${name}`}
            className="w-full h-full object-cover"
            draggable={false}
            style={{
              transform: `translateX(${swipeOffset}px)`,
              transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
            }}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <span className="text-6xl font-bold text-white">{initials}</span>
          </div>
        )}

        {/* Photo navigation */}
        {photos.length > 1 && (
          <>
            {/* Dots */}
            <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 z-10">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhotoIndex(i)}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    i === currentPhotoIndex ? "w-6 bg-white" : "w-1 bg-white/50"
                  )}
                />
              ))}
            </div>

            {/* Arrow buttons */}
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-neutral-900/80 flex items-center justify-center hover:bg-white dark:hover:bg-neutral-900 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-gray-100" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-neutral-900/80 flex items-center justify-center hover:bg-white dark:hover:bg-neutral-900 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-900 dark:text-gray-100" />
            </button>
          </>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors z-20"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Verified Badge */}
        {profile.is_verified && (
          <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 z-10">
            <CheckCircle className="w-4 h-4" />
            Verified
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Name and location overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">
              {name}
              {age && <span className="font-normal">, {age}</span>}
            </h1>
          </div>

          {location && (
            <div className="flex items-center gap-1.5 mt-2 text-white/90">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
              {profile.distance_km && (
                <span className="text-white/70 ml-2">
                  • {profile.distance_km.toFixed(1)} km away
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Bio */}
        {profile.bio && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">About</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Voice & Video Section */}
        {(profile.voice_prompt_url || profile.video_intro_url) && (
          <div className="mb-6">
            <VoiceVideoDisplay
              voicePromptUrl={profile.voice_prompt_url}
              voicePromptDuration={profile.voice_prompt_duration_seconds}
              videoIntroUrl={profile.video_intro_url}
              videoIntroDuration={profile.video_intro_duration_seconds}
              userName={name}
            />
          </div>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 8).map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-sm font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Info */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">Info</h3>
          <div className="grid grid-cols-2 gap-3">
            {profile.occupation && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <Briefcase className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{profile.occupation}</span>
              </div>
            )}
            {profile.height_inches && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <Ruler className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{formatHeight(profile.height_inches)}</span>
              </div>
            )}
            {profile.gender && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{profile.gender}</span>
              </div>
            )}
            {profile.zodiac_sign && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <Sparkles className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{profile.zodiac_sign}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar - Compact native-style */}
      <div className="sticky bottom-0 bg-white/98 dark:bg-neutral-900/98 border-t border-gray-200 dark:border-neutral-700 py-3 px-4">
        <div className="flex items-center justify-center gap-5">
          {/* Pass Button */}
          <button
            onClick={() => handleAction("pass")}
            disabled={actionLoading !== null}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              "bg-white dark:bg-neutral-950 border border-red-200 dark:border-red-400/50 text-red-500",
              "hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950 hover:scale-105",
              "active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
              "shadow-sm dark:shadow-black/20",
              actionComplete === "pass" && "bg-red-100 dark:bg-red-950 border-red-400"
            )}
          >
            {actionLoading === "pass" ? (
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <X className="w-6 h-6" />
            )}
          </button>

          {/* Super Like Button */}
          <button
            onClick={() => handleAction("super_like")}
            disabled={actionLoading !== null}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              "bg-white dark:bg-neutral-950 border border-blue-200 dark:border-blue-400/50 text-blue-500",
              "hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:scale-105",
              "active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
              "shadow-sm dark:shadow-black/20",
              actionComplete === "super_like" && "bg-blue-100 dark:bg-blue-950 border-blue-400"
            )}
          >
            {actionLoading === "super_like" ? (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Star className="w-5 h-5" />
            )}
          </button>

          {/* Like Button */}
          <button
            onClick={() => handleAction("like")}
            disabled={actionLoading !== null}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              "bg-amber-500 dark:bg-amber-600 text-white",
              "hover:bg-amber-600 dark:hover:bg-amber-500 hover:scale-105",
              "active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
              "shadow-sm dark:shadow-black/20",
              actionComplete === "like" && "bg-green-500"
            )}
          >
            {actionLoading === "like" ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Match celebration modal (shared across modal/non-modal modes)
  const matchCelebration = (
    <MatchCelebrationModal
      isOpen={showMatchCelebration}
      currentUserImage={currentUserImage}
      currentUserName={currentUserName}
      matchedUserImage={profile.profile_image_url}
      matchedUserName={name}
      conversationId={matchConversationId}
      onClose={handleMatchCelebrationClose}
    />
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
        {content}
        {matchCelebration}
      </div>
    );
  }

  return (
    <>
      {content}
      {matchCelebration}
    </>
  );
}

export default ProfileFocusView;
