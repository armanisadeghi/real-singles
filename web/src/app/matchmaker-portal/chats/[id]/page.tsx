import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { ChatThread } from "@/components/chat";
import { MessageSkeleton } from "@/components/ui/LoadingSkeleton";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

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

  // Verify user is an approved matchmaker
  const { data: matchmaker } = await supabase
    .from("matchmakers")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!matchmaker || matchmaker.status !== "approved") {
    redirect("/matchmaker-portal");
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

  // Fetch user and profile data
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
    <div className="flex flex-col h-[calc(100vh-120px)] bg-card rounded-xl border border-border/40 overflow-hidden">
      {/* Header skeleton */}
      <div className="shrink-0 px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse mt-1" />
          </div>
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <MessageSkeleton key={i} isOwn={i % 2 === 0} />
        ))}
      </div>

      {/* Input skeleton */}
      <div className="shrink-0 p-4 border-t border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 bg-muted rounded-full animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}

async function ChatContent({ conversationId }: { conversationId: string }) {
  const { conversation, participants, currentUserId } =
    await getConversation(conversationId);

  // Find the other participant for display
  const otherParticipant = participants.find((p) => p.user_id !== currentUserId);
  const displayName =
    otherParticipant?.profile?.first_name ||
    otherParticipant?.user?.display_name ||
    "Client";

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href="/matchmaker-portal/clients"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      {/* Chat container */}
      <div className="bg-card rounded-xl border border-border/40 overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
        <ChatThread
          conversationId={conversation.id}
          conversationType={conversation.type}
          conversationName={conversation.name || displayName}
          participants={participants}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}

export default async function MatchmakerChatPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatContent conversationId={id} />
    </Suspense>
  );
}
