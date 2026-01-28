"use client";

/**
 * Discover Page
 * 
 * Browse profiles grid for the discovery/matching flow.
 * Uses /api/discover/profiles endpoint to maintain SSOT with mobile.
 */

import { useEffect, useState } from "react";
import { DiscoverGrid, DiscoverGridSkeleton } from "@/components/discovery";

interface Profile {
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
  user?: {
    display_name?: string | null;
    status?: string | null;
  } | null;
}

interface DiscoverResponse {
  profiles: Profile[];
  isProfilePaused: boolean;
  total: number;
  limit: number;
  offset: number;
  error?: string;
}

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isProfilePaused, setIsProfilePaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const response = await fetch("/api/discover/profiles");
        const data: DiscoverResponse = await response.json();

        if (!response.ok) {
          console.error("Failed to load profiles:", data.error);
          return;
        }

        setProfiles(data.profiles || []);
        setIsProfilePaused(data.isProfilePaused || false);
      } catch (err) {
        console.error("Error fetching profiles:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, []);

  if (loading) {
    return <DiscoverGridSkeleton />;
  }

  return <DiscoverGrid initialProfiles={profiles} isProfilePaused={isProfilePaused} />;
}
