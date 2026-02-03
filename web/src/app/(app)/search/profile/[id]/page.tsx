"use client";

/**
 * Search Profile Page
 * 
 * Full-screen profile view for search/matching flow.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { SearchProfileView } from "@/components/search/SearchProfileView";
import { useMatchUndo } from "@/hooks/useMatchUndo";

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

export default function DiscoveryProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Undo hook for tracking and undoing actions
  const { canUndo, secondsRemaining, lastAction, recordAction, performUndo } = useMatchUndo();

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          // Transform API response to profile format
          const profileData = data.data;
          setProfile({
            id: profileData.ID || userId,
            user_id: userId,
            first_name: profileData.FirstName,
            last_name: profileData.LastName,
            date_of_birth: profileData.DOB,
            gender: profileData.Gender,
            city: profileData.City,
            state: profileData.State,
            occupation: profileData.JobTitle,
            bio: profileData.About,
            profile_image_url: profileData.Image,
            is_verified: profileData.is_verified,
            height_inches: profileData.Height ? parseInt(profileData.Height) : null,
            body_type: profileData.BodyType,
            zodiac_sign: profileData.HSign,
            interests: profileData.Interest ? profileData.Interest.split(",").map((i: string) => i.trim()) : null,
            education: profileData.Education,
            religion: profileData.Religion,
            ethnicity: profileData.Ethnicity,
            has_kids: profileData.HaveChild,
            wants_kids: profileData.WantChild,
            pets: profileData.Pets ? [profileData.Pets] : null,
            smoking: profileData.Smoking,
            drinking: profileData.Drinks,
            marijuana: profileData.Marijuana,
            // Profile prompts
            ideal_first_date: profileData.IdealFirstDate,
            non_negotiables: profileData.NonNegotiables,
            way_to_heart: profileData.WayToHeart,
            craziest_travel_story: profileData.CraziestTravelStory,
            worst_job: profileData.WorstJob,
            dream_job: profileData.DreamJob,
            after_work: profileData.AfterWork,
            weirdest_gift: profileData.WeirdestGift,
            pet_peeves: profileData.PetPeeves,
            nightclub_or_home: profileData.NightclubOrHome,
            past_event: profileData.PastEvent,
            user: { display_name: profileData.DisplayName },
          });
          setGallery(profileData.gallery || []);
        } else {
          setError(data.msg || "Failed to load profile");
        }
      } catch (err) {
        setError("Failed to load profile");
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // Get the display name for recording actions
  const getDisplayName = useCallback(() => {
    return profile?.first_name || profile?.user?.display_name || "User";
  }, [profile]);

  // Action handlers - now record actions for undo
  const handleLike = useCallback(async (targetUserId: string) => {
    const response = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_user_id: targetUserId, action: "like" }),
    });
    const result = await response.json();
    
    // Record for undo (only if not a mutual match - can't undo mutual matches)
    if (result.success && !result.is_mutual) {
      recordAction(targetUserId, getDisplayName(), "like");
    }
    
    return result;
  }, [recordAction, getDisplayName]);

  const handlePass = useCallback(async (targetUserId: string) => {
    const response = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_user_id: targetUserId, action: "pass" }),
    });
    const result = await response.json();
    
    // Record for undo
    if (result.success) {
      recordAction(targetUserId, getDisplayName(), "pass");
    }
    
    return result;
  }, [recordAction, getDisplayName]);

  const handleSuperLike = useCallback(async (targetUserId: string) => {
    const response = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_user_id: targetUserId, action: "super_like" }),
    });
    const result = await response.json();
    
    // Record for undo (only if not a mutual match)
    if (result.success && !result.is_mutual) {
      recordAction(targetUserId, getDisplayName(), "super_like");
    }
    
    return result;
  }, [recordAction, getDisplayName]);

  const handleReport = useCallback(async (targetUserId: string, reason: string) => {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reported_user_id: targetUserId, reason }),
    });
    return response.json();
  }, []);

  const handleBlock = useCallback(async (targetUserId: string) => {
    const response = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked_user_id: targetUserId }),
    });
    return response.json();
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Profile not found
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          {error || "The profile you're looking for doesn't exist."}
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <SearchProfileView
      profile={profile}
      gallery={gallery}
      onLike={handleLike}
      onPass={handlePass}
      onSuperLike={handleSuperLike}
      onReport={handleReport}
      onBlock={handleBlock}
      onClose={handleClose}
      undoState={{
        canUndo,
        secondsRemaining,
        targetUserName: lastAction?.targetUserName,
      }}
      onUndo={performUndo}
    />
  );
}
