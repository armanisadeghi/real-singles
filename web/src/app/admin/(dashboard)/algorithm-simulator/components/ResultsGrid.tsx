"use client";

import { User, MapPin, Check, X, Heart, Star, Calendar } from "lucide-react";

interface ProfileResult {
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  looking_for: string[] | null;
  date_of_birth?: string | null;
  city: string | null;
  state: string | null;
  profile_image_url: string | null;
  is_verified: boolean | null;
  can_start_matching?: boolean | null;
  profile_hidden?: boolean | null;
  distance_km?: number;
  is_favorite?: boolean;
  has_liked_me?: boolean;
  matched_at?: string;
  conversation_id?: string;
  action?: string;
  liked_at?: string;
  _debug?: {
    gender_match: boolean;
    bidirectional_match: boolean;
  };
}

interface ResultsGridProps {
  profiles: ProfileResult[];
  loading?: boolean;
  resultType?: "discovery" | "matches" | "likes";
}

export function ResultsGrid({ profiles, loading, resultType = "discovery" }: ResultsGridProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Results</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-slate-200 rounded-lg mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
          <User className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700 mb-1">No Results</h3>
        <p className="text-sm text-slate-500">
          No profiles match the current criteria
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Results ({profiles.length})
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-green-600">
            <Check className="w-3 h-3" /> Bidirectional match
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <X className="w-3 h-3" /> One-way only
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.user_id}
            profile={profile}
            resultType={resultType}
          />
        ))}
      </div>
    </div>
  );
}

function ProfileCard({
  profile,
  resultType,
}: {
  profile: ProfileResult;
  resultType: "discovery" | "matches" | "likes";
}) {
  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatGender = (gender: string | null) => {
    if (!gender) return "?";
    return gender.charAt(0).toUpperCase();
  };

  const formatLookingFor = (lookingFor: string[] | null) => {
    if (!lookingFor || lookingFor.length === 0) return "?";
    return lookingFor.map(g => g.charAt(0).toUpperCase()).join("/");
  };

  const age = calculateAge(profile.date_of_birth ?? null);
  const isBidirectional = profile._debug?.bidirectional_match ?? true;

  return (
    <div className="group relative">
      {/* Image */}
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 mb-2">
        {profile.profile_image_url ? (
          <img
            src={profile.profile_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-12 h-12 text-slate-400" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {/* Verified badge */}
          {profile.is_verified && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500 text-white text-xs font-medium">
              <Check className="w-3 h-3 mr-0.5" />
              Verified
            </span>
          )}
          
          {/* Has liked me badge */}
          {profile.has_liked_me && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-pink-500 text-white text-xs font-medium">
              <Heart className="w-3 h-3 mr-0.5" />
              Liked you
            </span>
          )}

          {/* Super like badge */}
          {profile.action === "super_like" && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500 text-white text-xs font-medium">
              <Star className="w-3 h-3 mr-0.5" />
              Super
            </span>
          )}
        </div>

        {/* Bidirectional indicator */}
        <div className="absolute top-2 right-2">
          {isBidirectional ? (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white">
              <Check className="w-4 h-4" />
            </span>
          ) : (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white">
              <X className="w-4 h-4" />
            </span>
          )}
        </div>

        {/* Distance badge */}
        {profile.distance_km !== undefined && (
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-black/60 text-white text-xs">
              <MapPin className="w-3 h-3 mr-0.5" />
              {profile.distance_km.toFixed(1)} km
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="text-sm font-medium text-slate-900 truncate">
          {profile.first_name || "Unknown"}{" "}
          {age && <span className="text-slate-500">{age}</span>}
        </p>
        
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span className={`font-medium ${
            profile.gender === "male" ? "text-blue-600" :
            profile.gender === "female" ? "text-pink-600" :
            "text-slate-600"
          }`}>
            {formatGender(profile.gender)}
          </span>
          <span>→</span>
          <span>{formatLookingFor(profile.looking_for)}</span>
        </div>

        {profile.city && (
          <p className="text-xs text-slate-500 truncate">
            {profile.city}, {profile.state}
          </p>
        )}

        {/* Match/Like time for matches and likes views */}
        {(resultType === "matches" && profile.matched_at) && (
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3" />
            {new Date(profile.matched_at).toLocaleDateString()}
          </p>
        )}
        {(resultType === "likes" && profile.liked_at) && (
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <Heart className="w-3 h-3" />
            {new Date(profile.liked_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Debug info on hover */}
      {profile._debug && (
        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-2 flex flex-col justify-end pointer-events-none">
          <div className="text-white text-xs space-y-1">
            <p className="font-medium">Debug Info</p>
            <p>Gender match: {profile._debug.gender_match ? "✓" : "✗"}</p>
            <p>Bidirectional: {profile._debug.bidirectional_match ? "✓" : "✗"}</p>
            <p>Can match: {profile.can_start_matching ? "✓" : "✗"}</p>
            <p>Hidden: {profile.profile_hidden ? "Yes" : "No"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
