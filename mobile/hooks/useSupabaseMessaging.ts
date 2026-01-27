/**
 * React hooks for Supabase Messaging
 *
 * These hooks provide easy integration of Supabase real-time messaging
 * in React Native components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Message,
  TypingUser,
  sendMessage as sendMessageFn,
  getMessages,
  subscribeToMessages,
  subscribeToTyping,
  markConversationAsRead,
  removeChannel,
  formatMessageForDisplay,
} from '@/services/supabaseMessaging';

// ============================================
// useMessages Hook
// ============================================

interface UseMessagesOptions {
  conversationId: string;
  currentUserId: string;
  initialLimit?: number;
  autoMarkAsRead?: boolean;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  hasMore: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing messages in a conversation
 */
export function useMessages({
  conversationId,
  currentUserId,
  initialLimit = 50,
  autoMarkAsRead = true,
}: UseMessagesOptions): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const messagesRef = useRef<Message[]>([]);

  // Keep ref in sync with state for use in callbacks
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load initial messages and subscribe
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load initial messages
        const initialMessages = await getMessages(conversationId, {
          limit: initialLimit,
        });

        if (!mounted) return;

        setMessages(initialMessages);
        setHasMore(initialMessages.length === initialLimit);

        // Mark conversation as read
        if (autoMarkAsRead) {
          await markConversationAsRead(conversationId, currentUserId);
        }

        // Subscribe to new messages
        unsubscribe = subscribeToMessages(conversationId, (newMessage) => {
          if (!mounted) return;

          setMessages((prev) => {
            // Check for duplicates (by id or client_message_id)
            const exists = prev.some(
              (m) =>
                m.id === newMessage.id ||
                (m.client_message_id &&
                  m.client_message_id === newMessage.client_message_id)
            );

            if (exists) {
              // Update existing message (e.g., optimistic update)
              return prev.map((m) =>
                m.id === newMessage.id ||
                (m.client_message_id &&
                  m.client_message_id === newMessage.client_message_id)
                  ? newMessage
                  : m
              );
            }

            // Add new message
            return [...prev, newMessage];
          });

          // Mark as read if from other user
          if (autoMarkAsRead && newMessage.sender_id !== currentUserId) {
            markConversationAsRead(conversationId, currentUserId).catch(console.error);
          }
        });
      } catch (err) {
        if (!mounted) return;
        console.error('[useMessages] Error:', err);
        setError(err instanceof Error ? err : new Error('Failed to load messages'));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [conversationId, currentUserId, initialLimit, autoMarkAsRead]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !conversationId || !currentUserId) return;

      // Create optimistic message
      const clientMessageId = `${currentUserId}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const optimisticMessage: Message = {
        id: clientMessageId, // Temporary ID
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content.trim(),
        message_type: 'text',
        status: 'sending',
        created_at: new Date().toISOString(),
        client_message_id: clientMessageId,
      };

      // Add optimistic message
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        // Send the actual message
        await sendMessageFn(conversationId, currentUserId, content);
        // The subscription will handle updating/replacing the optimistic message
      } catch (err) {
        console.error('[useMessages] Send error:', err);
        // Update optimistic message to failed
        setMessages((prev) =>
          prev.map((m) =>
            m.client_message_id === clientMessageId
              ? { ...m, status: 'failed' as const }
              : m
          )
        );
        throw err;
      }
    },
    [conversationId, currentUserId]
  );

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loading || messages.length === 0) return;

    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    try {
      const olderMessages = await getMessages(conversationId, {
        limit: initialLimit,
        before: oldestMessage.created_at,
      });

      if (olderMessages.length === 0) {
        setHasMore(false);
        return;
      }

      setMessages((prev) => [...olderMessages, ...prev]);
      setHasMore(olderMessages.length === initialLimit);
    } catch (err) {
      console.error('[useMessages] Load more error:', err);
    }
  }, [conversationId, hasMore, loading, messages, initialLimit]);

  // Refresh messages
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const refreshedMessages = await getMessages(conversationId, {
        limit: initialLimit,
      });
      setMessages(refreshedMessages);
      setHasMore(refreshedMessages.length === initialLimit);
    } catch (err) {
      console.error('[useMessages] Refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, initialLimit]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    loadMoreMessages,
    hasMore,
    refresh,
  };
}

// ============================================
// useTypingIndicator Hook
// ============================================

interface UseTypingIndicatorOptions {
  conversationId: string;
  currentUserId: string;
  displayName: string;
}

interface UseTypingIndicatorReturn {
  typingUsers: TypingUser[];
  setTyping: (isTyping: boolean) => void;
  isAnyoneTyping: boolean;
  typingText: string;
}

/**
 * Hook for managing typing indicators
 */
export function useTypingIndicator({
  conversationId,
  currentUserId,
  displayName,
}: UseTypingIndicatorOptions): UseTypingIndicatorReturn {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const setTypingRef = useRef<((isTyping: boolean) => void) | null>(null);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const { setTyping, unsubscribe } = subscribeToTyping(
      conversationId,
      currentUserId,
      displayName,
      setTypingUsers
    );

    setTypingRef.current = setTyping;

    return () => {
      unsubscribe();
      setTypingRef.current = null;
    };
  }, [conversationId, currentUserId, displayName]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (setTypingRef.current) {
      setTypingRef.current(isTyping);
    }
  }, []);

  const isAnyoneTyping = typingUsers.length > 0;

  const typingText = (() => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) {
      return `${typingUsers[0].display_name || 'Someone'} is typing...`;
    }
    if (typingUsers.length === 2) {
      const names = typingUsers.map((u) => u.display_name || 'Someone');
      return `${names.join(' and ')} are typing...`;
    }
    return 'Several people are typing...';
  })();

  return {
    typingUsers,
    setTyping,
    isAnyoneTyping,
    typingText,
  };
}

// ============================================
// useChat Hook (Combined)
// ============================================

interface UseChatOptions {
  conversationId: string;
  currentUserId: string;
  displayName: string;
  initialLimit?: number;
  autoMarkAsRead?: boolean;
}

interface UseChatReturn extends UseMessagesReturn, UseTypingIndicatorReturn {}

/**
 * Combined hook for all chat functionality
 */
export function useChat({
  conversationId,
  currentUserId,
  displayName,
  initialLimit = 50,
  autoMarkAsRead = true,
}: UseChatOptions): UseChatReturn {
  const messagesHook = useMessages({
    conversationId,
    currentUserId,
    initialLimit,
    autoMarkAsRead,
  });

  const typingHook = useTypingIndicator({
    conversationId,
    currentUserId,
    displayName,
  });

  return {
    ...messagesHook,
    ...typingHook,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format messages for display in chat UI
 * (Compatible with existing Conversation component)
 */
export function formatMessagesForUI(
  messages: Message[]
): Array<{
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  isEdited: boolean;
  isDeleted: boolean;
}> {
  return messages.map(formatMessageForDisplay);
}
