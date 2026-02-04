import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Verify the current user is an admin
async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
  const supabase = await createApiClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    isAdmin: userData?.role === "admin" || userData?.role === "moderator",
    userId: user.id,
  };
}

export interface MatchIntegrityIssue {
  id: string;
  issueType: "duplicate_match" | "duplicate_conversation" | "orphaned_conversation";
  severity: "critical" | "warning" | "info";
  user1Id: string;
  user1Email?: string;
  user1Name?: string;
  user2Id: string;
  user2Email?: string;
  user2Name?: string;
  description: string;
  details: {
    matchIds?: string[];
    conversationIds?: string[];
    actionCounts?: Record<string, number>;
    createdDates?: string[];
  };
  autoFixable: boolean;
}

export interface MatchIntegrityResult {
  checkedAt: string;
  totalMatches: number;
  totalConversations: number;
  summary: {
    critical: number;
    warning: number;
    info: number;
    byType: {
      duplicate_match: number;
      duplicate_conversation: number;
      orphaned_conversation: number;
    };
  };
  issues: MatchIntegrityIssue[];
}

/**
 * GET /api/admin/data-integrity/matches
 *
 * Check for matching integrity issues:
 * - Duplicate matches (same user pair with multiple records)
 * - Duplicate conversations (same user pair with multiple direct conversations)
 * - Orphaned conversations (conversations without valid participants)
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const issues: MatchIntegrityIssue[] = [];

    // 1. Find duplicate matches (same user_id + target_user_id pairs with multiple records)
    // Query all matches and group to find duplicates
    const { data: rawMatches } = await supabase
      .from("matches")
      .select("user_id, target_user_id, id, action, created_at, is_unmatched")
      .order("user_id")
      .order("target_user_id")
      .order("created_at", { ascending: false });

    // Group and find duplicates
    interface MatchRecord {
      user_id: string;
      target_user_id: string;
      id: string;
      action: string | null;
      created_at: string | null;
      is_unmatched: boolean | null;
    }
    
    const matchGroups = new Map<string, MatchRecord[]>();
    rawMatches?.forEach((match) => {
      const key = `${match.user_id}-${match.target_user_id}`;
      if (!matchGroups.has(key)) {
        matchGroups.set(key, []);
      }
      matchGroups.get(key)!.push(match as MatchRecord);
    });

    interface DuplicateMatchData {
      user_id: string;
      target_user_id: string;
      match_count: number;
      match_ids: string[];
      actions: (string | null)[];
      created_dates: (string | null)[];
    }

    const duplicateMatchData: DuplicateMatchData[] = [];
    matchGroups.forEach((matches, key) => {
      if (matches.length > 1) {
        const [user_id, target_user_id] = key.split("-");
        duplicateMatchData.push({
          user_id,
          target_user_id,
          match_count: matches.length,
          match_ids: matches.map((m) => m.id),
          actions: matches.map((m) => m.action),
          created_dates: matches.map((m) => m.created_at),
        });
      }
    });

    // Get user info for duplicate matches
    if (duplicateMatchData.length > 0) {
      const userIds = new Set<string>();
      duplicateMatchData.forEach((d) => {
        userIds.add(d.user_id);
        userIds.add(d.target_user_id);
      });

      const { data: users } = await supabase
        .from("users")
        .select("id, email")
        .in("id", Array.from(userIds));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", Array.from(userIds));

      const userMap = new Map(users?.map((u) => [u.id, u]) || []);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      duplicateMatchData.forEach((dup, idx) => {
        const user1 = userMap.get(dup.user_id);
        const user2 = userMap.get(dup.target_user_id);
        const profile1 = profileMap.get(dup.user_id);
        const profile2 = profileMap.get(dup.target_user_id);

        issues.push({
          id: `dup-match-${idx}`,
          issueType: "duplicate_match",
          severity: "critical",
          user1Id: dup.user_id,
          user1Email: user1?.email,
          user1Name: profile1
            ? `${profile1.first_name || ""} ${profile1.last_name || ""}`.trim()
            : undefined,
          user2Id: dup.target_user_id,
          user2Email: user2?.email,
          user2Name: profile2
            ? `${profile2.first_name || ""} ${profile2.last_name || ""}`.trim()
            : undefined,
          description: `${dup.match_count} duplicate match records between users`,
          details: {
            matchIds: dup.match_ids,
            actionCounts: dup.actions.reduce(
              (acc: Record<string, number>, a) => {
                if (a) {
                  acc[a] = (acc[a] || 0) + 1;
                }
                return acc;
              },
              {}
            ),
            createdDates: dup.created_dates.filter((d): d is string => d !== null),
          },
          autoFixable: true,
        });
      });
    }

    // 2. Find duplicate direct conversations between same user pairs
    const { data: allConvos } = await supabase
      .from("conversations")
      .select(`
        id,
        type,
        created_at,
        conversation_participants (
          user_id
        )
      `)
      .eq("type", "direct");

    // Group direct conversations by participant pair
    const convoGroups = new Map<string, any[]>();
    allConvos?.forEach((convo) => {
      const participants = convo.conversation_participants?.map(
        (p: any) => p.user_id
      );
      if (participants?.length === 2) {
        const key = participants.sort().join("-");
        if (!convoGroups.has(key)) {
          convoGroups.set(key, []);
        }
        convoGroups.get(key)!.push(convo);
      }
    });

    // Find duplicates
    const duplicateConvos: { userIds: string[]; conversations: any[] }[] = [];
    convoGroups.forEach((convos, key) => {
      if (convos.length > 1) {
        duplicateConvos.push({
          userIds: key.split("-"),
          conversations: convos,
        });
      }
    });

    if (duplicateConvos.length > 0) {
      const userIds = new Set<string>();
      duplicateConvos.forEach((d) => {
        d.userIds.forEach((id) => userIds.add(id));
      });

      const { data: users } = await supabase
        .from("users")
        .select("id, email")
        .in("id", Array.from(userIds));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", Array.from(userIds));

      const userMap = new Map(users?.map((u) => [u.id, u]) || []);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      duplicateConvos.forEach((dup, idx) => {
        const user1Id = dup.userIds[0] ?? "unknown";
        const user2Id = dup.userIds[1] ?? "unknown";
        const user1 = userMap.get(user1Id);
        const user2 = userMap.get(user2Id);
        const profile1 = profileMap.get(user1Id);
        const profile2 = profileMap.get(user2Id);

        issues.push({
          id: `dup-convo-${idx}`,
          issueType: "duplicate_conversation",
          severity: "warning",
          user1Id,
          user1Email: user1?.email,
          user1Name: profile1
            ? `${profile1.first_name || ""} ${profile1.last_name || ""}`.trim()
            : undefined,
          user2Id,
          user2Email: user2?.email,
          user2Name: profile2
            ? `${profile2.first_name || ""} ${profile2.last_name || ""}`.trim()
            : undefined,
          description: `${dup.conversations.length} duplicate direct conversations between users`,
          details: {
            conversationIds: dup.conversations.map((c) => c.id),
            createdDates: dup.conversations.map((c) => c.created_at),
          },
          autoFixable: true,
        });
      });
    }

    // 3. Check for orphaned conversations (no participants or invalid participants)
    const { data: orphanedConvos } = await supabase
      .from("conversations")
      .select(`
        id,
        type,
        created_at,
        conversation_participants (
          user_id
        )
      `)
      .eq("type", "direct");

    orphanedConvos?.forEach((convo, idx) => {
      const participantCount = convo.conversation_participants?.length || 0;
      if (participantCount < 2) {
        issues.push({
          id: `orphan-convo-${idx}`,
          issueType: "orphaned_conversation",
          severity: "info",
          user1Id: convo.conversation_participants?.[0]?.user_id || "unknown",
          user2Id: "missing",
          description: `Conversation ${convo.id.substring(0, 8)}... has only ${participantCount} participant(s)`,
          details: {
            conversationIds: [convo.id],
            createdDates: convo.created_at ? [convo.created_at] : [],
          },
          autoFixable: true,
        });
      }
    });

    // Count totals
    const { count: totalMatches } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true });

    const { count: totalConversations } = await supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("type", "direct");

    // Build summary
    const summary = {
      critical: issues.filter((i) => i.severity === "critical").length,
      warning: issues.filter((i) => i.severity === "warning").length,
      info: issues.filter((i) => i.severity === "info").length,
      byType: {
        duplicate_match: issues.filter((i) => i.issueType === "duplicate_match")
          .length,
        duplicate_conversation: issues.filter(
          (i) => i.issueType === "duplicate_conversation"
        ).length,
        orphaned_conversation: issues.filter(
          (i) => i.issueType === "orphaned_conversation"
        ).length,
      },
    };

    const result: MatchIntegrityResult = {
      checkedAt: new Date().toISOString(),
      totalMatches: totalMatches || 0,
      totalConversations: totalConversations || 0,
      summary,
      issues,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Match integrity check failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to run match integrity check",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/data-integrity/matches
 *
 * Fix matching issues. Body:
 * - action: "fix_duplicate_matches" | "fix_duplicate_conversations" | "fix_orphaned_conversations"
 * - issueId?: string (for single fixes)
 * - details?: object (additional context)
 */
export async function POST(request: NextRequest) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, details } = body;

  const supabase = createAdminClient();

  try {
    switch (action) {
      case "fix_duplicate_matches": {
        // Keep the most recent match, delete the rest
        const { matchIds } = details;
        if (!matchIds || matchIds.length < 2) {
          return NextResponse.json(
            { error: "Need at least 2 match IDs to fix duplicates" },
            { status: 400 }
          );
        }

        // Get the matches to find the most recent one
        const { data: matches } = await supabase
          .from("matches")
          .select("id, created_at")
          .in("id", matchIds)
          .order("created_at", { ascending: false });

        if (!matches || matches.length < 2) {
          return NextResponse.json(
            { error: "Matches not found" },
            { status: 404 }
          );
        }

        // Keep the first (most recent), delete the rest
        const keepId = matches[0].id;
        const deleteIds = matches.slice(1).map((m) => m.id);

        const { error: deleteError } = await supabase
          .from("matches")
          .delete()
          .in("id", deleteIds);

        if (deleteError) {
          throw deleteError;
        }

        // Log the fix to system_issues
        await supabase.from("system_issues").insert({
          issue_type: "duplicate_match_fixed",
          severity: "low",
          context: {
            kept_match_id: keepId,
            deleted_match_ids: deleteIds,
            fixed_by: "admin",
          },
          resolved: true,
          resolved_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          action: "fix_duplicate_matches",
          kept: keepId,
          deleted: deleteIds,
          message: `Kept match ${keepId.substring(0, 8)}..., deleted ${deleteIds.length} duplicate(s)`,
        });
      }

      case "fix_duplicate_conversations": {
        // Merge messages into oldest conversation, delete the rest
        const { conversationIds } = details;
        if (!conversationIds || conversationIds.length < 2) {
          return NextResponse.json(
            { error: "Need at least 2 conversation IDs to fix duplicates" },
            { status: 400 }
          );
        }

        // Get the conversations to find the oldest one (keep it)
        const { data: convos } = await supabase
          .from("conversations")
          .select("id, created_at")
          .in("id", conversationIds)
          .order("created_at", { ascending: true });

        if (!convos || convos.length < 2) {
          return NextResponse.json(
            { error: "Conversations not found" },
            { status: 404 }
          );
        }

        const keepId = convos[0].id;
        const deleteIds = convos.slice(1).map((c) => c.id);

        // Move messages from duplicate conversations to the kept one
        for (const deleteId of deleteIds) {
          await supabase
            .from("messages")
            .update({ conversation_id: keepId })
            .eq("conversation_id", deleteId);
        }

        // Delete participant records for duplicate conversations
        await supabase
          .from("conversation_participants")
          .delete()
          .in("conversation_id", deleteIds);

        // Delete the duplicate conversations
        const { error: deleteError } = await supabase
          .from("conversations")
          .delete()
          .in("id", deleteIds);

        if (deleteError) {
          throw deleteError;
        }

        // Log the fix
        await supabase.from("system_issues").insert({
          issue_type: "duplicate_conversation_fixed",
          severity: "low",
          context: {
            kept_conversation_id: keepId,
            deleted_conversation_ids: deleteIds,
            fixed_by: "admin",
          },
          resolved: true,
          resolved_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          action: "fix_duplicate_conversations",
          kept: keepId,
          deleted: deleteIds,
          message: `Kept conversation ${keepId.substring(0, 8)}..., merged and deleted ${deleteIds.length} duplicate(s)`,
        });
      }

      case "fix_orphaned_conversations": {
        // Delete conversations with < 2 participants
        const { conversationIds } = details;
        if (!conversationIds || conversationIds.length === 0) {
          return NextResponse.json(
            { error: "Need conversation IDs to fix" },
            { status: 400 }
          );
        }

        // Delete messages first
        await supabase
          .from("messages")
          .delete()
          .in("conversation_id", conversationIds);

        // Delete participants
        await supabase
          .from("conversation_participants")
          .delete()
          .in("conversation_id", conversationIds);

        // Delete conversations
        const { error: deleteError } = await supabase
          .from("conversations")
          .delete()
          .in("id", conversationIds);

        if (deleteError) {
          throw deleteError;
        }

        // Log the fix
        await supabase.from("system_issues").insert({
          issue_type: "orphaned_conversation_fixed",
          severity: "low",
          context: {
            deleted_conversation_ids: conversationIds,
            fixed_by: "admin",
          },
          resolved: true,
          resolved_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          action: "fix_orphaned_conversations",
          deleted: conversationIds,
          message: `Deleted ${conversationIds.length} orphaned conversation(s)`,
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Match integrity fix failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fix issues",
      },
      { status: 500 }
    );
  }
}
