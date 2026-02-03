"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Phone, Video } from "lucide-react";
import { MessageGroup, Message } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { ComingSoonModal } from "./ComingSoonModal";
import { Avatar } from "@/components/ui/Avatar";
import { MessageSkeleton } from "@/components/ui/LoadingSkeleton";
import { useChat } from "@/hooks/useSupabaseMessaging";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { Message as SupabaseMessage } from "@/lib/supabase/messaging";

interface Participant {
  user_id: string;
  user: {
    display_name?: string | null;
  } | null;
  profile?: {
    first_name?: string | null;
    profile_image_url?: string | null;
  } | null;
}

interface ChatThreadProps {
  conversationId: string;
  conversationType: "direct" | "group";
  conversationName?: string | null;
  participants: Participant[];
  currentUserId: string;
  initialMessages?: Message[];
}

/**
 * ChatThread - iOS-inspired full-screen chat interface
 * 
 * Features:
 * - Full viewport height with safe area handling
 * - Condensed translucent header
 * - Clickable avatar (navigates to profile)
 * - Floating message input
 * - Clean, borderless design
 */
export function ChatThread({
  conversationId,
  conversationType,
  conversationName,
  participants,
  currentUserId,
}: ChatThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Modal state for call/video coming soon
  const [comingSoonModal, setComingSoonModal] = useState<{
    isOpen: boolean;
    feature: "call" | "video";
  }>({ isOpen: false, feature: "call" });

  // Get the other participant for direct chats
  const otherParticipant =
    conversationType === "direct"
      ? participants.find((p) => p.user_id !== currentUserId)
      : null;

  // Track online presence for conversation participants
  const { isUserOnline } = useOnlinePresence({
    conversationId,
    currentUserId,
    enabled: conversationType === "direct",
  });

  // Check if the other participant is online
  const isOnline = otherParticipant ? isUserOnline(otherParticipant.user_id) : false;

  const displayName =
    conversationType === "group"
      ? conversationName || "Group Chat"
      : otherParticipant?.profile?.first_name ||
        otherParticipant?.user?.display_name ||
        "Unknown";

  const displayImage =
    conversationType === "direct"
      ? otherParticipant?.profile?.profile_image_url
      : null;

  // Use the Supabase chat hook for real-time messaging
  const {
    messages: supabaseMessages,
    loading,
    sendMessage,
    setTyping,
    isAnyoneTyping,
    typingText,
  } = useChat({
    conversationId,
    currentUserId,
    displayName: displayName,
    initialLimit: 50,
    autoMarkAsRead: true,
  });

  // Convert Supabase messages to the format expected by MessageGroup
  const messages: Message[] = supabaseMessages.map((msg: SupabaseMessage) => ({
    id: msg.id,
    sender_id: msg.sender_id,
    content: msg.content,
    type: msg.message_type as "text" | "image" | "video",
    media_url: msg.media_url || undefined,
    created_at: msg.created_at,
    status: msg.status as "sending" | "sent" | "delivered" | "read" | "failed",
  }));

  // Create participant map for group chats
  const participantMap = new Map(
    participants.map((p) => [
      p.user_id,
      {
        name: p.profile?.first_name || p.user?.display_name || "Unknown",
        image: p.profile?.profile_image_url || null,
      },
    ])
  );

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message handler
  const handleSend = async (
    content: string,
    type: "text" | "image" | "video" = "text",
    mediaUrl?: string
  ) => {
    if (!content && !mediaUrl) return;

    try {
      setTyping(false);
      await sendMessage(content);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle typing indicator
  const handleTypingChange = useCallback((isTyping: boolean) => {
    setTyping(isTyping);
  }, [setTyping]);

  // Handle call/video button clicks
  const handleCallClick = () => {
    setComingSoonModal({ isOpen: true, feature: "call" });
  };

  const handleVideoClick = () => {
    setComingSoonModal({ isOpen: true, feature: "video" });
  };

  const closeModal = () => {
    setComingSoonModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <>
      {/* Full-screen chat container - explicit viewport dimensions to override scrollbar-gutter */}
      <div className="fixed top-0 left-0 w-screen h-screen flex flex-col bg-white dark:bg-neutral-950 overflow-hidden">
        {/* iOS 26-style Header - Three floating elements, transparent */}
        <header className="absolute top-0 left-0 right-0 pt-[env(safe-area-inset-top)] z-40 pointer-events-none">
          <div className="relative flex items-start justify-between px-3 py-2.5">
            {/* Left: Back button */}
            <Link
              href="/messages"
              className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-gray-200/70 dark:bg-neutral-700/70 backdrop-blur-xl active:bg-gray-300/80 dark:active:bg-neutral-600/80 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" strokeWidth={2.5} />
            </Link>

            {/* Center: Avatar + Name pill overlapping */}
            <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
              {conversationType === "direct" && otherParticipant ? (
                <Link
                  href={`/profile/${otherParticipant.user_id}`}
                  className="flex flex-col items-center active:opacity-80 transition-opacity"
                >
                  {/* Avatar */}
                  <div className="relative z-10">
                    <Avatar
                      src={displayImage}
                      name={displayName}
                      size="lg"
                      showOnlineIndicator={false}
                    />
                    {/* Online indicator dot */}
                    {isOnline && (
                      <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-neutral-950 rounded-full" />
                    )}
                  </div>
                  {/* Name pill - overlaps avatar with negative margin */}
                  <div className="-mt-3 px-3 py-1 bg-gray-200/70 dark:bg-neutral-700/70 backdrop-blur-xl rounded-full flex items-center gap-0.5">
                    <span className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                      {displayName}
                    </span>
                    <ChevronLeft className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 rotate-180" strokeWidth={2.5} />
                  </div>
                </Link>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative z-10">
                    <Avatar
                      src={displayImage}
                      name={displayName}
                      size="lg"
                    />
                  </div>
                  <div className="-mt-3 px-3 py-1 bg-gray-200/70 dark:bg-neutral-700/70 backdrop-blur-xl rounded-full">
                    <span className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                      {displayName}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Call & Video buttons - same style as back button */}
            <div className="pointer-events-auto flex items-center gap-1.5">
              <button 
                onClick={handleCallClick}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200/70 dark:bg-neutral-700/70 backdrop-blur-xl active:bg-gray-300/80 dark:active:bg-neutral-600/80 transition-colors"
                aria-label="Voice call"
              >
                <Phone className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
              <button 
                onClick={handleVideoClick}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200/70 dark:bg-neutral-700/70 backdrop-blur-xl active:bg-gray-300/80 dark:active:bg-neutral-600/80 transition-colors"
                aria-label="Video call"
              >
                <Video className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages Area - Scrollbar at right edge, padding for floating header */}
        <div
          ref={containerRef}
          className="flex-1 w-full overflow-y-auto overscroll-contain scrollbar-thin"
        >
          <div className="px-2 pt-[100px] pb-20">
            {loading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <MessageSkeleton key={i} isOwn={i % 2 === 0} />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full min-h-[35vh] sm:min-h-[40vh] flex flex-col items-center justify-center text-center px-2">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 flex items-center justify-center mb-3">
                  <span className="text-2xl sm:text-3xl">👋</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm sm:text-base">
                  Start the conversation
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[220px] sm:max-w-[240px]">
                  Send a message to {displayName} to get things started!
                </p>
              </div>
            ) : (
              <>
                <MessageGroup
                  messages={messages}
                  currentUserId={currentUserId}
                  showAvatars={conversationType === "group"}
                  participants={participantMap}
                />
                
                {/* Typing Indicator */}
                {isAnyoneTyping && (
                  <div className="flex gap-2 max-w-[85%] animate-fade-in mt-2">
                    <Avatar
                      src={otherParticipant?.profile?.profile_image_url}
                      name={displayName}
                      size="xs"
                    />
                    <div className="bg-[#E9E9EB] dark:bg-[#3a3a3c] rounded-2xl rounded-bl-md px-4 py-2.5">
                      <div className="flex gap-1 items-center">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        {typingText && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">{typingText}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Message Input */}
        <MessageInput 
          onSend={handleSend} 
          disabled={loading}
          onTyping={handleTypingChange}
        />
      </div>

      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={comingSoonModal.isOpen}
        onClose={closeModal}
        feature={comingSoonModal.feature}
      />
    </>
  );
}
