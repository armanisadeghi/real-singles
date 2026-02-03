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
    <div className="fixed top-0 left-0 w-screen h-screen flex flex-col bg-white dark:bg-neutral-950 overflow-hidden">
      {/* iOS-style Header skeleton */}
      <div className="shrink-0 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl pt-[env(safe-area-inset-top)] border-b border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-3 px-2 py-2 h-[52px]">
          {/* Back chevron skeleton */}
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 animate-pulse" />
          {/* Avatar skeleton */}
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700 animate-pulse" />
          {/* Name skeleton */}
          <div className="flex-1">
            <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
          </div>
          {/* Action buttons skeleton */}
          <div className="flex">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 w-full overflow-y-auto scrollbar-thin">
        <div className="pl-4 pr-1 py-3 pb-24 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <MessageSkeleton key={i} isOwn={i % 2 === 0} />
          ))}
        </div>
      </div>

      {/* Floating Input skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2">
          <div className="flex items-center gap-2 h-10">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 animate-pulse" />
            <div className="flex-1 h-10 bg-gray-100 dark:bg-neutral-800 rounded-[20px] animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 animate-pulse" />
          </div>
        </div>
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
