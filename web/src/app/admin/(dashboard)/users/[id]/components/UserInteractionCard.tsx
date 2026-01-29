"use client";

import { User, CheckCircle, Sparkles, Heart, MapPin } from "lucide-react";
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

interface UserInteractionCardProps {
  user: UserWithProfile;
  action?: string;
  timestamp: string;
  isMutual?: boolean;
  direction?: "received" | "given";
  showTimestamp?: boolean;
}

export function UserInteractionCard({
  user,
  action,
  timestamp,
  isMutual = false,
  direction = "received",
  showTimestamp = true,
}: UserInteractionCardProps) {
  const name =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.display_name || user.email.split("@")[0];

  const age = user.date_of_birth ? calculateAge(user.date_of_birth) : null;
  const location =
    user.city && user.state
      ? `${user.city}, ${user.state}`
      : user.city || user.state || null;

  const isSuperLike = action === "super_like";

  return (
    <Link
      href={`/admin/users/${user.id}`}
      className={cn(
        "group relative block rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-sm",
        "hover:shadow-md hover:border-slate-300",
        "transition-all duration-200",
        "[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
        "opacity-100 translate-y-0",
        "[transition:opacity_300ms,transform_300ms,box-shadow_200ms,border-color_200ms]",
        "[@starting-style]:opacity-0 [@starting-style]:translate-y-3"
      )}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200">
        {user.profile_image_url ? (
          <img
            src={user.profile_image_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-12 h-12 text-slate-300" />
          </div>
        )}

        {/* Badges overlay - top left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {user.is_verified && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
              <CheckCircle className="w-3 h-3" />
              Verified
            </span>
          )}
          {isSuperLike && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-full">
              <Sparkles className="w-3 h-3" />
              Super Like
            </span>
          )}
        </div>

        {/* Mutual indicator - top right */}
        {isMutual && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white text-xs font-medium rounded-full">
              <Heart className="w-3 h-3 fill-current" />
              Mutual
            </span>
          </div>
        )}

        {/* Gender badge - bottom left */}
        {user.gender && (
          <div className="absolute bottom-2 left-2">
            <span
              className={cn(
                "px-2 py-0.5 text-xs font-medium rounded-full",
                user.gender === "male"
                  ? "bg-blue-500/90 text-white"
                  : "bg-pink-500/90 text-white"
              )}
            >
              {user.gender === "male" ? "M" : "F"}
            </span>
          </div>
        )}

        {/* Status badge if not active */}
        {user.status && user.status !== "active" && (
          <div className="absolute bottom-2 right-2">
            <span className="px-2 py-0.5 bg-red-500/90 text-white text-xs font-medium rounded-full capitalize">
              {user.status}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-1">
          <h4 className="font-semibold text-slate-900 truncate">
            {name}
            {age && <span className="text-slate-500 font-normal">, {age}</span>}
          </h4>
        </div>

        {location && (
          <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <MapPin className="w-3 h-3" />
            {location}
          </p>
        )}

        {showTimestamp && (
          <p className="text-xs text-slate-400 mt-1">
            {direction === "received" ? "Received" : "Sent"}{" "}
            {new Date(timestamp).toLocaleDateString()}
          </p>
        )}
      </div>
    </Link>
  );
}
