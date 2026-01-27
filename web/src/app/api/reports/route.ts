import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

// Type for report with JOIN data
interface ReportWithProfile {
  id: string;
  reason: string | null;
  description: string | null;
  status: string | null;
  created_at: string | null;
  reported_user_id: string | null;
  profiles: {
    first_name: string | null;
    profile_image_url: string | null;
    users: {
      display_name: string | null;
    } | null;
  } | null;
}

/**
 * POST /api/reports
 * Report a user for inappropriate behavior
 */
export async function POST(request: Request) {
  const supabase = await createApiClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, msg: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    let reportedUserId: string | null = null;
    let reason: string | null = null;
    let description: string | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      reportedUserId = formData.get("ReportedUserID") as string || formData.get("reported_user_id") as string;
      reason = formData.get("Reason") as string || formData.get("reason") as string;
      description = formData.get("Description") as string || formData.get("description") as string;
    } else {
      const body = await request.json();
      reportedUserId = body.ReportedUserID || body.reported_user_id;
      reason = body.Reason || body.reason;
      description = body.Description || body.description;
    }

    if (!reportedUserId) {
      return NextResponse.json(
        { success: false, msg: "Reported user ID is required" },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { success: false, msg: "Reason is required" },
        { status: 400 }
      );
    }

    // Can't report yourself
    if (reportedUserId === user.id) {
      return NextResponse.json(
        { success: false, msg: "Cannot report yourself" },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: reportedUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", reportedUserId)
      .single();

    if (!reportedUser) {
      return NextResponse.json(
        { success: false, msg: "User not found" },
        { status: 404 }
      );
    }

    // Check for existing recent report (prevent spam)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingReport } = await supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("reported_user_id", reportedUserId)
      .gte("created_at", oneDayAgo)
      .single();

    if (existingReport) {
      return NextResponse.json({
        success: true,
        msg: "You have already reported this user recently. Our team is reviewing it.",
      });
    }

    // Create report
    const { error } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        reason,
        description: description || null,
        status: "pending",
      });

    if (error) {
      console.error("Error creating report:", error);
      return NextResponse.json(
        { success: false, msg: "Error submitting report" },
        { status: 500 }
      );
    }

    // Create notification for admins (optional - could also send email)
    // In production, you might want to notify moderators via email or internal tool

    return NextResponse.json({
      success: true,
      msg: "Thank you for your report. Our team will review it shortly.",
    });
  } catch (error) {
    console.error("Error in POST /api/reports:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * GET /api/reports
 * Get user's submitted reports (for reference)
 */
export async function GET() {
  const supabase = await createApiClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, msg: "Not authenticated" },
      { status: 401 }
    );
  }

  const { data: reports, error } = await supabase
    .from("reports")
    .select(`
      id,
      reason,
      description,
      status,
      created_at,
      reported_user_id,
      profiles:reported_user_id(
        first_name,
        profile_image_url,
        users:user_id(display_name)
      )
    `)
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching reports" },
      { status: 500 }
    );
  }

  // Cast through unknown due to Supabase's complex JOIN type inference
  const typedReports = (reports || []) as unknown as ReportWithProfile[];
  const formattedReports = typedReports.map((report) => ({
    id: report.id,
    reported_user_id: report.reported_user_id,
    reported_user_name: report.profiles?.users?.display_name || report.profiles?.first_name || "User",
    reason: report.reason,
    description: report.description,
    status: report.status,
    created_at: report.created_at,
  }));

  return NextResponse.json({
    success: true,
    data: formattedReports,
    msg: "Reports fetched successfully",
  });
}
