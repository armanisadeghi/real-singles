"use client";

/**
 * Matches Page
 * 
 * Displays mutual matches - users who have both liked each other.
 * Calls the /api/matches endpoint to maintain SSOT with mobile.
 */

import { useEffect, useState } from "react";
import { ProfileListItem } from "@/components/discovery/ProfileListItem";
import { Loader2, Heart } from "lucide-react";
import Link from "next/link";

interface Match {
  user_id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  occupation?: string | null;
  bio?: string | null;
  is_verified: boolean;
  profile_image_url?: string | null;
  gallery?: { media_url: string }[];
  last_active_at?: string | null;
  matched_at?: string | null;
  conversation_id?: string | null;
}

interface MatchesResponse {
  matches: Match[];
  total: number;
  limit: number;
  offset: number;
  error?: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const response = await fetch("/api/matches");
        const data: MatchesResponse = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load matches");
          return;
        }

        setMatches(data.matches || []);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Failed to load matches. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Matches</h1>
        <p className="text-gray-500 mb-6">People you've matched with</p>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Matches</h1>
        <p className="text-gray-500 mb-6">People you've matched with</p>
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Matches</h1>
      <p className="text-gray-500 mb-6">People you've matched with</p>

      {matches.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-16 h-16 text-pink-300" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No matches yet</h2>
          <p className="text-gray-600 mb-6">
            Start liking profiles to find your matches!
          </p>
          <Link
            href="/discover"
            className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-colors"
          >
            Discover Profiles
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <ProfileListItem
              key={match.user_id}
              profile={{
                id: match.user_id,
                user_id: match.user_id,
                first_name: match.first_name,
                last_name: match.last_name,
                city: match.city,
                state: match.state,
                profile_image_url: match.profile_image_url,
                is_verified: match.is_verified,
                user: match.display_name ? { display_name: match.display_name } : null,
              }}
              navigateToFocus={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
