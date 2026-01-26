/**
 * Agora Token Generation
 * 
 * This module generates tokens for Agora Chat and RTC (Real-Time Communication)
 * Tokens are required for secure access to Agora services
 * 
 * Uses the official agora-token package for proper token generation
 */

import { ChatTokenBuilder, RtcTokenBuilder, RtcRole } from "agora-token";

const AGORA_APP_ID = process.env.AGORA_APP_ID!;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!;
const AGORA_CHAT_APP_KEY = process.env.AGORA_CHAT_APP_KEY!;

// Token expiration time (24 hours in seconds)
const TOKEN_EXPIRATION_SECONDS = 86400;

interface TokenResponse {
  token: string;
  expiresAt: number;
}

/**
 * Generate an Agora Chat token for a user
 */
export async function generateChatToken(userId: string): Promise<TokenResponse> {
  const timestamp = Math.floor(Date.now() / 1000);
  const expiresAt = timestamp + TOKEN_EXPIRATION_SECONDS;
  
  // Use the official Agora Chat Token Builder
  const token = ChatTokenBuilder.buildUserToken(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    userId,
    expiresAt
  );
  
  return {
    token,
    expiresAt,
  };
}

/**
 * Generate an Agora RTC token for video/voice calls
 */
export async function generateCallToken(
  channelName: string,
  uid: number,
  role: "publisher" | "subscriber" = "publisher"
): Promise<TokenResponse> {
  const timestamp = Math.floor(Date.now() / 1000);
  const expiresAt = timestamp + TOKEN_EXPIRATION_SECONDS;
  
  // Use the official Agora RTC Token Builder
  const agoraRole = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    agoraRole,
    expiresAt
  );
  
  return {
    token,
    expiresAt,
  };
}

/**
 * Refresh an existing token
 */
export async function refreshToken(
  type: "chat" | "call",
  userId: string,
  channelName?: string,
  uid?: number
): Promise<TokenResponse> {
  if (type === "chat") {
    return generateChatToken(userId);
  } else {
    if (!channelName || uid === undefined) {
      throw new Error("Channel name and UID required for call token refresh");
    }
    return generateCallToken(channelName, uid);
  }
}

/**
 * Get Agora configuration for client-side SDK initialization
 */
export function getAgoraConfig() {
  return {
    appId: AGORA_APP_ID,
    chatAppKey: AGORA_CHAT_APP_KEY,
  };
}
