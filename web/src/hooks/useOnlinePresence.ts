"use client";

/**
 * Online Presence Hook for Web
 *
 * Tracks which users are online in a conversation using Supabase Presence.
 * This is separate from typing indicators to allow independent control.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel, RealtimePresenceState } from "@supabase/supabase-js";

interface PresenceUser {
  user_id: string;
  online_at: string;
}

interface UseOnlinePresenceOptions {
  conversationId: string;
  currentUserId: string;
  enabled?: boolean;
}

interface UseOnlinePresenceReturn {
  onlineUsers: string[];
  isUserOnline: (userId: string) => boolean;
  isConnected: boolean;
}

/**
 * Hook for tracking online presence in a conversation
 */
export function useOnlinePresence({
  conversationId,
  currentUserId,
  enabled = true,
}: UseOnlinePresenceOptions): UseOnlinePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!conversationId || !currentUserId || !enabled) {
      return;
    }

    const channelName = `presence:${conversationId}`;

    // Create presence channel
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channelRef.current = channel;

    // Handle presence sync
    channel.on("presence", { event: "sync" }, () => {
      const presenceState = channel.presenceState() as RealtimePresenceState<PresenceUser>;
      const users: string[] = [];

      Object.entries(presenceState).forEach(([key, presences]) => {
        // The key is the user_id (from config.presence.key)
        if (key !== currentUserId) {
          users.push(key);
        }
      });

      setOnlineUsers(users);
    });

    // Handle user joining
    channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
      console.log(`[Presence] User joined: ${key}`);
    });

    // Handle user leaving
    channel.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
      console.log(`[Presence] User left: ${key}`);
    });

    // Subscribe and track our presence
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
        console.log(`[Presence] Connected to ${channelName}`);

        // Track our presence
        await channel.track({
          user_id: currentUserId,
          online_at: new Date().toISOString(),
        });
      } else if (status === "CHANNEL_ERROR") {
        setIsConnected(false);
        console.error(`[Presence] Channel error for ${channelName}`);
      } else if (status === "CLOSED") {
        setIsConnected(false);
      }
    });

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
      setOnlineUsers([]);
    };
  }, [conversationId, currentUserId, enabled, supabase]);

  // Helper to check if a specific user is online
  const isUserOnline = useCallback(
    (userId: string) => {
      return onlineUsers.includes(userId);
    },
    [onlineUsers]
  );

  return {
    onlineUsers,
    isUserOnline,
    isConnected,
  };
}

/**
 * Hook for tracking global online status (not conversation-specific)
 * Useful for chat lists to show who's online
 */
export function useGlobalOnlineStatus(currentUserId: string) {
  const [isOnline, setIsOnline] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel("global-presence", {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: currentUserId,
          online_at: new Date().toISOString(),
        });
        setIsOnline(true);
      }
    });

    // Handle visibility change (app backgrounded)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        channel.untrack();
      } else {
        channel.track({
          user_id: currentUserId,
          online_at: new Date().toISOString(),
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);

  return { isOnline };
}
