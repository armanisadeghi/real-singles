import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  runFullIntegrityCheck,
  runSpecificCheck,
  batchFixAvatarIssues,
  batchFixGalleryIssues,
} from "@/lib/services/data-integrity";

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

/**
 * GET /api/admin/data-integrity
 *
 * Run integrity checks. Query params:
 * - type: "all" | "avatars" | "profiles" | "gallery" (default: "all")
 * - summary: "true" to get only summary without full issue list
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const checkType = searchParams.get("type") ?? "all";
  const summaryOnly = searchParams.get("summary") === "true";

  const supabase = createAdminClient();

  try {
    let result;

    if (checkType === "all") {
      result = await runFullIntegrityCheck(supabase);
    } else if (["avatars", "profiles", "gallery"].includes(checkType)) {
      result = await runSpecificCheck(
        supabase,
        checkType as "avatars" | "profiles" | "gallery"
      );
    } else {
      return NextResponse.json(
        { error: "Invalid check type" },
        { status: 400 }
      );
    }

    if (summaryOnly) {
      return NextResponse.json({
        totalUsers: result.totalUsers,
        checkedAt: result.checkedAt,
        summary: result.summary,
        issueCount: result.issues.length,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Data integrity check failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to run integrity check",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/data-integrity
 *
 * Fix issues. Body:
 * - action: "fix_avatars" | "fix_gallery" | "fix_single"
 * - userIds?: string[] (optional, for targeted fixes)
 * - userId?: string (for single fixes)
 * - issueType?: string (for single fixes)
 * - details?: object (additional context for single fixes)
 */
export async function POST(request: NextRequest) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, userIds, userId, issueType, details } = body;

  const supabase = createAdminClient();

  try {
    switch (action) {
      case "fix_avatars": {
        const result = await batchFixAvatarIssues(supabase, userIds);
        return NextResponse.json({
          success: true,
          action: "fix_avatars",
          ...result,
          message: `Fixed ${result.fixed.length} avatar issues, ${result.failed.length} failed`,
        });
      }

      case "fix_gallery": {
        const result = await batchFixGalleryIssues(supabase, userIds);
        return NextResponse.json({
          success: true,
          action: "fix_gallery",
          ...result,
          message: `Fixed ${result.fixed.length} gallery issues, ${result.failed.length} failed`,
        });
      }

      case "fix_single": {
        if (!userId || !issueType) {
          return NextResponse.json(
            { error: "Missing userId or issueType" },
            { status: 400 }
          );
        }

        // Import specific fix functions dynamically
        const {
          fixAvatarFromGallery,
          fixMissingPrimary,
          fixOrphanedGalleryRecord,
          fixBrokenPrimaryPhoto,
        } = await import("@/lib/services/data-integrity");

        let result;

        switch (issueType) {
          case "missing_avatar":
          case "broken_avatar":
            result = await fixAvatarFromGallery(supabase, userId);
            break;
          case "missing_primary_photo":
            result = await fixMissingPrimary(supabase, userId);
            break;
          case "orphaned_gallery_record":
            if (!details?.galleryId) {
              return NextResponse.json(
                { error: "Missing galleryId in details" },
                { status: 400 }
              );
            }
            result = await fixOrphanedGalleryRecord(
              supabase,
              userId,
              details.galleryId
            );
            break;
          case "broken_primary_photo":
            if (!details?.galleryId) {
              return NextResponse.json(
                { error: "Missing galleryId in details" },
                { status: 400 }
              );
            }
            result = await fixBrokenPrimaryPhoto(
              supabase,
              userId,
              details.galleryId
            );
            break;
          default:
            return NextResponse.json(
              { error: `Cannot auto-fix issue type: ${issueType}` },
              { status: 400 }
            );
        }

        return NextResponse.json({
          success: result.success,
          result,
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Data integrity fix failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fix issues",
      },
      { status: 500 }
    );
  }
}
