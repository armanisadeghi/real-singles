"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

interface CallInvitation {
  id: string;
  caller_id: string;
  callee_id: string;
  conversation_id: string | null;
  room_name: string;
  call_type: "audio" | "video";
  status: "pending" | "accepted" | "rejected" | "missed" | "cancelled";
  created_at: string;
  answered_at: string | null;
  ended_at: string | null;
  callerName?: string;
  callerAvatar?: string;
}

interface UseCallInvitationsOptions {
  userId: string | null;
  onIncomingCall?: (invitation: CallInvitation) => void;
  onCallCancelled?: (invitation: CallInvitation) => void;
}

interface UseCallInvitationsReturn {
  pendingInvitations: CallInvitation[];
  sendInvitation: (params: {
    calleeId: string;
    roomName: string;
    callType: "audio" | "video";
    conversationId?: string;
  }) => Promise<CallInvitation | null>;
  acceptInvitation: (invitationId: string) => Promise<boolean>;
  rejectInvitation: (invitationId: string) => Promise<boolean>;
  cancelInvitation: (invitationId: string) => Promise<boolean>;
  markAsMissed: (invitationId: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

// Helper to get typed table reference (until migration is run and types regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callInvitations(supabase: SupabaseClient): any {
  return supabase.from("call_invitations");
}

/**
 * Hook for managing call invitations via Supabase Realtime
 */
export function useCallInvitations({
  userId,
  onIncomingCall,
  onCallCancelled,
}: UseCallInvitationsOptions): UseCallInvitationsReturn {
  const [pendingInvitations, setPendingInvitations] = useState<CallInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch pending invitations on mount
  useEffect(() => {
    if (!userId) return;

    const fetchPendingInvitations = async () => {
      const { data, error } = await callInvitations(supabase)
        .select("*")
        .eq("callee_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending invitations:", error);
        return;
      }

      // Fetch caller profiles
      const callerIds = (data || []).map((inv: CallInvitation) => inv.caller_id).filter(Boolean);
      const { data: profiles } = callerIds.length > 0
        ? await supabase
            .from("profiles")
            .select("user_id, first_name, profile_image_url")
            .in("user_id", callerIds)
        : { data: [] };

      const profileMap = new Map(
        (profiles || [])
          .filter((p: { user_id: string | null }) => p.user_id !== null)
          .map((p: { user_id: string | null; first_name: string | null; profile_image_url: string | null }) => [p.user_id!, p])
      );

      const invitations = (data || []).map((inv: CallInvitation) => {
        const profile = profileMap.get(inv.caller_id);
        return {
          ...inv,
          callerName: profile?.first_name || undefined,
          callerAvatar: profile?.profile_image_url || undefined,
        };
      });

      setPendingInvitations(invitations);
    };

    fetchPendingInvitations();
  }, [userId, supabase]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      channel = supabase
        .channel(`call_invitations:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "call_invitations",
            filter: `callee_id=eq.${userId}`,
          },
          async (payload: { new: CallInvitation }) => {
            const newInvitation = payload.new;

            // Fetch caller info from profiles
            const { data: caller } = await supabase
              .from("profiles")
              .select("first_name, profile_image_url")
              .eq("user_id", newInvitation.caller_id)
              .single();

            const invitationWithCaller = {
              ...newInvitation,
              callerName: caller?.first_name || undefined,
              callerAvatar: caller?.profile_image_url || undefined,
            };

            if (newInvitation.status === "pending") {
              setPendingInvitations((prev) => [invitationWithCaller, ...prev]);
              onIncomingCall?.(invitationWithCaller);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "call_invitations",
            filter: `callee_id=eq.${userId}`,
          },
          (payload: { new: CallInvitation }) => {
            const updated = payload.new;

            // Remove from pending if no longer pending
            if (updated.status !== "pending") {
              setPendingInvitations((prev) =>
                prev.filter((inv) => inv.id !== updated.id)
              );

              if (updated.status === "cancelled") {
                onCallCancelled?.(updated);
              }
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, supabase, onIncomingCall, onCallCancelled]);

  /**
   * Send a call invitation to another user
   */
  const sendInvitation = useCallback(
    async ({
      calleeId,
      roomName,
      callType,
      conversationId,
    }: {
      calleeId: string;
      roomName: string;
      callType: "audio" | "video";
      conversationId?: string;
    }): Promise<CallInvitation | null> => {
      if (!userId) {
        setError("Not authenticated");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await callInvitations(supabase)
          .insert({
            caller_id: userId,
            callee_id: calleeId,
            room_name: roomName,
            call_type: callType,
            conversation_id: conversationId || null,
            status: "pending",
          })
          .select()
          .single();

        if (error) throw error;

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send invitation";
        setError(message);
        console.error("Error sending call invitation:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, supabase]
  );

  /**
   * Accept a call invitation
   */
  const acceptInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const { error } = await callInvitations(supabase)
          .update({
            status: "accepted",
            answered_at: new Date().toISOString(),
          })
          .eq("id", invitationId);

        if (error) throw error;

        setPendingInvitations((prev) =>
          prev.filter((inv) => inv.id !== invitationId)
        );

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to accept invitation";
        setError(message);
        console.error("Error accepting call invitation:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Reject a call invitation
   */
  const rejectInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const { error } = await callInvitations(supabase)
          .update({
            status: "rejected",
            ended_at: new Date().toISOString(),
          })
          .eq("id", invitationId);

        if (error) throw error;

        setPendingInvitations((prev) =>
          prev.filter((inv) => inv.id !== invitationId)
        );

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to reject invitation";
        setError(message);
        console.error("Error rejecting call invitation:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Cancel an outgoing call invitation
   */
  const cancelInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const { error } = await callInvitations(supabase)
          .update({
            status: "cancelled",
            ended_at: new Date().toISOString(),
          })
          .eq("id", invitationId);

        if (error) throw error;

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to cancel invitation";
        setError(message);
        console.error("Error cancelling call invitation:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Mark an invitation as missed (timed out)
   */
  const markAsMissed = useCallback(
    async (invitationId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const { error } = await callInvitations(supabase)
          .update({
            status: "missed",
            ended_at: new Date().toISOString(),
          })
          .eq("id", invitationId);

        if (error) throw error;

        setPendingInvitations((prev) =>
          prev.filter((inv) => inv.id !== invitationId)
        );

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to mark as missed";
        setError(message);
        console.error("Error marking call as missed:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  return {
    pendingInvitations,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    markAsMissed,
    isLoading,
    error,
  };
}

export default useCallInvitations;
