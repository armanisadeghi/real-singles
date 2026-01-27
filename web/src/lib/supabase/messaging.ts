/**
 * Supabase Messaging Service for Next.js Web
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

import { createClient } from "./client";
import type { RealtimeChannel, RealtimePresenceState } from "@supabase/supabase-js";

// ============================================
// TYPES
// ============================================

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "video" | "audio" | "file" | "system";
  media_url?: string | null;
  media_thumbnail_url?: string | null;
  media_metadata?: Record<string, unknown> | null;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
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
  message_type?: Message["message_type"];
  media_url?: string;
  media_thumbnail_url?: string;
  media_metadata?: Record<string, unknown>;
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
// MESSAGING SERVICE CLASS
// ============================================

/**
 * MessagingService class provides real-time messaging functionality
 * Each instance manages channels for a specific conversation
 */
export class MessagingService {
  private supabase = createClient();
  private channels = new Map<string, RealtimeChannel>();

  /**
   * Get or create a channel for a conversation
   */
  private getOrCreateChannel(conversationId: string): RealtimeChannel {
    const channelName = `conversation:${conversationId}`;

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.supabase.channel(channelName, {
      config: {
        presence: {
          key: conversationId,
        },
      },
    });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Remove and unsubscribe from a channel
   */
  removeChannel(conversationId: string): void {
    const channelName = `conversation:${conversationId}`;
    const channel = this.channels.get(channelName);

    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`[Messaging] Removed channel: ${channelName}`);
    }
  }

  /**
   * Remove all active channels (call on logout/cleanup)
   */
  removeAllChannels(): void {
    this.channels.forEach((channel, name) => {
      this.supabase.removeChannel(channel);
      console.log(`[Messaging] Removed channel: ${name}`);
    });
    this.channels.clear();
  }

  // ============================================
  // MESSAGE OPERATIONS
  // ============================================

  /**
   * Send a text message to a conversation
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    options?: {
      messageType?: Message["message_type"];
      mediaUrl?: string;
      mediaThumbnailUrl?: string;
      mediaMetadata?: Record<string, unknown>;
      replyToId?: string;
    }
  ): Promise<Message> {
    // Generate a client-side ID for optimistic updates and deduplication
    const clientMessageId = `${senderId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const messageData: MessageInsert = {
      conversation_id: conversationId,
      sender_id: senderId,
      content: content.trim(),
      message_type: options?.messageType || "text",
      media_url: options?.mediaUrl,
      media_thumbnail_url: options?.mediaThumbnailUrl,
      media_metadata: options?.mediaMetadata,
      reply_to_id: options?.replyToId,
      client_message_id: clientMessageId,
    };

    console.log(`[Messaging] Sending message to conversation ${conversationId}`);

    const { data, error } = await this.supabase
      .from("messages")
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error("[Messaging] Failed to send message:", error);
      throw error;
    }

    console.log(`[Messaging] Message sent successfully:`, data.id);
    return data as Message;
  }

  /**
   * Get message history for a conversation with pagination
   */
  async getMessages(
    conversationId: string,
    options?: {
      limit?: number;
      before?: string; // ISO timestamp for pagination
      after?: string; // ISO timestamp for pagination
    }
  ): Promise<Message[]> {
    const limit = options?.limit || 50;

    let query = this.supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (options?.before) {
      query = query.lt("created_at", options.before);
    }

    if (options?.after) {
      query = query.gt("created_at", options.after);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Messaging] Failed to get messages:", error);
      throw error;
    }

    // Return in chronological order
    return (data as Message[]).reverse();
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, newContent: string): Promise<Message> {
    const { data, error } = await this.supabase
      .from("messages")
      .update({
        content: newContent.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .select()
      .single();

    if (error) {
      console.error("[Messaging] Failed to edit message:", error);
      throw error;
    }

    return data as Message;
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string, forEveryone: boolean = false): Promise<void> {
    const updateData: Partial<Message> = {
      deleted_at: new Date().toISOString(),
      deleted_for_everyone: forEveryone,
    };

    if (forEveryone) {
      updateData.content = "[Message deleted]";
    }

    const { error } = await this.supabase
      .from("messages")
      .update(updateData)
      .eq("id", messageId);

    if (error) {
      console.error("[Messaging] Failed to delete message:", error);
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
  subscribeToMessages(conversationId: string, onMessage: MessageCallback): () => void {
    const channel = this.getOrCreateChannel(conversationId);

    // Subscribe to postgres_changes for messages
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log(`[Messaging] New message received:`, payload.new.id);
        onMessage(payload.new as Message);
      }
    );

    // Also subscribe to updates (for edits and deletes)
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log(`[Messaging] Message updated:`, payload.new.id);
        onMessage(payload.new as Message);
      }
    );

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`[Messaging] Subscribed to conversation ${conversationId}`);
      } else if (status === "CHANNEL_ERROR") {
        console.error(`[Messaging] Channel error for conversation ${conversationId}`);
      }
    });

    // Return unsubscribe function
    return () => {
      this.removeChannel(conversationId);
    };
  }

  // ============================================
  // TYPING INDICATORS (Supabase Presence)
  // ============================================

  /**
   * Track typing status for a conversation
   * Returns functions to update typing status and unsubscribe
   */
  subscribeToTyping(
    conversationId: string,
    currentUserId: string,
    displayName: string,
    onTypingUpdate: TypingCallback
  ): {
    setTyping: (isTyping: boolean) => void;
    unsubscribe: () => void;
  } {
    const channel = this.getOrCreateChannel(conversationId);
    let typingTimeout: ReturnType<typeof setTimeout> | null = null;

    // Track presence for typing
    channel.on("presence", { event: "sync" }, () => {
      const presenceState = channel.presenceState() as RealtimePresenceState<TypingUser>;
      const typingUsers: TypingUser[] = [];

      // Extract typing users from presence state
      Object.values(presenceState).forEach((presences) => {
        presences.forEach((presence: TypingUser) => {
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
      if (status === "SUBSCRIBED") {
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
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    if (error) {
      console.error("[Messaging] Failed to mark conversation as read:", error);
      throw error;
    }
  }

  /**
   * Mark a specific message as read
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.from("message_read_receipts").upsert(
      {
        message_id: messageId,
        user_id: userId,
        read_at: new Date().toISOString(),
      },
      {
        onConflict: "message_id,user_id",
      }
    );

    if (error) {
      console.error("[Messaging] Failed to mark message as read:", error);
      throw error;
    }
  }

  // ============================================
  // CONVERSATION OPERATIONS
  // ============================================

  /**
   * Get or create a direct conversation with another user
   */
  async getOrCreateDirectConversation(
    currentUserId: string,
    otherUserId: string
  ): Promise<string> {
    // First, check if a direct conversation already exists by querying participants
    const { data: myConversations } = await this.supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", currentUserId);

    if (myConversations && myConversations.length > 0) {
      const conversationIds = myConversations.map((c) => c.conversation_id);

      // Check which of these have the other user
      const { data: sharedConversations } = await this.supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", otherUserId)
        .in("conversation_id", conversationIds);

      if (sharedConversations && sharedConversations.length > 0) {
        // Verify it's a direct conversation with exactly 2 participants
        for (const conv of sharedConversations) {
          const { data: conversation } = await this.supabase
            .from("conversations")
            .select("id, type")
            .eq("id", conv.conversation_id)
            .eq("type", "direct")
            .single();

          if (conversation) {
            console.log(`[Messaging] Found existing conversation: ${conversation.id}`);
            return conversation.id;
          }
        }
      }
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await this.supabase
      .from("conversations")
      .insert({
        type: "direct",
        created_by: currentUserId,
      })
      .select()
      .single();

    if (createError) {
      console.error("[Messaging] Failed to create conversation:", createError);
      throw createError;
    }

    // Add participants
    const { error: participantError } = await this.supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: newConversation.id, user_id: currentUserId, role: "member" },
        { conversation_id: newConversation.id, user_id: otherUserId, role: "member" },
      ]);

    if (participantError) {
      console.error("[Messaging] Failed to add participants:", participantError);
      // Cleanup the conversation
      await this.supabase.from("conversations").delete().eq("id", newConversation.id);
      throw participantError;
    }

    console.log(`[Messaging] Created new conversation: ${newConversation.id}`);
    return newConversation.id;
  }

  /**
   * Get all conversations for a user with last message and unread count
   */
  async getConversationsWithDetails(userId: string): Promise<ConversationWithDetails[]> {
    const { data, error } = await this.supabase.rpc("get_conversations_with_details", {
      p_user_id: userId,
    });

    if (error) {
      console.error("[Messaging] Failed to get conversations:", error);
      throw error;
    }

    return data as ConversationWithDetails[];
  }

  /**
   * Get unread message count for a conversation
   */
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc("get_unread_count", {
      p_conversation_id: conversationId,
      p_user_id: userId,
    });

    if (error) {
      console.error("[Messaging] Failed to get unread count:", error);
      return 0;
    }

    return data || 0;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let messagingServiceInstance: MessagingService | null = null;

/**
 * Get the singleton messaging service instance
 */
export function getMessagingService(): MessagingService {
  if (!messagingServiceInstance) {
    messagingServiceInstance = new MessagingService();
  }
  return messagingServiceInstance;
}

/**
 * Reset the messaging service (useful for logout)
 */
export function resetMessagingService(): void {
  if (messagingServiceInstance) {
    messagingServiceInstance.removeAllChannels();
    messagingServiceInstance = null;
  }
}
