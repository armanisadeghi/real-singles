"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  MessageCircle,
  Heart,
  Users,
  Calendar,
  Gift,
  Bell,
  Search,
  Star,
  Image,
  type LucideIcon,
} from "lucide-react";

type EmptyStateType =
  | "messages"
  | "matches"
  | "favorites"
  | "events"
  | "rewards"
  | "notifications"
  | "search"
  | "reviews"
  | "gallery"
  | "generic";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

const emptyStateConfig: Record<
  EmptyStateType,
  { icon: LucideIcon; title: string; description: string }
> = {
  messages: {
    icon: MessageCircle,
    title: "No messages yet",
    description: "Start a conversation with your matches",
  },
  matches: {
    icon: Users,
    title: "No matches yet",
    description: "Keep swiping to find your perfect match",
  },
  favorites: {
    icon: Heart,
    title: "No favorites yet",
    description: "Save profiles you like to find them later",
  },
  events: {
    icon: Calendar,
    title: "No events available",
    description: "Check back later for upcoming events",
  },
  rewards: {
    icon: Gift,
    title: "No rewards available",
    description: "Earn points to unlock exclusive rewards",
  },
  notifications: {
    icon: Bell,
    title: "No notifications",
    description: "You're all caught up!",
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your filters",
  },
  reviews: {
    icon: Star,
    title: "No reviews yet",
    description: "Be the first to leave a review",
  },
  gallery: {
    icon: Image,
    title: "No photos yet",
    description: "Add photos to complete your profile",
  },
  generic: {
    icon: Search,
    title: "Nothing here yet",
    description: "Check back later",
  },
};

export function EmptyState({
  type = "generic",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {title || config.title}
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        {description || config.description}
      </p>
      {(actionLabel && actionHref) || (actionLabel && onAction) ? (
        actionHref ? (
          <Link
            href={actionHref}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium text-sm hover:from-pink-600 hover:to-purple-700 transition-all shadow-sm"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium text-sm hover:from-pink-600 hover:to-purple-700 transition-all shadow-sm"
          >
            {actionLabel}
          </button>
        )
      ) : null}
    </div>
  );
}
