"use client";

/**
 * ProfilePreviewButton
 * 
 * Opens a modal showing how the user's profile appears to others in the Discover feed.
 * Uses SearchProfileView in read-only mode (no action buttons).
 */

import { useState } from "react";
import { Eye, X } from "lucide-react";
import { SearchProfileView } from "@/components/search/SearchProfileView";
import { cn } from "@/lib/utils";

interface GalleryItem {
  id: string;
  media_url: string;
  media_type: string;
  is_primary?: boolean | null;
  display_order?: number | null;
}

interface ProfilePreviewButtonProps {
  iconOnly?: boolean;
  profile: {
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
    voice_prompt_url?: string | null;
    voice_prompt_duration_seconds?: number | null;
    video_intro_url?: string | null;
    video_intro_duration_seconds?: number | null;
  };
  gallery: GalleryItem[];
  userName: string;
  className?: string;
}

export function ProfilePreviewButton({ 
  profile, 
  gallery, 
  userName,
  className,
  iconOnly = false,
}: ProfilePreviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Transform profile to match SearchProfileView expected shape
  const previewProfile = {
    ...profile,
    id: profile.id,
    user_id: profile.user_id,
  };

  // Transform gallery to match expected shape
  const previewGallery = gallery.map(item => ({
    media_url: item.media_url,
    media_type: item.media_type,
    is_primary: item.is_primary ?? undefined,
  }));

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Preview Profile"
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400",
          "hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-gray-100",
          "transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
          "active:scale-[0.97]",
          iconOnly ? "w-8 h-8" : "gap-1 h-8 px-3 text-sm font-medium",
          className
        )}
      >
        <Eye className="w-4 h-4" />
        {!iconOnly && <span>Preview</span>}
      </button>

      {/* Preview Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative h-full flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b dark:border-neutral-800 px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Profile Preview
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This is how others see your profile
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile View - Hide action buttons via CSS */}
            <div className="flex-1 overflow-auto preview-mode">
              <style jsx global>{`
                .preview-mode [aria-label="Pass on this profile"],
                .preview-mode [aria-label="Like this profile"],
                .preview-mode [aria-label="Super like this profile"],
                .preview-mode [aria-label="Undo last action"],
                .preview-mode [aria-label="More actions"] {
                  display: none !important;
                }
                /* Hide the entire action bar on desktop */
                .preview-mode .hidden.md\\:flex.items-center.justify-center.gap-3.py-4 {
                  display: none !important;
                }
                /* Hide floating action buttons on mobile */
                .preview-mode .fixed.bottom-0.left-0.right-0.z-20 {
                  display: none !important;
                }
              `}</style>
              <SearchProfileView
                profile={previewProfile}
                gallery={previewGallery}
                onClose={() => setIsOpen(false)}
                // No action handlers = read-only mode
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
