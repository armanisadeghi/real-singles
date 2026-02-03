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
      <div className="fixed top-0 left-0 w-screen h-screen flex flex-col bg-white overflow-hidden">
        {/* iOS-style Header - Translucent with blur */}
        <header className="shrink-0 bg-white/90 backdrop-blur-xl pt-[env(safe-area-inset-top)] z-40 border-b border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2 h-[52px]">
            {/* Back button - iOS chevron style */}
            <Link
              href="/chats"
              className="flex items-center justify-center w-10 h-10 -ml-1 rounded-full active:bg-gray-100/80 transition-colors text-blue-500"
            >
              <ChevronLeft className="w-7 h-7" strokeWidth={2.5} />
            </Link>

            {/* Clickable Avatar - navigates to profile */}
            {conversationType === "direct" && otherParticipant ? (
              <Link
                href={`/profile/${otherParticipant.user_id}`}
                className="shrink-0 flex items-center active:opacity-80 transition-opacity"
              >
                <Avatar
                  src={displayImage}
                  name={displayName}
                  size="sm"
                  showOnlineIndicator={true}
                  isOnline={isOnline}
                />
              </Link>
            ) : (
              <div className="shrink-0 flex items-center">
                <Avatar
                  src={displayImage}
                  name={displayName}
                  size="sm"
                />
              </div>
            )}

            {/* Name - also clickable for direct chats */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {conversationType === "direct" && otherParticipant ? (
                <Link
                  href={`/profile/${otherParticipant.user_id}`}
                  className="block active:opacity-70 transition-opacity"
                >
                  <h2 className="font-semibold text-gray-900 truncate text-[16px] leading-tight">
                    {displayName}
                  </h2>
                  {/* Online status - only show when online */}
                  {isOnline && (
                    <p className="text-[12px] text-gray-500">Active now</p>
                  )}
                </Link>
              ) : (
                <>
                  <h2 className="font-semibold text-gray-900 truncate text-[16px] leading-tight">
                    {displayName}
                  </h2>
                  {conversationType === "group" && (
                    <p className="text-[12px] text-gray-500">{participants.length} members</p>
                  )}
                </>
              )}
            </div>

            {/* Action buttons - Call & Video */}
            <div className="flex items-center shrink-0">
              <button 
                onClick={handleCallClick}
                className="flex items-center justify-center w-10 h-10 rounded-full active:bg-gray-100/80 transition-colors text-blue-500"
                aria-label="Voice call"
              >
                <Phone className="w-6 h-6" />
              </button>
              <button 
                onClick={handleVideoClick}
                className="flex items-center justify-center w-10 h-10 rounded-full active:bg-gray-100/80 transition-colors text-blue-500"
                aria-label="Video call"
              >
                <Video className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages Area - Scrollbar at right edge */}
        <div
          ref={containerRef}
          className="flex-1 w-full overflow-y-auto overscroll-contain scrollbar-thin"
        >
          <div className="pl-4 pr-1 py-3 pb-24">
            {loading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <MessageSkeleton key={i} isOwn={i % 2 === 0} />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full min-h-[50vh] flex flex-col items-center justify-center text-center px-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mb-4">
                  <span className="text-3xl">👋</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Start the conversation
                </h3>
                <p className="text-sm text-gray-500 max-w-[240px]">
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
                    <div className="bg-[#E9E9EB] rounded-2xl rounded-bl-md px-4 py-2.5">
                      <div className="flex gap-1 items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        {typingText && (
                          <span className="text-xs text-gray-500 ml-1.5">{typingText}</span>
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
