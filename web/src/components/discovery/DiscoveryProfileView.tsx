"use client";

/**
 * DiscoveryProfileView Component (Web)
 * 
 * A full profile view designed for the discovery/matching flow.
 * Shows photo carousel, rich profile content, and action buttons.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Flag, Heart, Star, MapPin, Briefcase, CheckCircle, ArrowLeft } from "lucide-react";
import { cn, calculateAge } from "@/lib/utils";
import { PhotoCarousel } from "./PhotoCarousel";
import { ProfileSectionRenderer } from "./ProfileSectionRenderer";
import { MatchCelebrationModal } from "./MatchCelebrationModal";
import { useToast } from "@/components/ui/Toast";
import { VoiceVideoDisplay } from "@/components/profile";

interface Profile {
  id: string;
  user_id: string | null;
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  occupation?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
  is_verified?: boolean | null;
  height_inches?: number | null;
  body_type?: string | null;
  zodiac_sign?: string | null;
  interests?: string[] | null;
  education?: string | null;
  religion?: string | null;
  ethnicity?: string[] | null;
  languages?: string[] | null;
  has_kids?: string | null;
  wants_kids?: string | null;
  pets?: string[] | null;
  smoking?: string | null;
  drinking?: string | null;
  marijuana?: string | null;
  distance_km?: number | null;
  ideal_first_date?: string | null;
  non_negotiables?: string | null;
  way_to_heart?: string | null;
  craziest_travel_story?: string | null;
  worst_job?: string | null;
  dream_job?: string | null;
  after_work?: string | null;
  weirdest_gift?: string | null;
  pet_peeves?: string | null;
  nightclub_or_home?: string | null;
  past_event?: string | null;
  // Voice & Video Prompts
  voice_prompt_url?: string | null;
  voice_prompt_duration_seconds?: number | null;
  video_intro_url?: string | null;
  video_intro_duration_seconds?: number | null;
  user?: {
    display_name?: string | null;
  } | null;
}

interface GalleryItem {
  media_url: string;
  media_type: string;
  is_primary?: boolean;
}

interface MatchActionResult {
  success: boolean;
  is_mutual?: boolean;
  conversation_id?: string | null;
  msg?: string;
}

interface DiscoveryProfileViewProps {
  profile: Profile;
  gallery?: GalleryItem[];
  /** Current user's profile image for match celebration */
  currentUserImage?: string | null;
  /** Current user's name for match celebration */
  currentUserName?: string;
  onLike?: (userId: string) => Promise<MatchActionResult>;
  onPass?: (userId: string) => Promise<{ success: boolean; msg?: string }>;
  onSuperLike?: (userId: string) => Promise<MatchActionResult>;
  onReport?: (userId: string, reason: string) => Promise<{ success: boolean; msg?: string }>;
  onClose?: () => void;
}

const REPORT_REASONS = [
  "Inappropriate photos",
  "Fake profile",
  "Harassment",
  "Spam",
  "Other",
];

export function DiscoveryProfileView({
  profile,
  gallery = [],
  currentUserImage,
  currentUserName,
  onLike,
  onPass,
  onSuperLike,
  onReport,
  onClose,
}: DiscoveryProfileViewProps) {
  const router = useRouter();
  const toast = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Match celebration state
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [matchConversationId, setMatchConversationId] = useState<string | null>(null);

  // Get all images - filter out primary from gallery since it's already added as profile_image_url
  const images = [
    profile.profile_image_url,
    ...gallery
      .filter((g) => g.media_type === "image" && !g.is_primary)
      .map((g) => g.media_url),
  ].filter(Boolean) as string[];

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  }, [onClose, router]);

  const handleAction = useCallback(
    async (action: "like" | "pass" | "super_like") => {
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
          // Check if it's a mutual match
          if ('is_mutual' in result && result.is_mutual && 'conversation_id' in result) {
            // Show match celebration!
            setMatchConversationId(result.conversation_id || null);
            setShowMatchCelebration(true);
          } else {
            // Regular action - close after brief delay
            setTimeout(handleClose, 500);
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
    },
    [profile.user_id, onLike, onPass, onSuperLike, handleClose, toast]
  );

  const handleReport = useCallback(
    async (reason: string) => {
      if (!profile.user_id || !onReport) return;

      try {
        const result = await onReport(profile.user_id, reason);
        if (result?.success) {
          setShowReportModal(false);
        }
      } catch (error) {
        console.error("Report failed:", error);
      }
    },
    [profile.user_id, onReport]
  );

  // Handle closing the match celebration
  const handleMatchCelebrationClose = useCallback(() => {
    setShowMatchCelebration(false);
    setMatchConversationId(null);
    handleClose();
  }, [handleClose]);

  // Derived values for display
  const name = profile.first_name || profile.user?.display_name || "Anonymous";
  const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const location = [profile.city, profile.state].filter(Boolean).join(", ");

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Centered container for desktop */}
      <div className="flex-1 flex flex-col md:flex-row md:items-start md:justify-center md:py-8 md:px-4 md:gap-6 max-w-6xl mx-auto w-full">
        
        {/* Left Column - Photo, Actions, Basic Info (desktop) */}
        <div className="relative md:sticky md:top-8 md:w-[400px] md:flex-shrink-0">
          {/* Photo Section */}
          <div className="md:rounded-2xl md:overflow-hidden md:shadow-lg">
            <PhotoCarousel 
              images={images} 
              height="55vh"
              className="md:h-[450px]"
              showGradient={true} 
            />
          </div>

          {/* Header overlay */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10 md:p-3">
            {/* Back button */}
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            {/* Report button */}
            <button
              onClick={() => setShowReportModal(true)}
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
            >
              <Flag className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Desktop: Action bar below photo */}
          <div className="hidden md:flex items-center justify-center gap-4 py-4">
            {/* Pass Button */}
            <button
              onClick={() => handleAction("pass")}
              disabled={actionLoading !== null}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                "bg-white border border-red-200 text-red-500",
                "hover:border-red-400 hover:bg-red-50 hover:scale-105",
                "active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
                "shadow-sm"
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
                "bg-white border border-blue-200 text-blue-500",
                "hover:border-blue-400 hover:bg-blue-50 hover:scale-105",
                "active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
                "shadow-sm"
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
                "bg-amber-500 text-white",
                "hover:bg-amber-600 hover:scale-105",
                "active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
                "shadow-sm"
              )}
            >
              {actionLoading === "like" ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Heart className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Desktop: Basic Info & About below actions */}
          <div className="hidden md:block bg-white rounded-2xl shadow-lg mt-4 p-5">
            {/* Name & Age */}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {name}
                {age && <span className="font-normal">, {age}</span>}
              </h1>
              {profile.is_verified && (
                <CheckCircle className="w-5 h-5 text-blue-500" />
              )}
            </div>

            {/* Location */}
            {location && (
              <div className="flex items-center gap-1.5 mt-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{location}</span>
                {profile.distance_km && (
                  <span className="text-gray-400 ml-1 text-sm">
                    • {profile.distance_km.toFixed(1)} km away
                  </span>
                )}
              </div>
            )}

            {/* Occupation */}
            {profile.occupation && (
              <div className="flex items-center gap-1.5 mt-1 text-gray-600">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm">{profile.occupation}</span>
              </div>
            )}

            {/* About Me */}
            {profile.bio && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h2 className="text-sm font-semibold text-amber-700 mb-2">About Me</h2>
                <p className="text-gray-700 text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Voice & Video Section */}
            {(profile.voice_prompt_url || profile.video_intro_url) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <VoiceVideoDisplay
                  voicePromptUrl={profile.voice_prompt_url}
                  voicePromptDuration={profile.voice_prompt_duration_seconds}
                  videoIntroUrl={profile.video_intro_url}
                  videoIntroDuration={profile.video_intro_duration_seconds}
                  userName={name}
                  compact
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Profile Details */}
        <div className="flex-1 bg-white md:rounded-2xl md:shadow-lg md:max-w-xl">
          <div className="p-5 md:p-6">
            {/* Mobile: Show full profile including basic info */}
            <div className="md:hidden">
              <ProfileSectionRenderer profile={profile} />
            </div>
            {/* Desktop: Show profile without basic info and about (they're on the left) */}
            <div className="hidden md:block">
              <ProfileSectionRenderer profile={profile} excludeBasicsAndAbout />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Bar - fixed at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/98 border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-center gap-5 py-3 px-4">
          {/* Pass Button */}
          <button
            onClick={() => handleAction("pass")}
            disabled={actionLoading !== null}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              "bg-white border border-red-200 text-red-500",
              "active:scale-95 disabled:opacity-50",
              "shadow-sm"
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
              "bg-white border border-blue-200 text-blue-500",
              "active:scale-95 disabled:opacity-50",
              "shadow-sm"
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
              "bg-amber-500 text-white",
              "active:scale-95 disabled:opacity-50",
              "shadow-sm"
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowReportModal(false)}
          />
          <div className="relative bg-white rounded-t-2xl w-full max-w-lg p-6 pb-10">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Report this profile
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Why are you reporting {profile.first_name || "this user"}?
            </p>

            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReport(reason)}
                  className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-700">{reason}</span>
                  <span className="text-gray-400">›</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowReportModal(false)}
              className="w-full mt-4 py-3 text-gray-500 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Match Celebration Modal */}
      <MatchCelebrationModal
        isOpen={showMatchCelebration}
        currentUserImage={currentUserImage}
        currentUserName={currentUserName}
        matchedUserImage={profile.profile_image_url}
        matchedUserName={name}
        conversationId={matchConversationId}
        onClose={handleMatchCelebrationClose}
      />
    </div>
  );
}

export default DiscoveryProfileView;
