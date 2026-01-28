import { Resend } from "resend";

// Validate required environment variables
if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not set - email sending will fail");
}

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Get the list of allowed email domains for sending
 * Uses EMAIL_ALLOWED_DOMAINS env var, or extracts domain from EMAIL_FROM
 */
export function getAllowedEmailDomains(): string[] {
  // If explicitly configured, use that
  if (process.env.EMAIL_ALLOWED_DOMAINS) {
    return process.env.EMAIL_ALLOWED_DOMAINS.split(",").map((d) => d.trim().toLowerCase());
  }
  
  // Otherwise, extract domain from EMAIL_FROM
  const emailFrom = process.env.EMAIL_FROM;
  if (emailFrom) {
    const match = emailFrom.match(/<([^>]+)>/) || emailFrom.match(/([^\s<>]+@[^\s<>]+)/);
    if (match) {
      const domain = match[1].split("@")[1];
      if (domain) return [domain.toLowerCase()];
    }
  }
  
  return [];
}

/**
 * Get the default from address
 */
export function getDefaultFromAddress(): string {
  return process.env.EMAIL_FROM || "";
}

/**
 * Validate that a from address uses an allowed domain
 */
export function isValidFromAddress(from: string): boolean {
  const allowedDomains = getAllowedEmailDomains();
  if (allowedDomains.length === 0) return true; // No restrictions if not configured
  
  // Extract email from "Name <email>" format or plain email
  const match = from.match(/<([^>]+)>/) || from.match(/([^\s<>]+@[^\s<>]+)/);
  if (!match) return false;
  
  const email = match[1].toLowerCase();
  const domain = email.split("@")[1];
  
  return allowedDomains.includes(domain);
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Send an email using Resend
 * Requires RESEND_API_KEY and EMAIL_FROM environment variables
 */
export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, text, from } = options;

  const senderAddress = from || process.env.EMAIL_FROM;
  
  if (!senderAddress) {
    console.error("EMAIL_FROM environment variable is not set");
    return { success: false, error: new Error("EMAIL_FROM is not configured") };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: senderAddress,
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
