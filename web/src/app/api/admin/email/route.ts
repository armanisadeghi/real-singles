import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";

/**
 * POST /api/admin/email
 * Send email to one or more users (admin only)
 */
export async function POST(request: Request) {
  // Verify admin access
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json(
      { success: false, msg: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check if user is admin
  const adminSupabase = createAdminClient();
  const { data: userData } = await adminSupabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  if (!userData || (userData.role !== "admin" && userData.role !== "moderator")) {
    return NextResponse.json(
      { success: false, msg: "Forbidden - Admin access required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { to, subject, message, userIds } = body;

    // Validate required fields
    if (!subject || !message) {
      return NextResponse.json(
        { success: false, msg: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Determine recipients
    let recipients: string[] = [];

    if (to && Array.isArray(to) && to.length > 0) {
      // Direct email addresses provided
      recipients = to;
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Fetch emails by user IDs
      const { data: users, error } = await adminSupabase
        .from("users")
        .select("email")
        .in("id", userIds);

      if (error) {
        console.error("Error fetching user emails:", error);
        return NextResponse.json(
          { success: false, msg: "Error fetching user emails" },
          { status: 500 }
        );
      }

      recipients = users?.map((u) => u.email).filter(Boolean) || [];
    } else {
      return NextResponse.json(
        { success: false, msg: "Either 'to' or 'userIds' must be provided" },
        { status: 400 }
      );
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, msg: "No valid recipients found" },
        { status: 400 }
      );
    }

    // Build HTML email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">RealSingles</h1>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="white-space: pre-wrap; color: #374151; line-height: 1.6;">${message}</div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This email was sent from RealSingles. If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `;

    // Send emails (batch for multiple recipients)
    const results = await Promise.allSettled(
      recipients.map((email) =>
        sendEmail({
          to: email,
          subject,
          html: htmlContent,
        })
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    // Log the email send operation
    await adminSupabase.from("admin_email_logs").insert({
      sent_by: authUser.id,
      recipient_count: recipients.length,
      subject,
      successful_count: successful,
      failed_count: failed,
    });

    return NextResponse.json({
      success: true,
      msg: `Email sent to ${successful} recipient(s)${failed > 0 ? `, ${failed} failed` : ""}`,
      data: { successful, failed, total: recipients.length },
    });
  } catch (error) {
    console.error("Error in POST /api/admin/email:", error);
    return NextResponse.json(
      { success: false, msg: "Failed to send email" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/email/templates
 * Get available email templates
 */
export async function GET() {
  // Return available email templates for the admin UI
  const templates = [
    {
      id: "welcome",
      name: "Welcome Message",
      subject: "Welcome to RealSingles!",
      message: `Hello,

We're excited to have you as part of the RealSingles community! Here are a few tips to get started:

1. Complete your profile to increase your visibility
2. Upload photos that showcase your personality
3. Be authentic - genuine connections start with authenticity

If you have any questions, don't hesitate to reach out.

Best,
The RealSingles Team`,
    },
    {
      id: "announcement",
      name: "General Announcement",
      subject: "Important Update from RealSingles",
      message: `Hello,

We have an important announcement to share with you.

[Your announcement content here]

Thank you for being part of our community!

Best,
The RealSingles Team`,
    },
    {
      id: "event-reminder",
      name: "Event Reminder",
      subject: "Reminder: Upcoming Event",
      message: `Hello,

This is a friendly reminder about an upcoming event:

Event: [Event Name]
Date: [Date]
Time: [Time]
Location: [Location]

We hope to see you there!

Best,
The RealSingles Team`,
    },
  ];

  return NextResponse.json({ success: true, data: templates });
}
