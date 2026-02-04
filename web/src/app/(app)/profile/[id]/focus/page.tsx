"use client";

/**
 * Profile Focus Page
 * 
 * Full-screen view for viewing a single profile and taking actions.
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProfileFocusView } from "@/components/search/ProfileFocusView";

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

interface GalleryItem {
  media_url: string;
  media_type: string;
}

export default function ProfileFocusPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();

        if (response.ok && data) {
          setProfile({
            id: data.id || userId,
            user_id: userId,
            first_name: data.first_name,
            last_name: data.last_name,
            date_of_birth: data.date_of_birth,
            city: data.city,
            state: data.state,
            occupation: data.occupation,
            bio: data.bio,
            profile_image_url: data.profile_image_url,
            is_verified: data.is_verified,
            height_inches: data.height_inches,
            interests: data.interests,
            gender: data.gender,
            zodiac_sign: data.zodiac_sign,
            user: { display_name: data.display_name },
          });
          setGallery(data.gallery || []);
        } else {
          setError(data.error || "Failed to load profile");
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

  const handleLike = async (targetUserId: string) => {
    const response = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_user_id: targetUserId, action: "like" }),
    });
    return response.json();
  };

  const handlePass = async (targetUserId: string) => {
    const response = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_user_id: targetUserId, action: "pass" }),
    });
    return response.json();
  };

  const handleSuperLike = async (targetUserId: string) => {
    const response = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_user_id: targetUserId, action: "super_like" }),
    });
    return response.json();
  };

  const handleClose = () => {
    // If there's history from our app, go back; otherwise navigate to discover
    if (window.history.length > 1 && document.referrer.includes(window.location.origin)) {
      router.back();
    } else {
      router.push("/discover");
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h1>
        <p className="text-gray-600 mb-6">{error || "The profile you're looking for doesn't exist."}</p>
        <button
          onClick={() => {
            if (window.history.length > 1 && document.referrer.includes(window.location.origin)) {
              router.back();
            } else {
              router.push("/discover");
            }
          }}
          className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <ProfileFocusView
      profile={profile}
      gallery={gallery}
      onLike={handleLike}
      onPass={handlePass}
      onSuperLike={handleSuperLike}
      onClose={handleClose}
    />
  );
}
