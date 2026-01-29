"use client";

import {
  User,
  CheckCircle,
  MessageCircle,
  Archive,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { cn, calculateAge } from "@/lib/utils";
import Link from "next/link";

interface UserWithProfile {
  id: string;
  email: string;
  display_name: string | null;
  status: string | null;
  profile_image_url: string | null;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  city: string | null;
  state: string | null;
  date_of_birth: string | null;
  is_verified: boolean | null;
  is_photo_verified: boolean | null;
}

interface MutualMatch {
  id: string;
  user: UserWithProfile;
  matched_at: string;
  conversation_id: string | null;
  message_count: number;
  is_archived: boolean;
}

interface MatchCardProps {
  match: MutualMatch;
}

export function MatchCard({ match }: MatchCardProps) {
  const { user, matched_at, conversation_id, message_count, is_archived } = match;

  const name =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.display_name || user.email.split("@")[0];

  const age = user.date_of_birth ? calculateAge(user.date_of_birth) : null;
  const location =
    user.city && user.state
      ? `${user.city}, ${user.state}`
      : user.city || user.state || null;

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-sm",
        "opacity-100 translate-y-0",
        "[transition:opacity_300ms,transform_300ms]",
        "[@starting-style]:opacity-0 [@starting-style]:translate-y-3",
        is_archived && "opacity-60"
      )}
    >
      <div className="flex">
        {/* Image */}
        <Link
          href={`/admin/users/${user.id}`}
          className="relative w-24 h-24 shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 group"
        >
          {user.profile_image_url ? (
            <img
              src={user.profile_image_url}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-8 h-8 text-slate-300" />
            </div>
          )}

          {/* Gender badge */}
          {user.gender && (
            <div className="absolute bottom-1 left-1">
              <span
                className={cn(
                  "px-1.5 py-0.5 text-[10px] font-medium rounded-full",
                  user.gender === "male"
                    ? "bg-blue-500/90 text-white"
                    : "bg-pink-500/90 text-white"
                )}
              >
                {user.gender === "male" ? "M" : "F"}
              </span>
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="font-semibold text-slate-900 truncate hover:text-blue-600 transition-colors"
                >
                  {name}
                  {age && (
                    <span className="text-slate-500 font-normal">, {age}</span>
                  )}
                </Link>
                {user.is_verified && (
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                )}
              </div>

              {location && (
                <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {location}
                </p>
              )}

              <p className="text-xs text-slate-400 mt-1">
                Matched {new Date(matched_at).toLocaleDateString()}
              </p>
            </div>

            {/* Status badges */}
            <div className="flex flex-col gap-1 shrink-0">
              {is_archived && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                  <Archive className="w-3 h-3" />
                  Archived
                </span>
              )}
              {user.status && user.status !== "active" && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full capitalize">
                  {user.status}
                </span>
              )}
            </div>
          </div>

          {/* Conversation info */}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>
                {message_count} message{message_count !== 1 ? "s" : ""}
              </span>
            </div>

            {conversation_id && (
              <Link
                href={`/admin/conversations/${conversation_id}`}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                View conversation
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MatchGridProps {
  matches: MutualMatch[];
}

export function MatchGrid({ matches }: MatchGridProps) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-slate-300" />
        </div>
        <h4 className="font-semibold text-slate-700 mb-1">No mutual matches</h4>
        <p className="text-sm text-slate-500 max-w-sm">
          This user hasn&apos;t matched with anyone yet. A match occurs when two
          users like each other.
        </p>
      </div>
    );
  }

  // Separate active from archived
  const activeMatches = matches.filter((m) => !m.is_archived);
  const archivedMatches = matches.filter((m) => m.is_archived);

  return (
    <div className="space-y-6">
      {/* Stats header */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-600">
          <strong className="text-slate-900">{matches.length}</strong> total
          matches
        </span>
        {activeMatches.length > 0 && (
          <span className="text-emerald-600">
            <strong>{activeMatches.length}</strong> active
          </span>
        )}
        {archivedMatches.length > 0 && (
          <span className="text-slate-500">
            <strong>{archivedMatches.length}</strong> archived
          </span>
        )}
      </div>

      {/* Active matches */}
      {activeMatches.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">Active Matches</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {activeMatches.map((match, index) => (
              <div
                key={match.id}
                style={{ transitionDelay: `${Math.min(index * 50, 300)}ms` }}
              >
                <MatchCard match={match} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archived matches */}
      {archivedMatches.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-500">
            Archived Matches (Unmatched)
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {archivedMatches.map((match, index) => (
              <div
                key={match.id}
                style={{
                  transitionDelay: `${Math.min((activeMatches.length + index) * 50, 500)}ms`,
                }}
              >
                <MatchCard match={match} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
