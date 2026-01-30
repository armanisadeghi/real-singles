import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { ChatThread, Message } from "@/components/chat";
import { MessageSkeleton } from "@/components/ui/LoadingSkeleton";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

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
  const { data: participantRows } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId);

  const participantIds = (participantRows || [])
    .map((p) => p.user_id)
    .filter((id): id is string => id !== null);

  // Fetch user and profile data separately (FK join doesn't work for profiles)
  const { data: users } = await supabase
    .from("users")
    .select("id, display_name, last_active_at")
    .in("id", participantIds);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, profile_image_url")
    .in("user_id", participantIds);

  // Resolve profile image URLs and combine data
  const participantsWithUrls = await Promise.all(
    participantIds.map(async (participantId) => {
      const userData = users?.find((u) => u.id === participantId);
      const profileData = profiles?.find((p) => p.user_id === participantId);
      const resolvedUrl = profileData?.profile_image_url
        ? await resolveStorageUrl(supabase, profileData.profile_image_url)
        : null;
      return {
        user_id: participantId,
        user: userData ? { display_name: userData.display_name } : null,
        profile: profileData
          ? { first_name: profileData.first_name, profile_image_url: resolvedUrl }
          : null,
      };
    })
  );

  return {
    conversation: {
      id: conversation.id,
      type: (conversation.type || "direct") as "direct" | "group",
      name: conversation.group_name,
    },
    participants: participantsWithUrls,
    currentUserId: user.id,
  };
}

function ChatSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100dvh-var(--header-height,72px))]">
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
