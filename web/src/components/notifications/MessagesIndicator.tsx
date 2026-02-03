"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/**
 * MessagesIndicator Component
 * 
 * Displays a messages icon with a badge showing the count of conversations
 * with unread messages. Supports realtime updates via Supabase subscriptions.
 * 
 * Features:
 * - Lightweight polling every 30s as fallback
 * - Realtime updates when new messages arrive
 * - Badge shows count up to 9, then "9+"
 */
export function MessagesIndicator() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch unread count from API
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll every 30 seconds as fallback
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Realtime subscription for new messages
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to messages table for new insertions
    const channel = supabase
      .channel("messages-indicator")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          // When any message is inserted, refetch the count
          // This is more reliable than trying to track individual conversations
          fetchUnreadCount();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
        },
        () => {
          // When last_read_at is updated, refetch count
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUnreadCount]);

  // Also refetch on window focus/visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    };

    const handleFocus = () => {
      fetchUnreadCount();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchUnreadCount]);

  return (
    <Link
      href="/messages"
      className={cn(
        "relative p-2 rounded-full transition-colors",
        "hover:bg-gray-100 active:bg-gray-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
      )}
      aria-label={
        unreadCount > 0
          ? `Messages - ${unreadCount} unread conversation${unreadCount !== 1 ? "s" : ""}`
          : "Messages"
      }
    >
      <MessageCircle className="w-5 h-5 text-gray-600" />
      {!loading && unreadCount > 0 && (
        <span 
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-pink-500 text-white text-[10px] font-bold rounded-full"
          aria-hidden="true"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
