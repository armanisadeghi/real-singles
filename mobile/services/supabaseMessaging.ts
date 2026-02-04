/**
 * Supabase Messaging Service for React Native / Expo
 *
 * This service provides real-time messaging functionality using Supabase Realtime.
 * It replaces the previous Agora Chat implementation with a native Supabase solution.
 *
 * Features:
 * - Real-time message delivery via Supabase Realtime subscriptions
 * - Typing indicators using Supabase Presence
 * - Message history with pagination
 * - Read receipts
 * - Optimistic updates with client-side message IDs
 *
 * @see https://supabase.com/docs/guides/realtime
 */

import { supabase } from '@/lib/supabase';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system' | 'call' | 'profile';
  media_url?: string | null;
  media_thumbnail_url?: string | null;
  media_metadata?: Record<string, any> | null;
  metadata?: Record<string, any> | null; // For call/profile message data
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  reply_to_id?: string | null;
  deleted_at?: string | null;
  deleted_for_everyone?: boolean;
  created_at: string;
  edited_at?: string | null;
  client_message_id?: string | null;
}

export interface MessageInsert {
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system' | 'call' | 'profile';
  media_url?: string;
  media_thumbnail_url?: string;
  media_metadata?: Record<string, any>;
  metadata?: Record<string, any>; // For call/profile message structured data
  reply_to_id?: string;
  client_message_id?: string;
}

export interface TypingUser {
  user_id: string;
  display_name?: string;
  is_typing: boolean;
  last_typed_at: number;
}

export interface ConversationWithDetails {
  conversation_id: string;
  conversation_type: string;
  group_name: string | null;
  group_image_url: string | null;
  created_at: string;
  updated_at: string;
  last_message_content: string | null;
  last_message_sender_id: string | null;
  last_message_at: string | null;
  unread_count: number;
}

// Callback types
export type MessageCallback = (message: Message) => void;
export type MessagesCallback = (messages: Message[]) => void;
export type TypingCallback = (typingUsers: TypingUser[]) => void;

// ============================================
// CHANNEL MANAGEMENT
// ============================================

// Store active channels to prevent duplicates and enable cleanup
const activeChannels = new Map<string, RealtimeChannel>();

/**
 * Get or create a channel for a conversation
 */
function getOrCreateChannel(conversationId: string): RealtimeChannel {
  const channelName = `conversation:${conversationId}`;

  if (activeChannels.has(channelName)) {
    return activeChannels.get(channelName)!;
  }

  const channel = supabase.channel(channelName, {
    config: {
      presence: {
        key: conversationId,
      },
    },
  });

  activeChannels.set(channelName, channel);
  return channel;
}

/**
 * Remove and unsubscribe from a channel
 */
export function removeChannel(conversationId: string): void {
  const channelName = `conversation:${conversationId}`;
  const channel = activeChannels.get(channelName);

  if (channel) {
    supabase.removeChannel(channel);
    activeChannels.delete(channelName);
    console.log(`[Messaging] Removed channel: ${channelName}`);
  }
}

/**
 * Remove all active channels (call on logout/cleanup)
 */
export function removeAllChannels(): void {
  activeChannels.forEach((channel, name) => {
    supabase.removeChannel(channel);
    console.log(`[Messaging] Removed channel: ${name}`);
  });
  activeChannels.clear();
}

// ============================================
// MESSAGE OPERATIONS
// ============================================

/**
 * Send a text message to a conversation
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  options?: {
    messageType?: Message['message_type'];
    mediaUrl?: string;
    mediaThumbnailUrl?: string;
    mediaMetadata?: Record<string, any>;
    replyToId?: string;
  }
): Promise<Message> {
  // Generate a client-side ID for optimistic updates and deduplication
  const clientMessageId = `${senderId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const messageData: MessageInsert = {
    conversation_id: conversationId,
    sender_id: senderId,
    content: content.trim(),
    message_type: options?.messageType || 'text',
    media_url: options?.mediaUrl,
    media_thumbnail_url: options?.mediaThumbnailUrl,
    media_metadata: options?.mediaMetadata,
    reply_to_id: options?.replyToId,
    client_message_id: clientMessageId,
  };

  console.log(`[Messaging] Sending message to conversation ${conversationId}`);

  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single();

  if (error) {
    console.error('[Messaging] Failed to send message:', error);
    throw error;
  }

  console.log(`[Messaging] Message sent successfully:`, data.id);
  return data as Message;
}

/**
 * Get message history for a conversation with pagination
 */
export async function getMessages(
  conversationId: string,
  options?: {
    limit?: number;
    before?: string; // ISO timestamp for pagination
    after?: string; // ISO timestamp for pagination
  }
): Promise<Message[]> {
  const limit = options?.limit || 50;

  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options?.before) {
    query = query.lt('created_at', options.before);
  }

  if (options?.after) {
    query = query.gt('created_at', options.after);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Messaging] Failed to get messages:', error);
    throw error;
  }

  // Return in chronological order
  return (data as Message[]).reverse();
}

/**
 * Edit a message
 */
export async function editMessage(
  messageId: string,
  newContent: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .update({
      content: newContent.trim(),
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('[Messaging] Failed to edit message:', error);
    throw error;
  }

  return data as Message;
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(
  messageId: string,
  forEveryone: boolean = false
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_for_everyone: forEveryone,
      content: forEveryone ? '[Message deleted]' : undefined,
    })
    .eq('id', messageId);

  if (error) {
    console.error('[Messaging] Failed to delete message:', error);
    throw error;
  }
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to new messages in a conversation
 * Returns an unsubscribe function
 */
export function subscribeToMessages(
  conversationId: string,
  onMessage: MessageCallback
): () => void {
  const channel = getOrCreateChannel(conversationId);

  // Subscribe to postgres_changes for messages
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      console.log(`[Messaging] New message received:`, payload.new.id);
      onMessage(payload.new as Message);
    }
  );

  // Also subscribe to updates (for edits and deletes)
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      console.log(`[Messaging] Message updated:`, payload.new.id);
      onMessage(payload.new as Message);
    }
  );

  // Subscribe to the channel
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`[Messaging] Subscribed to conversation ${conversationId}`);
    } else if (status === 'CHANNEL_ERROR') {
      console.error(`[Messaging] Channel error for conversation ${conversationId}`);
    }
  });

  // Return unsubscribe function
  return () => {
    removeChannel(conversationId);
  };
}

/**
 * Subscribe to messages and get initial history
 * This is a convenience function that combines getMessages and subscribeToMessages
 */
export async function subscribeToConversation(
  conversationId: string,
  onMessagesLoaded: MessagesCallback,
  onNewMessage: MessageCallback,
  options?: {
    initialLimit?: number;
  }
): Promise<() => void> {
  // Load initial messages
  const messages = await getMessages(conversationId, {
    limit: options?.initialLimit || 50,
  });
  onMessagesLoaded(messages);

  // Subscribe to new messages
  const unsubscribe = subscribeToMessages(conversationId, onNewMessage);

  return unsubscribe;
}

// ============================================
// TYPING INDICATORS (Supabase Presence)
// ============================================

/**
 * Track typing status for a conversation
 * Returns functions to update typing status and unsubscribe
 */
export function subscribeToTyping(
  conversationId: string,
  currentUserId: string,
  displayName: string,
  onTypingUpdate: TypingCallback
): {
  setTyping: (isTyping: boolean) => void;
  unsubscribe: () => void;
} {
  const channel = getOrCreateChannel(conversationId);
  let typingTimeout: ReturnType<typeof setTimeout> | null = null;

  // Track presence for typing
  channel.on('presence', { event: 'sync' }, () => {
    const presenceState = channel.presenceState() as RealtimePresenceState<TypingUser>;
    const typingUsers: TypingUser[] = [];

    // Extract typing users from presence state
    Object.values(presenceState).forEach((presences) => {
      presences.forEach((presence: any) => {
        if (presence.is_typing && presence.user_id !== currentUserId) {
          // Only show typing if it was recent (within 5 seconds)
          const isRecent = Date.now() - presence.last_typed_at < 5000;
          if (isRecent) {
            typingUsers.push({
              user_id: presence.user_id,
              display_name: presence.display_name,
              is_typing: true,
              last_typed_at: presence.last_typed_at,
            });
          }
        }
      });
    });

    onTypingUpdate(typingUsers);
  });

  // Subscribe to the channel
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      // Track own presence (initially not typing)
      await channel.track({
        user_id: currentUserId,
        display_name: displayName,
        is_typing: false,
        last_typed_at: Date.now(),
      });
    }
  });

  // Function to update typing status
  const setTyping = async (isTyping: boolean) => {
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      typingTimeout = null;
    }

    // Update presence
    await channel.track({
      user_id: currentUserId,
      display_name: displayName,
      is_typing: isTyping,
      last_typed_at: Date.now(),
    });

    // Auto-stop typing after 3 seconds of no input
    if (isTyping) {
      typingTimeout = setTimeout(() => {
        channel.track({
          user_id: currentUserId,
          display_name: displayName,
          is_typing: false,
          last_typed_at: Date.now(),
        });
      }, 3000);
    }
  };

  // Return controls
  return {
    setTyping,
    unsubscribe: () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      // Don't remove channel here - it might be used for messages too
      // Just update presence to not typing
      channel.track({
        user_id: currentUserId,
        display_name: displayName,
        is_typing: false,
        last_typed_at: Date.now(),
      });
    },
  };
}

// ============================================
// READ RECEIPTS
// ============================================

/**
 * Mark messages as read in a conversation
 * Updates the last_read_at in conversation_participants
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) {
    console.error('[Messaging] Failed to mark conversation as read:', error);
    throw error;
  }
}

/**
 * Mark a specific message as read
 */
export async function markMessageAsRead(
  messageId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('message_read_receipts')
    .upsert({
      message_id: messageId,
      user_id: userId,
      read_at: new Date().toISOString(),
    }, {
      onConflict: 'message_id,user_id',
    });

  if (error) {
    console.error('[Messaging] Failed to mark message as read:', error);
    throw error;
  }
}

// ============================================
// CONVERSATION OPERATIONS
// ============================================

/**
 * Get or create a direct conversation with another user
 */
export async function getOrCreateDirectConversation(
  currentUserId: string,
  otherUserId: string
): Promise<string> {
  // First, check if a direct conversation already exists
  const { data: existingConversation, error: fetchError } = await supabase
    .from('conversations')
    .select(`
      id,
      conversation_participants!inner (user_id)
    `)
    .eq('type', 'direct')
    .contains('conversation_participants.user_id', [currentUserId, otherUserId]);

  if (fetchError) {
    console.error('[Messaging] Error checking existing conversation:', fetchError);
    // Continue to create a new one
  }

  // Check if we found an existing conversation with both users
  if (existingConversation && existingConversation.length > 0) {
    // Verify it has exactly both participants
    for (const conv of existingConversation) {
      const participants = (conv as any).conversation_participants;
      if (participants && participants.length === 2) {
        const participantIds = participants.map((p: any) => p.user_id);
        if (participantIds.includes(currentUserId) && participantIds.includes(otherUserId)) {
          console.log(`[Messaging] Found existing conversation: ${conv.id}`);
          return conv.id;
        }
      }
    }
  }

  // Create new conversation
  const { data: newConversation, error: createError } = await supabase
    .from('conversations')
    .insert({
      type: 'direct',
      created_by: currentUserId,
    })
    .select()
    .single();

  if (createError) {
    console.error('[Messaging] Failed to create conversation:', createError);
    throw createError;
  }

  // Add participants
  const { error: participantError } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: newConversation.id, user_id: currentUserId, role: 'member' },
      { conversation_id: newConversation.id, user_id: otherUserId, role: 'member' },
    ]);

  if (participantError) {
    console.error('[Messaging] Failed to add participants:', participantError);
    // Cleanup the conversation
    await supabase.from('conversations').delete().eq('id', newConversation.id);
    throw participantError;
  }

  console.log(`[Messaging] Created new conversation: ${newConversation.id}`);
  return newConversation.id;
}

/**
 * Get all conversations for a user with last message and unread count
 */
export async function getConversationsWithDetails(
  userId: string
): Promise<ConversationWithDetails[]> {
  const { data, error } = await supabase
    .rpc('get_conversations_with_details', { p_user_id: userId });

  if (error) {
    console.error('[Messaging] Failed to get conversations:', error);
    throw error;
  }

  return data as ConversationWithDetails[];
}

/**
 * Get unread message count for a conversation
 */
export async function getUnreadCount(
  conversationId: string,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_unread_count', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    });

  if (error) {
    console.error('[Messaging] Failed to get unread count:', error);
    return 0;
  }

  return data || 0;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format a message for display
 */
export function formatMessageForDisplay(message: Message): {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  isEdited: boolean;
  isDeleted: boolean;
} {
  return {
    id: message.id,
    senderId: message.sender_id,
    content: message.deleted_for_everyone ? '[Message deleted]' : message.content,
    timestamp: new Date(message.created_at).getTime(),
    isEdited: !!message.edited_at,
    isDeleted: !!message.deleted_at,
  };
}

/**
 * Check if a user is a participant in a conversation
 */
export async function isConversationParticipant(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();

  if (error) {
    return false;
  }

  return !!data;
}
