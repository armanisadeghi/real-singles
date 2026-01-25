"use client";

/**
 * ProfileFocusView Component (Web)
 * 
 * A full-screen/modal view for viewing a single profile and taking actions
 * (Like, Pass, Super Like). Can be used as a modal overlay or standalone page.
 */

import { useState, useEffect } from "react";
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
  user?: {
    display_name?: string | null;
  } | null;
}

interface ProfileFocusViewProps {
  profile: ProfileData;
  gallery?: Array<{ media_url: string; media_type: string }>;
  /** Callback when like action is triggered */
  onLike?: (userId: string) => Promise<{ success: boolean; is_mutual?: boolean; msg?: string }>;
  /** Callback when pass action is triggered */
  onPass?: (userId: string) => Promise<{ success: boolean; msg?: string }>;
  /** Callback when super like action is triggered */
  onSuperLike?: (userId: string) => Promise<{ success: boolean; is_mutual?: boolean; msg?: string }>;
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
  onLike,
  onPass,
  onSuperLike,
  onClose,
  isModal = false,
}: ProfileFocusViewProps) {
  const router = useRouter();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionComplete, setActionComplete] = useState<string | null>(null);

  // Combine profile image with gallery
  const photos = [
    profile.profile_image_url,
    ...gallery.filter((g) => g.media_type === "image").map((g) => g.media_url),
  ].filter(Boolean) as string[];

  const name = profile.first_name || profile.user?.display_name || "Anonymous";
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

  const handleAction = async (action: "like" | "pass" | "super_like") => {
    if (!profile.user_id) return;
    
    setActionLoading(action);
    
    try {
      let result: { success: boolean; is_mutual?: boolean; msg?: string } | undefined;
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
        // Show match celebration if mutual
        if (result.is_mutual) {
          // Could show a match modal here
          console.log("It's a match!");
        }
        // Close after brief delay
        setTimeout(handleClose, 800);
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const nextPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

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
      "flex flex-col bg-white",
      isModal ? "rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden" : "min-h-screen"
    )}>
      {/* Photo Section */}
      <div className="relative aspect-[3/4] max-h-[60vh] bg-gradient-to-br from-pink-100 to-purple-100">
        {photos.length > 0 ? (
          <img
            src={photos[currentPhotoIndex]}
            alt=""
            className="w-full h-full object-cover"
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
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
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
            <h3 className="text-sm font-semibold text-amber-700 mb-2">About</h3>
            <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-amber-700 mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 8).map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-full text-sm font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Info */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-amber-700 mb-2">Info</h3>
          <div className="grid grid-cols-2 gap-3">
            {profile.occupation && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{profile.occupation}</span>
              </div>
            )}
            {profile.height_inches && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Ruler className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{formatHeight(profile.height_inches)}</span>
              </div>
            )}
            {profile.gender && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700 capitalize">{profile.gender}</span>
              </div>
            )}
            {profile.zodiac_sign && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Sparkles className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 capitalize">{profile.zodiac_sign}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent p-6 pt-10">
        <div className="flex items-center justify-center gap-6">
          {/* Pass Button */}
          <button
            onClick={() => handleAction("pass")}
            disabled={actionLoading !== null}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
              "bg-white border-2 border-red-200 text-red-500",
              "hover:border-red-400 hover:bg-red-50 hover:scale-105",
              "active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
              "shadow-lg",
              actionComplete === "pass" && "bg-red-100 border-red-400"
            )}
          >
            {actionLoading === "pass" ? (
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <X className="w-8 h-8" />
            )}
          </button>

          {/* Super Like Button */}
          <button
            onClick={() => handleAction("super_like")}
            disabled={actionLoading !== null}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all",
              "bg-white border-2 border-blue-200 text-blue-500",
              "hover:border-blue-400 hover:bg-blue-50 hover:scale-105",
              "active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
              "shadow-lg",
              actionComplete === "super_like" && "bg-blue-100 border-blue-400"
            )}
          >
            {actionLoading === "super_like" ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Star className="w-6 h-6" />
            )}
          </button>

          {/* Like Button */}
          <button
            onClick={() => handleAction("like")}
            disabled={actionLoading !== null}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
              "bg-gradient-to-br from-amber-500 to-amber-600 text-white",
              "hover:from-amber-600 hover:to-amber-700 hover:scale-105",
              "active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
              "shadow-lg",
              actionComplete === "like" && "from-green-500 to-green-600"
            )}
          >
            {actionLoading === "like" ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart className="w-8 h-8" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        {content}
      </div>
    );
  }

  return content;
}

export default ProfileFocusView;
