import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ConversationList, Conversation } from "@/components/chat";
import { ConversationSkeleton } from "@/components/ui/LoadingSkeleton";

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

  const conversationIds = participations.map((p) => p.conversation_id);

  // Get full conversation data
  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      `
      id,
      type,
      name,
      last_message,
      last_message_at,
      created_at
    `
    )
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (!conversations) {
    return { conversations: [], userId: user.id };
  }

  // Get participants for each conversation
  const conversationsWithParticipants: Conversation[] = await Promise.all(
    conversations.map(async (conv) => {
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select(
          `
          user_id,
          user:user_id(display_name),
          profile:user_id(first_name, profile_image_url)
        `
        )
        .eq("conversation_id", conv.id);

      // Get unread count (simplified - would need proper message tracking)
      const unreadCount = 0; // TODO: Implement proper unread tracking

      return {
        id: conv.id,
        type: conv.type as "direct" | "group",
        name: conv.name,
        last_message: conv.last_message,
        last_message_at: conv.last_message_at,
        unread_count: unreadCount,
        participants: (participants || []).map((p) => ({
          user_id: p.user_id,
          user: p.user as { display_name?: string | null } | null,
          profile: p.profile as {
            first_name?: string | null;
            profile_image_url?: string | null;
          } | null,
        })),
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
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-4 py-4 border-b bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
      </div>

      {/* Conversation List */}
      <div className="bg-white min-h-[calc(100vh-200px)]">
        <Suspense fallback={<ConversationListSkeleton />}>
          <ConversationsContent />
        </Suspense>
      </div>
    </div>
  );
}
