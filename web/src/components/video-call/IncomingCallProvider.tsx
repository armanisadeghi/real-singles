"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IncomingCallModal } from "./IncomingCallModal";
import { useToast } from "@/components/ui/Toast";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { CallInvitation } from "./types";

interface IncomingCallProviderProps {
  userId: string;
  children: React.ReactNode;
}

/**
 * Provider component that listens for incoming call invitations
 * and displays the IncomingCallModal when a call comes in
 */
export function IncomingCallProvider({ userId, children }: IncomingCallProviderProps) {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();

  const [incomingCall, setIncomingCall] = useState<CallInvitation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Subscribe to incoming call invitations
  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      channel = supabase
        .channel(`incoming_calls:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "call_invitations",
            filter: `callee_id=eq.${userId}`,
          },
          async (payload) => {
            const invitation = payload.new as CallInvitation;

            // Only show pending invitations
            if (invitation.status !== "pending") return;

            // Fetch caller profile and display name
            const [{ data: profile }, { data: callerUser }] = await Promise.all([
              supabase
                .from("profiles")
                .select("first_name, profile_image_url")
                .eq("user_id", invitation.caller_id)
                .single(),
              supabase
                .from("users")
                .select("display_name")
                .eq("id", invitation.caller_id)
                .single(),
            ]);

            setIncomingCall({
              ...invitation,
              callerName: callerUser?.display_name || profile?.first_name || "Someone",
              callerAvatar: profile?.profile_image_url || undefined,
            });
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
          (payload) => {
            const updated = payload.new as CallInvitation;

            // If the current incoming call was cancelled, dismiss it
            if (incomingCall?.id === updated.id && updated.status === "cancelled") {
              setIncomingCall(null);
              toast.info("The caller ended the call");
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
  }, [userId, supabase, incomingCall, toast]);

  // Handle accepting a call
  const handleAccept = useCallback(
    async (invitation: CallInvitation) => {
      setIsProcessing(true);

      try {
        // Update the invitation status to accepted
        const { error } = await supabase
          .from("call_invitations")
          .update({
            status: "accepted",
            answered_at: new Date().toISOString(),
          })
          .eq("id", invitation.id);

        if (error) {
          console.error("Error accepting call:", error);
          toast.error("Failed to accept call");
          return;
        }

        // Clear the modal
        setIncomingCall(null);

        // Navigate to the call page
        router.push(`/call/${invitation.room_name}`);
      } catch (error) {
        console.error("Error accepting call:", error);
        toast.error("Failed to accept call");
      } finally {
        setIsProcessing(false);
      }
    },
    [supabase, router, toast]
  );

  // Handle rejecting a call
  const handleReject = useCallback(
    async (invitation: CallInvitation) => {
      setIsProcessing(true);

      try {
        // Update the invitation status to rejected
        const { error } = await supabase
          .from("call_invitations")
          .update({
            status: "rejected",
            ended_at: new Date().toISOString(),
          })
          .eq("id", invitation.id);

        if (error) {
          console.error("Error rejecting call:", error);
        }

        // Clear the modal
        setIncomingCall(null);
      } catch (error) {
        console.error("Error rejecting call:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [supabase]
  );

  // Handle call timeout
  const handleTimeout = useCallback(
    async (invitation: CallInvitation) => {
      try {
        // Update the invitation status to missed
        await supabase
          .from("call_invitations")
          .update({
            status: "missed",
            ended_at: new Date().toISOString(),
          })
          .eq("id", invitation.id);

        // Clear the modal
        setIncomingCall(null);
        toast.info("Missed call");
      } catch (error) {
        console.error("Error marking call as missed:", error);
        setIncomingCall(null);
      }
    },
    [supabase, toast]
  );

  return (
    <>
      {children}
      <IncomingCallModal
        invitation={incomingCall}
        onAccept={handleAccept}
        onReject={handleReject}
        onTimeout={handleTimeout}
        timeoutSeconds={30}
      />
    </>
  );
}

export default IncomingCallProvider;
