import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { ChatThread, Message } from "@/components/chat";
import { MessageSkeleton } from "@/components/ui/LoadingSkeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getConversation(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is a participant
  const { data: participation } = await supabase
    .from("conversation_participants")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!participation) {
    notFound();
  }

  // Get conversation details
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    notFound();
  }

  // Get all participants
  const { data: participants } = await supabase
    .from("conversation_participants")
    .select(
      `
      user_id,
      user:user_id(display_name),
      profile:user_id(first_name, profile_image_url)
    `
    )
    .eq("conversation_id", conversationId);

  // For now, we'll load messages client-side via the ChatThread component
  // In production, you might want to use Agora Chat SDK or real-time subscriptions

  return {
    conversation: {
      id: conversation.id,
      type: (conversation.type || "direct") as "direct" | "group",
      name: conversation.group_name,
    },
    participants: (participants || [])
      .filter((p) => p.user_id !== null)
      .map((p) => ({
        user_id: p.user_id!,
        user: p.user as { display_name?: string | null } | null,
        profile: p.profile as {
          first_name?: string | null;
          profile_image_url?: string | null;
        } | null,
      })),
    currentUserId: user.id,
  };
}

function ChatSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header skeleton */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 p-4 space-y-4 bg-gray-50">
        {Array.from({ length: 5 }).map((_, i) => (
          <MessageSkeleton key={i} isOwn={i % 2 === 0} />
        ))}
      </div>

      {/* Input skeleton */}
      <div className="bg-white border-t p-3">
        <div className="h-11 bg-gray-100 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

async function ChatContent({ conversationId }: { conversationId: string }) {
  const { conversation, participants, currentUserId } =
    await getConversation(conversationId);

  return (
    <ChatThread
      conversationId={conversation.id}
      conversationType={conversation.type}
      conversationName={conversation.name}
      participants={participants}
      currentUserId={currentUserId}
    />
  );
}

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatContent conversationId={id} />
    </Suspense>
  );
}
