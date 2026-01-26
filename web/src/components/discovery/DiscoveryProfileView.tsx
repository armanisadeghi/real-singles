"use client";

/**
 * DiscoveryProfileView Component (Web)
 * 
 * A full profile view designed for the discovery/matching flow.
 * Shows photo carousel, rich profile content, and action buttons.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Flag, Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhotoCarousel } from "./PhotoCarousel";
import { ProfileSectionRenderer } from "./ProfileSectionRenderer";

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
  user?: {
    display_name?: string | null;
  } | null;
}

interface GalleryItem {
  media_url: string;
  media_type: string;
}

interface DiscoveryProfileViewProps {
  profile: Profile;
  gallery?: GalleryItem[];
  onLike?: (userId: string) => Promise<{ success: boolean; is_mutual?: boolean; msg?: string }>;
  onPass?: (userId: string) => Promise<{ success: boolean; msg?: string }>;
  onSuperLike?: (userId: string) => Promise<{ success: boolean; is_mutual?: boolean; msg?: string }>;
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
  onLike,
  onPass,
  onSuperLike,
  onReport,
  onClose,
}: DiscoveryProfileViewProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Get all images
  const images = [
    profile.profile_image_url,
    ...gallery.filter((g) => g.media_type === "image").map((g) => g.media_url),
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
        let result;
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
          // Show feedback and close
          setTimeout(handleClose, 500);
        }
      } catch (error) {
        console.error("Action failed:", error);
      } finally {
        setActionLoading(null);
      }
    },
    [profile.user_id, onLike, onPass, onSuperLike, handleClose]
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Photo Section */}
      <div className="relative">
        <PhotoCarousel images={images} height="55vh" showGradient={true} />

        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Report button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
          >
            <Flag className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <ProfileSectionRenderer profile={profile} />
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-6">
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
              "shadow-lg"
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
              "shadow-lg"
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
              "shadow-lg"
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
    </div>
  );
}

export default DiscoveryProfileView;
