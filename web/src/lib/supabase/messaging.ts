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
import type { Json } from "@/types/database.types";

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
  media_metadata?: Json | null;
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
  media_metadata?: Json;
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
  private subscribedChannels = new Set<string>();
  private messageHandlersAdded = new Set<string>(); // Track if message handlers were added

  constructor() {
    // Log initial auth state for debugging
    this.supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('[Messaging] Auth error on init:', error);
      } else if (data.session) {
        console.log('[Messaging] Authenticated user:', data.session.user.id);
      } else {
        console.warn('[Messaging] No active session on init');
      }
    });
  }

  /**
   * Get the Supabase client (single instance per service)
   */
  private getSupabase() {
    return this.supabase;
  }

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
      const client = this.getSupabase();
      client.removeChannel(channel);
      this.channels.delete(channelName);
      this.subscribedChannels.delete(channelName);
      this.messageHandlersAdded.delete(`msg:${conversationId}`);
      console.log(`[Messaging] Removed channel: ${channelName}`);
    }
  }

  /**
   * Remove all active channels (call on logout/cleanup)
   */
  removeAllChannels(): void {
    const client = this.getSupabase();
    this.channels.forEach((channel, name) => {
      client.removeChannel(channel);
      console.log(`[Messaging] Removed channel: ${name}`);
    });
    this.channels.clear();
    this.subscribedChannels.clear();
    this.messageHandlersAdded.clear();
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
      mediaMetadata?: Json;
      replyToId?: string;
      clientMessageId?: string; // Allow passing from hook for optimistic update matching
    }
  ): Promise<Message> {
    // Use provided client-side ID or generate one for deduplication
    const clientMessageId = options?.clientMessageId || 
      `${senderId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from("messages")
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error("[Messaging] Failed to send message:", error);
      throw error;
    }

    console.log(`[Messaging] Message sent successfully:`, data.id);

    // Broadcast the message to all channel subscribers for immediate delivery
    // This ensures real-time delivery even if postgres_changes RLS filtering fails
    const channelName = `conversation:${conversationId}`;
    const channel = this.channels.get(channelName);
    const isChannelSubscribed = this.subscribedChannels.has(channelName);
    
    if (channel && isChannelSubscribed) {
      try {
        const result = await channel.send({
          type: "broadcast",
          event: "new_message",
          payload: data as Message,
        });
        console.log(`[Messaging] 📡 Broadcast sent to ${channelName}, result:`, result);
      } catch (err) {
        console.error(`[Messaging] ⚠️ Broadcast failed for ${channelName}:`, err);
      }
    } else {
      console.warn(`[Messaging] ⚠️ Cannot broadcast - channel: ${!!channel}, subscribed: ${isChannelSubscribed}`);
      console.log(`[Messaging] Available channels:`, Array.from(this.channels.keys()));
      console.log(`[Messaging] Subscribed channels:`, Array.from(this.subscribedChannels));
    }

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
    const supabase = this.getSupabase();

    let query = supabase
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
    const updateData: {
      deleted_at: string;
      deleted_for_everyone: boolean;
      content?: string;
    } = {
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
    const channelName = `conversation:${conversationId}`;
    const channel = this.getOrCreateChannel(conversationId);
    
    // Check if message handlers were already added for this conversation
    const handlersKey = `msg:${conversationId}`;
    if (this.messageHandlersAdded.has(handlersKey)) {
      console.log(`[Messaging] Message handlers already added for ${channelName}, skipping`);
      return () => {
        this.messageHandlersAdded.delete(handlersKey);
        this.removeChannel(conversationId);
      };
    }
    
    console.log(`[Messaging] Setting up message subscription for ${channelName}`);
    this.messageHandlersAdded.add(handlersKey);

    // Subscribe to broadcast events (immediate delivery from sender)
    channel.on(
      "broadcast",
      { event: "new_message" },
      (payload) => {
        console.log(`[Messaging] 📨 Broadcast message received:`, payload.payload?.id);
        if (payload.payload) {
          onMessage(payload.payload as Message);
        }
      }
    );

    // Subscribe to postgres_changes for INSERT (for messages from other participants)
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log(`[Messaging] 📬 postgres_changes INSERT received:`, payload.new.id);
        onMessage(payload.new as Message);
      }
    );

    // Subscribe to updates (for edits and deletes)
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log(`[Messaging] ✏️ Message updated:`, payload.new.id);
        onMessage(payload.new as Message);
      }
    );

    // Subscribe if not already subscribed
    const isAlreadySubscribed = this.subscribedChannels.has(channelName);
    if (!isAlreadySubscribed) {
      channel.subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(`[Messaging] ✓ Successfully subscribed to ${channelName}`);
          this.subscribedChannels.add(channelName);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[Messaging] ✗ Channel error for ${channelName}:`, err);
          this.subscribedChannels.delete(channelName);
        } else if (status === "TIMED_OUT") {
          console.error(`[Messaging] ✗ Channel timed out for ${channelName}`);
          this.subscribedChannels.delete(channelName);
        } else if (status === "CLOSED") {
          console.log(`[Messaging] Channel closed for ${channelName}`);
          this.subscribedChannels.delete(channelName);
        } else {
          console.log(`[Messaging] Channel status: ${status} for ${channelName}`);
        }
      });
    } else {
      console.log(`[Messaging] Channel ${channelName} already subscribed, adding handlers only`);
    }

    // Return unsubscribe function
    return () => {
      this.messageHandlersAdded.delete(handlersKey);
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
    const channelName = `conversation:${conversationId}`;
    const channel = this.getOrCreateChannel(conversationId);
    let typingTimeout: ReturnType<typeof setTimeout> | null = null;

    console.log(`[Messaging] Setting up typing subscription for ${channelName}`);

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

    // Subscribe only if not already subscribed (channel might be shared with message subscription)
    const isAlreadySubscribed = this.subscribedChannels.has(channelName);
    if (!isAlreadySubscribed) {
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[Messaging] ✓ Typing channel subscribed: ${channelName}`);
          this.subscribedChannels.add(channelName);
          // Track own presence (initially not typing)
          await channel.track({
            user_id: currentUserId,
            display_name: displayName,
            is_typing: false,
            last_typed_at: Date.now(),
          });
        }
      });
    } else {
      // Channel already subscribed, just track presence
      console.log(`[Messaging] Channel ${channelName} already subscribed, tracking presence only`);
      channel.track({
        user_id: currentUserId,
        display_name: displayName,
        is_typing: false,
        last_typed_at: Date.now(),
      });
    }

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
    const supabase = this.getSupabase();
    const { error } = await supabase
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
      const conversationIds = myConversations
        .map((c) => c.conversation_id)
        .filter((id): id is string => id !== null);

      if (conversationIds.length === 0) {
        // No valid conversations found, will create new one below
      } else {
        // Check which of these have the other user
        const { data: sharedConversations } = await this.supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", otherUserId)
          .in("conversation_id", conversationIds);

        if (sharedConversations && sharedConversations.length > 0) {
          // Verify it's a direct conversation with exactly 2 participants
          for (const conv of sharedConversations) {
            if (!conv.conversation_id) continue;
            
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
