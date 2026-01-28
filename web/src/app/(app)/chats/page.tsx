import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ConversationList, Conversation } from "@/components/chat";
import { ConversationSkeleton } from "@/components/ui/LoadingSkeleton";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

async function getConversations(): Promise<{
  conversations: Conversation[];
  userId: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get conversations where user is a participant
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  if (!participations || participations.length === 0) {
    return { conversations: [], userId: user.id };
  }

  const conversationIds = participations.map((p) => p.conversation_id).filter((id): id is string => id !== null);

  // Get full conversation data
  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      `
      id,
      type,
      group_name,
      created_at,
      updated_at
    `
    )
    .in("id", conversationIds)
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (!conversations) {
    return { conversations: [], userId: user.id };
  }

  // Get participants for each conversation with full data
  const conversationsWithParticipants: Conversation[] = await Promise.all(
    conversations.map(async (conv) => {
      // Get participants with their last_read_at timestamp
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select(
          `
          user_id,
          last_read_at,
          user:user_id(display_name),
          profile:user_id(first_name, profile_image_url)
        `
        )
        .eq("conversation_id", conv.id);

      // Find current user's last_read_at
      const currentParticipant = participants?.find((p) => p.user_id === user.id);
      const lastReadAt = currentParticipant?.last_read_at || null;

      // Get unread count: messages created after last_read_at by other users
      let unreadCount = 0;
      if (lastReadAt) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", user.id)
          .gt("created_at", lastReadAt);
        unreadCount = count || 0;
      } else {
        // If never read, count all messages from others
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", user.id);
        unreadCount = count || 0;
      }

      // Get last message for preview
      const { data: lastMessages } = await supabase
        .from("messages")
        .select("id, content, message_type, created_at, sender_id")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastMessage = lastMessages?.[0] || null;
      let lastMessagePreview: string | null = null;
      
      if (lastMessage) {
        // Format message preview based on type
        if (lastMessage.message_type === "text" && lastMessage.content) {
          // Truncate long messages
          lastMessagePreview = lastMessage.content.length > 50 
            ? lastMessage.content.substring(0, 50) + "..." 
            : lastMessage.content;
        } else if (lastMessage.message_type === "image") {
          lastMessagePreview = "📷 Photo";
        } else if (lastMessage.message_type === "video") {
          lastMessagePreview = "🎥 Video";
        } else if (lastMessage.message_type === "audio") {
          lastMessagePreview = "🎵 Audio";
        } else if (lastMessage.message_type === "file") {
          lastMessagePreview = "📎 File";
        }
      }

      // Resolve profile image URLs for participants
      const participantsWithUrls = await Promise.all(
        (participants || [])
          .filter((p) => p.user_id !== null)
          .map(async (p) => {
            const profile = p.profile as { first_name?: string | null; profile_image_url?: string | null } | null;
            const resolvedUrl = profile?.profile_image_url
              ? await resolveStorageUrl(supabase, profile.profile_image_url)
              : null;
            return {
              user_id: p.user_id!,
              user: p.user as { display_name?: string | null } | null,
              profile: profile
                ? { ...profile, profile_image_url: resolvedUrl }
                : null,
            };
          })
      );

      return {
        id: conv.id,
        type: (conv.type || "direct") as "direct" | "group",
        name: conv.group_name || null,
        last_message: lastMessagePreview,
        last_message_at: lastMessage?.created_at || conv.updated_at,
        unread_count: unreadCount,
        participants: participantsWithUrls,
      };
    })
  );

  return { conversations: conversationsWithParticipants, userId: user.id };
}

function ConversationListSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <ConversationSkeleton key={i} />
      ))}
    </div>
  );
}

async function ConversationsContent() {
  const { conversations, userId } = await getConversations();

  return (
    <ConversationList
      conversations={conversations}
      currentUserId={userId}
    />
  );
}

export default function ChatsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="py-4 border-b bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
      </div>

      {/* Conversation List */}
      <div className="bg-white min-h-[calc(100dvh-var(--header-height)-80px)]">
        <Suspense fallback={<ConversationListSkeleton />}>
          <ConversationsContent />
        </Suspense>
      </div>
    </div>
  );
}
