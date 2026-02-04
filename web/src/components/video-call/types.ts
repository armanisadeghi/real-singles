/**
 * Types for video call components
 */

export interface CallInvitation {
  id: string;
  caller_id: string;
  callee_id: string;
  conversation_id: string | null;
  room_name: string;
  call_type: "audio" | "video";
  status: "pending" | "accepted" | "rejected" | "missed" | "cancelled";
  created_at: string;
  answered_at: string | null;
  ended_at: string | null;
  callerName?: string;
  callerAvatar?: string;
}

export interface CallRecord {
  id: string;
  room_name: string;
  conversation_id: string | null;
  speed_dating_session_id: string | null;
  call_type: "audio" | "video";
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  participants: string[];
  metadata: Record<string, unknown>;
}

export interface VideoCallToken {
  token: string;
  serverUrl: string;
  roomName: string;
  identity: string;
  displayName: string;
}

export default CallInvitation;
