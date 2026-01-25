"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Video, MoreVertical, Info } from "lucide-react";
import { MessageGroup, Message } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { Avatar } from "@/components/ui/Avatar";
import { MessageSkeleton } from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/utils";

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

export function ChatThread({
  conversationId,
  conversationType,
  conversationName,
  participants,
  currentUserId,
  initialMessages = [],
}: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(initialMessages.length === 0);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get the other participant for direct chats
  const otherParticipant =
    conversationType === "direct"
      ? participants.find((p) => p.user_id !== currentUserId)
      : null;

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

  // Create participant map for group chats
  const participantMap = new Map(
    participants.map((p) => [
      p.user_id,
      {
        name:
          p.profile?.first_name || p.user?.display_name || "Unknown",
        image: p.profile?.profile_image_url || null,
      },
    ])
  );

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (initialMessages.length === 0) {
      fetchMessages();
    }
  }, [fetchMessages, initialMessages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message
  const handleSend = async (
    content: string,
    type: "text" | "image" | "video" = "text",
    mediaUrl?: string
  ) => {
    if (!content && !mediaUrl) return;

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId,
      content,
      type,
      media_url: mediaUrl,
      created_at: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, tempMessage]);
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type, media_url: mediaUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempMessage.id ? { ...data.message, status: "sent" } : m
          )
        );
      } else {
        // Mark as failed
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempMessage.id ? { ...m, status: "failed" } : m
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMessage.id ? { ...m, status: "failed" } : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,64px)-var(--bottom-nav-height,0px))] md:h-[calc(100vh-64px)] bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        {/* Back button */}
        <Link
          href="/chats"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Avatar */}
        <Avatar
          src={displayImage}
          name={displayName}
          size="md"
          showOnlineIndicator={conversationType === "direct"}
          isOnline={isOnline}
        />

        {/* Name and Status */}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">{displayName}</h2>
          {conversationType === "group" ? (
            <p className="text-xs text-gray-500">
              {participants.length} members
            </p>
          ) : (
            <div className="flex items-center gap-1.5">
              {isOnline && (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-xs text-green-600 font-medium">Online</p>
                </>
              )}
              {!isOnline && (
                <p className="text-xs text-gray-500">Offline</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
            <Video className="w-5 h-5" />
          </button>
          {conversationType === "direct" && otherParticipant && (
            <Link
              href={`/profile/${otherParticipant.user_id}`}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            >
              <Info className="w-5 h-5" />
            </Link>
          )}
        </div>
      </header>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <MessageSkeleton key={i} isOwn={i % 2 === 0} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Start the conversation
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
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
            {isTyping && (
              <div className="flex gap-2 max-w-[85%] animate-fade-in">
                <Avatar
                  src={otherParticipant?.profile?.profile_image_url}
                  name={displayName}
                  size="sm"
                />
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput 
        onSend={handleSend} 
        disabled={sending}
        onTyping={(typing) => setIsTyping(typing)}
      />
    </div>
  );
}
