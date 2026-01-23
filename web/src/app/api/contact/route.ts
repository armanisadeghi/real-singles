import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/contact
 * Submit a contact form
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    // Get current user if authenticated (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Handle FormData or JSON
    let name: string | null = null;
    let email: string | null = null;
    let subject: string | null = null;
    let message: string | null = null;

    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = formData.get("name") as string || formData.get("Name") as string;
      email = formData.get("email") as string || formData.get("Email") as string;
      subject = formData.get("subject") as string || formData.get("Subject") as string;
      message = formData.get("message") as string || formData.get("Message") as string;
    } else {
      const body = await request.json();
      name = body.name || body.Name;
      email = body.email || body.Email;
      subject = body.subject || body.Subject;
      message = body.message || body.Message;
    }

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { success: false, msg: "Email is required" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, msg: "Message is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, msg: "Invalid email format" },
        { status: 400 }
      );
    }

    // Insert into contact_submissions
    const { error } = await supabase
      .from("contact_submissions")
      .insert({
        user_id: user?.id || null,
        name: name || null,
        email,
        subject: subject || null,
        message,
        status: "new",
      });

    if (error) {
      console.error("Error saving contact submission:", error);
      return NextResponse.json(
        { success: false, msg: "Error submitting contact form" },
        { status: 500 }
      );
    }

    // TODO: Send email notification to admin using Resend
    // const emailClient = createEmailClient();
    // await emailClient.sendEmail({
    //   to: process.env.ADMIN_EMAIL,
    //   subject: `New Contact Form: ${subject || 'No Subject'}`,
    //   body: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    // });

    return NextResponse.json({
      success: true,
      msg: "Thank you for contacting us! We'll get back to you soon.",
    });
  } catch (error) {
    console.error("Error in POST /api/contact:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
