import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, text, from } = options;

  try {
    const { data, error } = await resend.emails.send({
      from: from || process.env.EMAIL_FROM || "RealSingles <noreply@realsingles.com>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Email send exception:", err);
    return { success: false, error: err };
  }
}

// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Welcome to RealSingles!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Welcome to RealSingles, ${name}!</h1>
        <p>We're excited to have you join our community of genuine singles looking for real connections.</p>
        <p>Here's what you can do next:</p>
        <ul>
          <li>Complete your profile to increase your visibility</li>
          <li>Upload photos to show your personality</li>
          <li>Browse matches and start connecting</li>
        </ul>
        <p>Happy matching!</p>
        <p>The RealSingles Team</p>
      </div>
    `,
  }),

  passwordReset: (resetUrl: string) => ({
    subject: "Reset Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Password Reset Request</h1>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  }),

  matchNotification: (matchName: string, matchProfileUrl: string) => ({
    subject: `You have a new match! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">It's a Match!</h1>
        <p>Great news! You and ${matchName} have liked each other.</p>
        <a href="${matchProfileUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">View Profile</a>
        <p>Don't keep them waiting - start a conversation now!</p>
      </div>
    `,
  }),
};
