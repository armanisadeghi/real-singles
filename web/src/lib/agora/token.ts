/**
 * Agora Token Generation
 * 
 * This module generates tokens for Agora RTC (Real-Time Communication)
 * Tokens are required for secure access to Agora video/voice call services
 * 
 * Note: Chat functionality has been migrated to Supabase Realtime
 * 
 * Uses the official agora-token package for proper token generation
 */

import { RtcTokenBuilder, RtcRole } from "agora-token";

const AGORA_APP_ID = process.env.AGORA_APP_ID!;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!;

// Token expiration time (24 hours in seconds)
const TOKEN_EXPIRATION_SECONDS = 86400;

interface TokenResponse {
  token: string;
  expiresAt: number;
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
    expiresAt,
    expiresAt // privilegeExpiredTs - using same expiration for token and privilege
  );
  
  return {
    token,
    expiresAt,
  };
}

/**
 * Refresh an existing call token
 */
export async function refreshCallToken(
  channelName: string,
  uid: number
): Promise<TokenResponse> {
  return generateCallToken(channelName, uid);
}

/**
 * Get Agora configuration for client-side SDK initialization
 */
export function getAgoraConfig() {
  return {
    appId: AGORA_APP_ID,
  };
}
