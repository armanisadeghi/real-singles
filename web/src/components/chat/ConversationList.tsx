"use client";

import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";
import { cn, formatRelativeTime, truncate } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConversationSkeleton } from "@/components/ui/LoadingSkeleton";

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count: number;
  participants: Array<{
    user_id: string;
    user: {
      display_name?: string | null;
      last_active_at?: string | null;
    } | null;
    profile?: {
      first_name?: string | null;
      profile_image_url?: string | null;
    } | null;
  }>;
}

// Helper to check if user is online (active within last 5 minutes)
const isUserOnline = (lastActiveAt?: string | null): boolean => {
  if (!lastActiveAt) return false;
  const lastActive = new Date(lastActiveAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastActive.getTime()) / 1000 / 60;
  return diffMinutes < 5;
};

interface ConversationListProps {
  conversations: Conversation[];
  loading?: boolean;
  currentUserId: string;
  activeConversationId?: string;
  onSearch?: (query: string) => void;
}

export function ConversationList({
  conversations,
  loading = false,
  currentUserId,
  activeConversationId,
  onSearch,
}: ConversationListProps) {
  const getConversationDisplay = (conversation: Conversation) => {
    if (conversation.type === "group" && conversation.name) {
      return {
        name: conversation.name,
        image: null,
        initials: conversation.name.substring(0, 2).toUpperCase(),
      };
    }

    // For direct conversations, get the other participant
    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== currentUserId
    );

    if (otherParticipant) {
      const name =
        otherParticipant.profile?.first_name ||
        otherParticipant.user?.display_name ||
        "Unknown";
      return {
        name,
        image: otherParticipant.profile?.profile_image_url,
        initials: name.substring(0, 2).toUpperCase(),
      };
    }

    return { name: "Unknown", image: null, initials: "?" };
  };

  if (loading) {
    return (
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        type="messages"
        title="No conversations yet"
        description="When you match with someone, you can start chatting here"
        actionLabel="Start Discovering"
        actionHref="/discover"
      />
    );
  }

  return (
    <div>
      {/* Search */}
      {onSearch && (
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Conversations */}
      <div className="divide-y">
        {conversations.map((conversation) => {
          const display = getConversationDisplay(conversation);
          const isActive = conversation.id === activeConversationId;

          return (
            <Link
              key={conversation.id}
              href={`/chats/${conversation.id}`}
              className={cn(
                "flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors",
                isActive && "bg-pink-50 hover:bg-pink-50"
              )}
            >
              {/* Avatar */}
              <Avatar
                src={display.image}
                name={display.name}
                size="lg"
                showOnlineIndicator={conversation.type === "direct"}
                isOnline={conversation.type === "direct" && (() => {
                  const otherParticipant = conversation.participants.find(
                    (p) => p.user_id !== currentUserId
                  );
                  return isUserOnline(otherParticipant?.user?.last_active_at);
                })()}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={cn(
                      "font-semibold truncate",
                      conversation.unread_count > 0
                        ? "text-gray-900"
                        : "text-gray-700"
                    )}
                  >
                    {display.name}
                  </h3>
                  {conversation.last_message_at && (
                    <span className="text-xs text-gray-400 shrink-0">
                      {formatRelativeTime(conversation.last_message_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p
                    className={cn(
                      "text-sm truncate",
                      conversation.unread_count > 0
                        ? "text-gray-900 font-medium"
                        : "text-gray-500"
                    )}
                  >
                    {conversation.last_message || "Start the conversation!"}
                  </p>
                  {conversation.unread_count > 0 && (
                    <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-pink-500 text-white text-xs font-bold rounded-full">
                      {conversation.unread_count > 9
                        ? "9+"
                        : conversation.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
