"use client";

import Link from "next/link";
import { MapPin, Briefcase, User, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface ProfileMetadata {
  profile_id: string;
  first_name: string | null;
  display_name?: string | null;
  age: number | null;
  location: string | null;
  profile_image_url: string | null;
  bio: string | null;
  occupation: string | null;
  is_hidden?: boolean;
}

interface ProfileMessageBubbleProps {
  content: string;
  metadata: ProfileMetadata;
  isOwn: boolean;
  createdAt: string;
}

/**
 * ProfileMessageBubble - Displays a profile preview card in chat
 * Used when matchmakers share profiles with their clients
 */
export function ProfileMessageBubble({
  content,
  metadata,
  isOwn,
  createdAt,
}: ProfileMessageBubbleProps) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle hidden/unavailable profiles
  if (metadata.is_hidden) {
    return (
      <div
        className={cn(
          "flex gap-2",
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        <div className="flex flex-col max-w-[320px]">
          {/* Message text if provided */}
          {content && (
            <div
              className={cn(
                "px-4 py-2.5 mb-2 shadow-sm rounded-[22px]",
                isOwn
                  ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white rounded-br-[8px]"
                  : "bg-[#E9E9EB] dark:bg-[#3a3a3c] text-gray-900 dark:text-gray-100 rounded-bl-[8px]"
              )}
            >
              <p className="text-[17px] leading-[1.3]">{content}</p>
            </div>
          )}

          {/* Unavailable profile card */}
          <div className="bg-gray-100 dark:bg-neutral-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center">
                <User className="w-7 h-7 text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-gray-500 dark:text-gray-400">
                  Profile unavailable
                </p>
                <p className="text-[13px] text-gray-400 dark:text-gray-500">
                  This profile is no longer available
                </p>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div
            className={cn(
              "flex items-center gap-1 mt-0.5",
              isOwn ? "justify-end mr-1" : "ml-1"
            )}
          >
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {formatTime(createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div className="flex flex-col max-w-[320px]">
        {/* Message text if provided */}
        {content && content !== "Check out this profile" && (
          <div
            className={cn(
              "px-4 py-2.5 mb-2 shadow-sm rounded-[22px]",
              isOwn
                ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white rounded-br-[8px]"
                : "bg-[#E9E9EB] dark:bg-[#3a3a3c] text-gray-900 dark:text-gray-100 rounded-bl-[8px]"
            )}
          >
            <p className="text-[17px] leading-[1.3]">{content}</p>
          </div>
        )}

        {/* Profile card */}
        <Link
          href={`/profile/${metadata.profile_id}`}
          className="block group"
        >
          <div className="bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-neutral-700 transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-neutral-600">
            {/* Profile header with image */}
            <div className="relative">
              {metadata.profile_image_url ? (
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={metadata.profile_image_url}
                    alt={metadata.display_name || metadata.first_name || "Profile"}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <Avatar
                    src={null}
                    name={metadata.display_name || metadata.first_name || "?"}
                    size="xl"
                  />
                </div>
              )}

              {/* Gradient overlay for text legibility */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Name and age overlay */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-white drop-shadow-lg">
                    {metadata.display_name || metadata.first_name || "Unknown"}
                  </span>
                  {metadata.age && (
                    <span className="text-lg text-white/90 drop-shadow-lg">
                      {metadata.age}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile details */}
            <div className="p-3 space-y-1.5">
              {/* Location */}
              {metadata.location && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  <span className="text-[13px]">{metadata.location}</span>
                </div>
              )}

              {/* Occupation */}
              {metadata.occupation && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  <span className="text-[13px]">{metadata.occupation}</span>
                </div>
              )}

              {/* Bio preview */}
              {metadata.bio && (
                <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-2">
                  {metadata.bio}
                </p>
              )}

              {/* View profile CTA */}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 dark:border-neutral-700">
                <span className="text-[13px] font-medium text-pink-500 dark:text-pink-400">
                  View Profile
                </span>
                <ChevronRight className="w-4 h-4 text-pink-500 dark:text-pink-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </Link>

        {/* Timestamp */}
        <div
          className={cn(
            "flex items-center gap-1 mt-1",
            isOwn ? "justify-end mr-1" : "ml-1"
          )}
        >
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {formatTime(createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
