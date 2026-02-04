"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useConnectionState,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { ConnectionState } from "livekit-client";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, PhoneOff } from "lucide-react";

interface VideoCallRoomProps {
  roomName: string;
  token: string;
  serverUrl: string;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

/**
 * Connection status indicator component
 */
function ConnectionStatus() {
  const connectionState = useConnectionState();

  if (connectionState === ConnectionState.Connected) {
    return null;
  }

  const statusConfig: Record<string, { message: string; icon: typeof AlertCircle; color: string; spin?: boolean }> = {
    [ConnectionState.Disconnected]: {
      message: "Disconnected",
      icon: AlertCircle,
      color: "text-red-500",
    },
    [ConnectionState.Connecting]: {
      message: "Connecting...",
      icon: Loader2,
      color: "text-yellow-500",
      spin: true,
    },
    [ConnectionState.Reconnecting]: {
      message: "Reconnecting...",
      icon: Loader2,
      color: "text-yellow-500",
      spin: true,
    },
  };

  const config = statusConfig[connectionState] ?? {
    message: "Connecting...",
    icon: Loader2,
    color: "text-yellow-500",
    spin: true,
  };
  const Icon = config.icon;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-4 py-2 bg-black/70 rounded-full backdrop-blur-sm">
        <Icon className={cn("w-4 h-4", config.color, config.spin && "animate-spin")} />
        <span className={cn("text-sm font-medium", config.color)}>{config.message}</span>
      </div>
    </div>
  );
}

/**
 * Room event handler component
 */
function RoomEventHandler({
  onDisconnected,
  onError,
}: {
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}) {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;

    const handleDisconnected = () => {
      onDisconnected?.();
    };

    const handleError = (error: Error) => {
      console.error("LiveKit room error:", error);
      onError?.(error);
    };

    room.on("disconnected", handleDisconnected);
    room.on("mediaDevicesError", handleError);

    return () => {
      room.off("disconnected", handleDisconnected);
      room.off("mediaDevicesError", handleError);
    };
  }, [room, onDisconnected, onError]);

  return null;
}

/**
 * Loading state component
 */
function LoadingState({ message = "Connecting to call..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-neutral-900 text-white">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
      <p className="text-lg font-medium">{message}</p>
      <p className="text-sm text-neutral-400 mt-2">Please wait while we set up your video call</p>
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({
  error,
  onRetry,
  onLeave,
}: {
  error: Error;
  onRetry?: () => void;
  onLeave?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-neutral-900 text-white p-8">
      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
      <p className="text-neutral-400 text-center max-w-md mb-6">
        {error.message || "Failed to connect to the video call. Please check your connection and try again."}
      </p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        )}
        {onLeave && (
          <button
            onClick={onLeave}
            className="px-6 py-2.5 bg-neutral-700 text-white rounded-lg font-medium hover:bg-neutral-600 transition-colors flex items-center gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            Leave Call
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Main VideoCallRoom component
 * Wraps LiveKit components with connection handling and custom styling
 */
export function VideoCallRoom({
  roomName,
  token,
  serverUrl,
  onDisconnected,
  onError,
  className,
}: VideoCallRoomProps) {
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const handleError = useCallback(
    (error: Error) => {
      setConnectionError(error);
      onError?.(error);
    },
    [onError]
  );

  const handleConnected = useCallback(() => {
    setIsConnecting(false);
    setConnectionError(null);
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnecting(false);
    onDisconnected?.();
  }, [onDisconnected]);

  const handleRetry = useCallback(() => {
    setConnectionError(null);
    setIsConnecting(true);
  }, []);

  if (connectionError) {
    return (
      <ErrorState
        error={connectionError}
        onRetry={handleRetry}
        onLeave={onDisconnected}
      />
    );
  }

  return (
    <div className={cn("h-full w-full bg-neutral-900", className)}>
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect={true}
        video={true}
        audio={true}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
        onError={handleError}
        options={{
          adaptiveStream: true,
          dynacast: true,
          publishDefaults: {
            simulcast: true,
          },
        }}
        className="h-full"
      >
        <ConnectionStatus />
        <RoomEventHandler onDisconnected={handleDisconnected} onError={handleError} />
        <RoomAudioRenderer />
        
        {isConnecting ? (
          <LoadingState />
        ) : (
          <VideoConference />
        )}
      </LiveKitRoom>
    </div>
  );
}

export default VideoCallRoom;
