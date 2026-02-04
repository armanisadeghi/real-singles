"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { VideoCallRoom } from "@/components/video-call";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { useToast } from "@/components/ui/Toast";
import { PhoneOff, AlertCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ roomName: string }>;
}

interface TokenResponse {
  success: boolean;
  data?: {
    token: string;
    serverUrl: string;
    roomName: string;
    identity: string;
    displayName: string;
  };
  msg?: string;
}

export default function VideoCallPage({ params }: PageProps) {
  const { roomName } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [tokenData, setTokenData] = useState<TokenResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  // Fetch token on mount
  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: decodeURIComponent(roomName) }),
      });

      const data: TokenResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.msg || "Failed to get call token");
      }

      setTokenData(data.data!);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect to call";
      setError(message);
      console.error("Error fetching token:", err);
    } finally {
      setLoading(false);
    }
  }, [roomName]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // Handle call end
  const handleCallEnd = useCallback(async () => {
    setIsEnding(true);

    try {
      // Log call end (optional - could record call duration, etc.)
      // For now, just navigate back
      toast.success("Call ended");
      
      // Navigate back to previous page or chats
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/chats");
      }
    } catch (err) {
      console.error("Error ending call:", err);
      router.push("/chats");
    }
  }, [router, toast]);

  // Handle disconnection
  const handleDisconnected = useCallback(() => {
    if (!isEnding) {
      toast.info("Disconnected from call");
      handleCallEnd();
    }
  }, [handleCallEnd, isEnding, toast]);

  // Handle errors
  const handleError = useCallback(
    (err: Error) => {
      console.error("Call error:", err);
      toast.error(err.message || "An error occurred during the call");
    },
    [toast]
  );

  // Loading state
  if (loading) {
    return (
      <div className="h-[calc(100dvh-var(--header-height))] bg-neutral-900 flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connecting...</h2>
          <p className="text-neutral-400">Setting up your video call</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-[calc(100dvh-var(--header-height))] bg-neutral-900 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Unable to Join Call
          </h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchToken}
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-2.5 bg-neutral-700 text-white rounded-lg font-medium hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main call view
  if (!tokenData) {
    return null;
  }

  return (
    <div className="h-[calc(100dvh-var(--header-height))] bg-neutral-900 relative">
      {/* End call button (floating) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={handleCallEnd}
          disabled={isEnding}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center",
            "bg-red-500 hover:bg-red-600 active:bg-red-700",
            "transition-all duration-200 hover:scale-110",
            "shadow-lg shadow-red-500/30",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="End call"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Video call room */}
      <VideoCallRoom
        roomName={tokenData.roomName}
        token={tokenData.token}
        serverUrl={tokenData.serverUrl}
        onDisconnected={handleDisconnected}
        onError={handleError}
        className="h-full"
      />
    </div>
  );
}
