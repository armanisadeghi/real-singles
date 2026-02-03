"use client";

/**
 * SearchProfileView Component (Web)
 * 
 * A full profile view designed for the search/matching flow.
 * Shows photo carousel, rich profile content, and action buttons.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, MoreHorizontal, Heart, Star, MapPin, Briefcase, CheckCircle, ArrowLeft, Undo2, Share, Ban, Flag } from "lucide-react";
import { cn, calculateAge } from "@/lib/utils";
import { PhotoCarousel } from "./PhotoCarousel";
import { ProfileSectionRenderer } from "./ProfileSectionRenderer";
import { MatchCelebrationModal } from "./MatchCelebrationModal";
import { useToast } from "@/components/ui/Toast";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
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

interface UndoState {
  /** Whether undo is available */
  canUndo: boolean;
  /** Seconds remaining before undo expires */
  secondsRemaining: number;
  /** Name of the user whose action can be undone */
  targetUserName?: string;
}

interface SearchProfileViewProps {
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
  onBlock?: (userId: string) => Promise<{ success: boolean; msg?: string }>;
  onClose?: () => void;
  /** Undo state - shows if undo is available for a previous action */
  undoState?: UndoState;
  /** Handler for undo action - returns the target user ID to navigate to */
  onUndo?: () => Promise<{ success: boolean; targetUserId?: string; error?: string }>;
  /** 
   * When true, the parent component handles navigation after actions (like/pass/super_like/undo).
   * This is used in queue-based flows (e.g., discover) where the parent manages showing the next profile.
   * When false (default), SearchProfileView will navigate/close after successful actions.
   */
  parentHandlesNavigation?: boolean;
}

const REPORT_REASONS = [
  "Inappropriate photos",
  "Fake profile",
  "Harassment",
  "Spam",
  "Other",
];

/**
 * Trigger haptic feedback on supported devices
 * Uses the Vibration API for a native-feeling touch response
 * 
 * @param type - The type of haptic feedback:
 *   - 'light': Quick tap (10ms) - for selections, toggles
 *   - 'medium': Standard press (20ms) - for button presses
 *   - 'heavy': Strong feedback (30ms) - for important actions like like/pass
 *   - 'success': Double pulse - for successful actions
 *   - 'error': Triple short pulse - for errors
 */
function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'medium') {
  // Check if Vibration API is supported (mobile browsers)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns: Record<string, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [15, 50, 15], // Two pulses
      error: [10, 30, 10, 30, 10], // Three short pulses
    };
    
    try {
      navigator.vibrate(patterns[type]);
    } catch {
      // Silently fail if vibration is not permitted
    }
  }
}

export function SearchProfileView({
  profile,
  gallery = [],
  currentUserImage,
  currentUserName,
  onLike,
  onPass,
  onSuperLike,
  onReport,
  onBlock,
  onClose,
  undoState,
  onUndo,
  parentHandlesNavigation = false,
}: SearchProfileViewProps) {
  const router = useRouter();
  const toast = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Action menu state
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [menuAnchorPosition, setMenuAnchorPosition] = useState<{ top: number; right: number } | null>(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  
  // Match celebration state
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [matchConversationId, setMatchConversationId] = useState<string | null>(null);

  // Undo handler
  const handleUndo = useCallback(async () => {
    if (!onUndo || !undoState?.canUndo) {
      toast.info("No recent action to undo");
      return;
    }

    setActionLoading("undo");
    triggerHaptic("medium");

    try {
      const result = await onUndo();
      
      if (result.success && result.targetUserId) {
        toast.success(`Undid action on ${undoState.targetUserName || "previous profile"}`);
        triggerHaptic("success");
        // Only navigate if parent doesn't handle navigation (e.g., not in discover queue flow)
        if (!parentHandlesNavigation) {
          router.push(`/search/profile/${result.targetUserId}`);
        }
        // If parentHandlesNavigation is true, the parent (e.g., DiscoverProfileView) 
        // will handle showing the previous profile via goToPrevious()
      } else {
        toast.error(result.error || "Failed to undo");
        triggerHaptic("error");
      }
    } catch (error) {
      console.error("Undo failed:", error);
      toast.error("Failed to undo. Please try again.");
      triggerHaptic("error");
    } finally {
      setActionLoading(null);
    }
  }, [onUndo, undoState, toast, router, parentHandlesNavigation]);

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
          } else if (!parentHandlesNavigation) {
            // Only auto-close if parent doesn't handle navigation (e.g., not in discover queue flow)
            // In queue flows, the parent's action handlers (onLike, etc.) call advanceToNext() themselves
            setTimeout(handleClose, 500);
          }
          // If parentHandlesNavigation is true, the parent (e.g., DiscoverProfileView) 
          // already advanced to the next profile via advanceToNext()
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
    [profile.user_id, onLike, onPass, onSuperLike, handleClose, toast, parentHandlesNavigation]
  );

  const handleReport = useCallback(
    async (reason: string) => {
      if (!profile.user_id || !onReport) return;

      try {
        const result = await onReport(profile.user_id, reason);
        if (result?.success) {
          setShowReportModal(false);
          toast.success("Report submitted. Thank you for helping keep our community safe.");
        }
      } catch (error) {
        console.error("Report failed:", error);
        toast.error("Failed to submit report. Please try again.");
      }
    },
    [profile.user_id, onReport, toast]
  );

  // Handle share action
  // Uses the public share URL (/p/{user_id}) which shows a limited profile for non-authenticated users
  // and redirects authenticated users to the full profile
  const handleShare = useCallback(async () => {
    const displayName = profile.first_name || profile.user?.display_name || "Someone";
    // Use the public share page URL - this shows limited profile for non-authenticated users
    // and redirects authenticated users to /search/profile/{id}
    const shareUrl = typeof window !== "undefined" 
      ? `${window.location.origin}/p/${profile.user_id}`
      : "";
    
    const shareData = {
      title: `Check out ${displayName} on RealSingles`,
      text: `I found ${displayName} on RealSingles - a dating app for people who want something real.`,
      url: shareUrl,
    };

    try {
      // Use Web Share API if available (native share sheet on mobile)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Profile link copied to clipboard!");
      }
    } catch (error) {
      // User cancelled share or error occurred
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed:", error);
        // Try clipboard fallback
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Profile link copied to clipboard!");
        } catch {
          toast.error("Failed to share. Please try again.");
        }
      }
    }
    setShowActionMenu(false);
  }, [profile.first_name, profile.user?.display_name, profile.user_id, toast]);

  // Handle block action
  const handleBlock = useCallback(async () => {
    if (!profile.user_id) return;

    setBlockLoading(true);
    try {
      if (onBlock) {
        const result = await onBlock(profile.user_id);
        if (result?.success) {
          toast.success("User blocked. You won't see them again.");
          setShowBlockConfirm(false);
          // Only auto-close if parent doesn't handle navigation
          if (!parentHandlesNavigation) {
            setTimeout(handleClose, 500);
          }
        } else {
          toast.error(result?.msg || "Failed to block user. Please try again.");
        }
      } else {
        // Fallback: call API directly if no handler provided
        const response = await fetch("/api/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocked_user_id: profile.user_id }),
        });
        const result = await response.json();
        if (result?.success) {
          toast.success("User blocked. You won't see them again.");
          setShowBlockConfirm(false);
          // Only auto-close if parent doesn't handle navigation (fallback path likely not in queue flow)
          if (!parentHandlesNavigation) {
            setTimeout(handleClose, 500);
          }
        } else {
          toast.error(result?.msg || "Failed to block user. Please try again.");
        }
      }
    } catch (error) {
      console.error("Block failed:", error);
      toast.error("Failed to block user. Please try again.");
    } finally {
      setBlockLoading(false);
    }
  }, [profile.user_id, onBlock, toast, handleClose, parentHandlesNavigation]);

  // Action menu items
  const actionMenuItems: ActionMenuItem[] = [
    {
      id: "share",
      label: "Share Profile",
      icon: Share,
      description: "Send this profile to a friend",
    },
    {
      id: "block",
      label: "Block",
      icon: Ban,
      variant: "destructive",
      description: "Stop seeing this person",
    },
    {
      id: "report",
      label: "Report",
      icon: Flag,
      variant: "destructive",
      description: "Report inappropriate behavior",
    },
  ];

  // Handle action menu selection
  const handleActionMenuSelect = useCallback((itemId: string) => {
    setShowActionMenu(false);
    
    switch (itemId) {
      case "share":
        handleShare();
        break;
      case "block":
        setShowBlockConfirm(true);
        break;
      case "report":
        setShowReportModal(true);
        break;
    }
  }, [handleShare]);

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
    <div className="fixed inset-0 z-30 bg-gray-50 dark:bg-neutral-900 overflow-y-auto overscroll-contain scrollbar-hide">
      {/* Scrollable content wrapper */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-center md:py-8 md:px-4 md:gap-6 max-w-6xl mx-auto w-full">
        
        {/* Left Column - Photo, Actions, Basic Info (desktop) */}
        <div className="relative md:sticky md:top-8 md:w-[400px] shrink-0">
          {/* Photo Section */}
          <div className="md:rounded-2xl md:overflow-hidden md:shadow-lg dark:md:shadow-black/30">
            <PhotoCarousel 
              images={images} 
              height="55vh"
              className="md:h-[450px]"
              showGradient={true} 
            />
          </div>

          {/* Header overlay */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10 md:p-3">
            {/* Back button - no background, just icon with shadow for visibility */}
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center transition-opacity hover:opacity-80"
            >
              <ArrowLeft className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            </button>

            {/* More actions button - no background, just icon with shadow for visibility */}
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                // Position the menu below the button, aligned to the right
                setMenuAnchorPosition({
                  top: rect.bottom + 8,
                  right: window.innerWidth - rect.right,
                });
                setShowActionMenu(true);
              }}
              className="w-9 h-9 flex items-center justify-center transition-opacity hover:opacity-80"
              aria-label="More actions"
            >
              <MoreHorizontal className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            </button>
          </div>

          {/* Desktop: Action bar below photo - Enhanced hover effects */}
          <div className="hidden md:flex items-center justify-center gap-3 py-4">
            {/* Pass Button (X) - leftmost */}
            <button
              onClick={() => handleAction("pass")}
              disabled={actionLoading !== null}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center",
                "bg-white dark:bg-neutral-950 text-red-500 border-2 border-red-300 dark:border-red-400/50",
                "shadow-sm dark:shadow-black/20",
                // Smooth transitions for all properties
                "transition-all duration-200 ease-out",
                // Hover state - scale up, elevate shadow, shift colors
                "hover:scale-110 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950",
                "hover:shadow-lg hover:shadow-red-200/50 dark:hover:shadow-red-900/30",
                // Active/click state
                "active:scale-95 active:shadow-sm",
                // Disabled state
                "disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-sm"
              )}
              aria-label="Pass on this profile"
            >
              {actionLoading === "pass" ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
              )}
            </button>

            {/* Undo Button (Desktop) */}
            <button
              onClick={handleUndo}
              disabled={actionLoading !== null || !undoState?.canUndo}
              title={undoState?.canUndo ? `Undo (${undoState.secondsRemaining}s)` : "No action to undo"}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center relative",
                "bg-white dark:bg-neutral-950 border-2",
                "shadow-sm dark:shadow-black/20",
                // Smooth transitions for all properties
                "transition-all duration-200 ease-out",
                // Conditional styling based on undo availability
                undoState?.canUndo
                  ? "text-amber-600 border-amber-300 dark:border-amber-400/50 hover:scale-110 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 hover:shadow-lg hover:shadow-amber-200/50 dark:hover:shadow-amber-900/30"
                  : "text-gray-400 dark:text-gray-500 border-gray-200 dark:border-neutral-700 cursor-not-allowed",
                // Active/click state
                "active:scale-95 active:shadow-sm",
                // Disabled state
                "disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-sm"
              )}
              aria-label="Undo last action"
            >
              {actionLoading === "undo" ? (
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Undo2 className="w-4 h-4" />
              )}
              {/* Timer indicator */}
              {undoState?.canUndo && undoState.secondsRemaining <= 30 && (
                <span className="absolute -bottom-1 -right-1 text-[10px] bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-medium">
                  {undoState.secondsRemaining}
                </span>
              )}
            </button>

            {/* Super Like Button (Star) */}
            <button
              onClick={() => handleAction("super_like")}
              disabled={actionLoading !== null}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center",
                "bg-white dark:bg-neutral-950 text-amber-500 border-2 border-amber-300 dark:border-amber-400/50",
                "shadow-sm dark:shadow-black/20",
                // Smooth transitions for all properties
                "transition-all duration-200 ease-out",
                // Hover state - scale up, elevate shadow, glow effect
                "hover:scale-110 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950",
                "hover:shadow-lg hover:shadow-amber-200/50 dark:hover:shadow-amber-900/30",
                // Active/click state
                "active:scale-95 active:shadow-sm",
                // Disabled state
                "disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-sm"
              )}
              aria-label="Super like this profile"
            >
              {actionLoading === "super_like" ? (
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Star className="w-5 h-5 transition-transform hover:rotate-12" fill="currentColor" />
              )}
            </button>

            {/* Like Button (Heart) */}
            <button
              onClick={() => handleAction("like")}
              disabled={actionLoading !== null}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center",
                "bg-amber-500 dark:bg-amber-600 text-white",
                "shadow-sm dark:shadow-black/20",
                // Smooth transitions for all properties
                "transition-all duration-200 ease-out",
                // Hover state - scale up, elevate shadow, brighten
                "hover:scale-110 hover:bg-amber-400 dark:hover:bg-amber-500",
                "hover:shadow-lg hover:shadow-amber-300/50 dark:hover:shadow-amber-900/30",
                // Active/click state
                "active:scale-95 active:bg-amber-600 active:shadow-sm",
                // Disabled state
                "disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-sm"
              )}
              aria-label="Like this profile"
            >
              {actionLoading === "like" ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Heart className="w-5 h-5 transition-transform hover:scale-110" fill="currentColor" />
              )}
            </button>

            {/* Share Button - rightmost */}
            <button
              onClick={handleShare}
              disabled={actionLoading !== null}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center",
                "bg-white dark:bg-neutral-950 text-blue-500 border-2 border-blue-300 dark:border-blue-400/50",
                "shadow-sm dark:shadow-black/20",
                // Smooth transitions for all properties
                "transition-all duration-200 ease-out",
                // Hover state - scale up, elevate shadow
                "hover:scale-110 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950",
                "hover:shadow-lg hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30",
                // Active/click state
                "active:scale-95 active:shadow-sm",
                // Disabled state
                "disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-sm"
              )}
              aria-label="Share this profile"
            >
              <Share className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop: Basic Info & About below actions */}
          <div className="hidden md:block bg-white dark:bg-neutral-950 rounded-2xl shadow-lg dark:shadow-black/30 mt-4 p-5">
            {/* Name & Age */}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {name}
                {age && <span className="font-normal">, {age}</span>}
              </h1>
              {profile.is_verified && (
                <CheckCircle className="w-5 h-5 text-blue-500" />
              )}
            </div>

            {/* Location */}
            {location && (
              <div className="flex items-center gap-1.5 mt-2 text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{location}</span>
                {profile.distance_km && (
                  <span className="text-gray-400 dark:text-gray-500 ml-1 text-sm">
                    • {profile.distance_km.toFixed(1)} km away
                  </span>
                )}
              </div>
            )}

            {/* Occupation */}
            {profile.occupation && (
              <div className="flex items-center gap-1.5 mt-1 text-gray-600 dark:text-gray-400">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm">{profile.occupation}</span>
              </div>
            )}

            {/* About Me */}
            {profile.bio && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
                <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-500 mb-2">About Me</h2>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Voice & Video Section */}
            {(profile.voice_prompt_url || profile.video_intro_url) && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
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
        <div className="flex-1 bg-white dark:bg-neutral-950 md:rounded-2xl md:shadow-lg dark:md:shadow-black/30 md:max-w-xl">
          <div className="p-5 md:p-6 pb-48 md:pb-6">
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

      {/* Mobile Action Bar - fixed floating buttons at bottom (no backdrop) 
          Enhanced with haptic feedback and native-feeling touch interactions
          Positioned above the bottom navigation dock */}
      <div className="md:hidden fixed left-0 right-0 z-40" style={{ bottom: 'calc(76px + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-center gap-3 py-4 px-4">
          {/* Pass Button (X) - leftmost */}
          <button
            onTouchStart={() => triggerHaptic('light')}
            onClick={() => {
              triggerHaptic('heavy');
              handleAction("pass");
            }}
            disabled={actionLoading !== null}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-white dark:bg-neutral-950 text-red-500 border-2 border-red-300 dark:border-red-400/50",
              "shadow-lg dark:shadow-black/40",
              // Touch-optimized transitions
              "transition-all duration-150 ease-out",
              // Active/pressed state - scale down and change background
              "active:scale-90 active:bg-red-50 dark:active:bg-red-950 active:border-red-400 active:shadow-md",
              // Disabled state
              "disabled:opacity-50 disabled:active:scale-100",
              // Prevent text selection and optimize touch
              "select-none touch-manipulation"
            )}
            aria-label="Pass on this profile"
          >
            {actionLoading === "pass" ? (
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <X className="w-6 h-6 transition-transform active:scale-110" />
            )}
          </button>

          {/* Undo Button (Mobile) */}
          <button
            onTouchStart={() => triggerHaptic('light')}
            onClick={handleUndo}
            disabled={actionLoading !== null || !undoState?.canUndo}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center relative",
              "bg-white dark:bg-neutral-950 border-2",
              "shadow-lg dark:shadow-black/40",
              // Touch-optimized transitions
              "transition-all duration-150 ease-out",
              // Conditional styling based on undo availability
              undoState?.canUndo
                ? "text-amber-600 border-amber-300 dark:border-amber-400/50 active:scale-90 active:bg-amber-50 dark:active:bg-amber-950 active:border-amber-400 active:shadow-md"
                : "text-gray-400 dark:text-gray-500 border-gray-200 dark:border-neutral-700",
              // Disabled state
              "disabled:opacity-50 disabled:active:scale-100",
              // Prevent text selection and optimize touch
              "select-none touch-manipulation"
            )}
            aria-label="Undo last action"
          >
            {actionLoading === "undo" ? (
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Undo2 className="w-5 h-5 transition-transform active:scale-110" />
            )}
            {/* Timer indicator */}
            {undoState?.canUndo && undoState.secondsRemaining <= 30 && (
              <span className="absolute -bottom-0.5 -right-0.5 text-[10px] bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {undoState.secondsRemaining}
              </span>
            )}
          </button>

          {/* Super Like Button (Star) */}
          <button
            onTouchStart={() => triggerHaptic('light')}
            onClick={() => {
              triggerHaptic('heavy');
              handleAction("super_like");
            }}
            disabled={actionLoading !== null}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-white dark:bg-neutral-950 text-amber-500 border-2 border-amber-300 dark:border-amber-400/50",
              "shadow-lg dark:shadow-black/40",
              // Touch-optimized transitions
              "transition-all duration-150 ease-out",
              // Active/pressed state
              "active:scale-90 active:bg-amber-50 dark:active:bg-amber-950 active:border-amber-400 active:shadow-md",
              // Disabled state
              "disabled:opacity-50 disabled:active:scale-100",
              // Prevent text selection and optimize touch
              "select-none touch-manipulation"
            )}
            aria-label="Super like this profile"
          >
            {actionLoading === "super_like" ? (
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Star className="w-6 h-6 transition-transform active:scale-110" fill="currentColor" />
            )}
          </button>

          {/* Like Button (Heart) */}
          <button
            onTouchStart={() => triggerHaptic('light')}
            onClick={() => {
              triggerHaptic('success');
              handleAction("like");
            }}
            disabled={actionLoading !== null}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-amber-500 dark:bg-amber-600 text-white",
              "shadow-lg dark:shadow-black/40",
              // Touch-optimized transitions
              "transition-all duration-150 ease-out",
              // Active/pressed state - darker background, scale down
              "active:scale-90 active:bg-amber-600 active:shadow-md",
              // Disabled state
              "disabled:opacity-50 disabled:active:scale-100",
              // Prevent text selection and optimize touch
              "select-none touch-manipulation"
            )}
            aria-label="Like this profile"
          >
            {actionLoading === "like" ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart className="w-6 h-6 transition-transform active:scale-110" fill="currentColor" />
            )}
          </button>

          {/* Share Button - rightmost */}
          <button
            onTouchStart={() => triggerHaptic('light')}
            onClick={() => {
              triggerHaptic('medium');
              handleShare();
            }}
            disabled={actionLoading !== null}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-white dark:bg-neutral-950 text-blue-500 border-2 border-blue-300 dark:border-blue-400/50",
              "shadow-lg dark:shadow-black/40",
              // Touch-optimized transitions
              "transition-all duration-150 ease-out",
              // Active/pressed state
              "active:scale-90 active:bg-blue-50 dark:active:bg-blue-950 active:border-blue-400 active:shadow-md",
              // Disabled state
              "disabled:opacity-50 disabled:active:scale-100",
              // Prevent text selection and optimize touch
              "select-none touch-manipulation"
            )}
            aria-label="Share this profile"
          >
            <Share className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={() => setShowReportModal(false)}
          />
          <div className="relative bg-white dark:bg-neutral-950 rounded-t-2xl w-full max-w-lg p-6 pb-10">
            <div className="w-10 h-1 bg-gray-300 dark:bg-neutral-600 rounded-full mx-auto mb-6" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
              Report this profile
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Why are you reporting {profile.first_name || "this user"}?
            </p>

            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReport(reason)}
                  className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <span className="text-gray-700 dark:text-gray-300">{reason}</span>
                  <span className="text-gray-400 dark:text-gray-500">›</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowReportModal(false)}
              className="w-full mt-4 py-3 text-gray-500 dark:text-gray-400 font-medium"
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

      {/* Action Menu (Share, Block, Report) */}
      <ActionMenu
        isOpen={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        onSelect={handleActionMenuSelect}
        items={actionMenuItems}
        anchorPosition={menuAnchorPosition}
      />

      {/* Block Confirmation Modal */}
      <ConfirmModal
        isOpen={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={handleBlock}
        title={`Block ${profile.first_name || "this user"}?`}
        message="They won't be able to see your profile or contact you. You can unblock them later from Settings."
        confirmLabel="Block"
        cancelLabel="Cancel"
        variant="danger"
        loading={blockLoading}
      />
    </div>
  );
}

export default SearchProfileView;
