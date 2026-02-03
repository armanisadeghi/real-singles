"use client";

/**
 * Search Page
 * 
 * Browse profiles grid for the search/matching flow.
 * Uses /api/discover/profiles endpoint to maintain SSOT with mobile.
 */

import { useEffect, useState } from "react";
import { SearchGrid, SearchGridSkeleton } from "@/components/search";
import { AlertCircle, UserX, Settings } from "lucide-react";
import Link from "next/link";

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

type EmptyReason = 
  | "incomplete_profile" 
  | "no_matches" 
  | "profile_not_found" 
  | "user_inactive"
  | null;

interface SearchApiResponse {
  profiles: Profile[];
  isProfilePaused: boolean;
  total: number;
  limit: number;
  offset: number;
  error?: string;
  emptyReason?: EmptyReason;
}

export default function SearchPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isProfilePaused, setIsProfilePaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emptyReason, setEmptyReason] = useState<EmptyReason>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const response = await fetch("/api/discover/profiles");
        const data: SearchApiResponse = await response.json();

        // Even non-ok responses now return structured data
        setProfiles(data.profiles || []);
        setIsProfilePaused(data.isProfilePaused || false);
        setEmptyReason(data.emptyReason || null);
        
        if (data.error) {
          setErrorMessage(data.error);
        }
      } catch (err) {
        console.error("Error fetching profiles:", err);
        setErrorMessage("Failed to load profiles. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, []);

  if (loading) {
    return <SearchGridSkeleton />;
  }

  // Show specific error states based on emptyReason
  if (emptyReason === "incomplete_profile") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Complete Your Profile
        </h2>
        <p className="text-gray-600 mb-6">
          To start discovering matches, please set your gender and who you&apos;re looking for in your profile settings.
        </p>
        <Link
          href="/profile/edit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Edit Profile
        </Link>
      </div>
    );
  }

  if (emptyReason === "user_inactive") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserX className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Account Restricted
        </h2>
        <p className="text-gray-600 mb-6">
          {errorMessage || "Your account has been restricted. Please contact support for assistance."}
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
        >
          Contact Support
        </Link>
      </div>
    );
  }

  if (emptyReason === "profile_not_found") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Profile Setup Required
        </h2>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t find your profile. Please complete your profile setup to start discovering matches.
        </p>
        <Link
          href="/profile/edit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Set Up Profile
        </Link>
      </div>
    );
  }

  return <SearchGrid initialProfiles={profiles} isProfilePaused={isProfilePaused} />;
}
