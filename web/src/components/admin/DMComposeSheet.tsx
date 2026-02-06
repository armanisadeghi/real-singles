"use client";

import { useState } from "react";
import { BottomSheet, BottomSheetActions } from "@/components/ui/BottomSheet";
import {
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface DMRecipient {
  id: string;
  name: string;
}

interface DMComposeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: DMRecipient;
  /** Pre-filled message template */
  defaultMessage?: string;
  /** Context label shown above the message, e.g. "Regarding report: Harassment" */
  context?: string;
  title?: string;
}

/**
 * Admin DM compose sheet — creates a conversation with a user, sends a message,
 * and offers navigation to the conversation or back to the current page.
 *
 * Flow:
 * 1. Admin types a message
 * 2. On send: POST /api/conversations → get ConversationID → POST /api/messages
 * 3. Show success with link to conversation
 */
export function DMComposeSheet({
  isOpen,
  onClose,
  recipient,
  defaultMessage = "",
  context,
  title = "Send Direct Message",
}: DMComposeSheetProps) {
  const [message, setMessage] = useState(defaultMessage);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    msg: string;
    conversationId?: string;
  } | null>(null);

  const handleSend = async () => {
    if (!message.trim()) {
      setResult({ success: false, msg: "Message cannot be empty" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Step 1: Create or get existing conversation
      const convoRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "direct",
          participant_ids: [recipient.id],
        }),
      });
      const convoData = await convoRes.json();

      if (!convoData.success) {
        setResult({
          success: false,
          msg: convoData.msg || "Failed to create conversation",
        });
        return;
      }

      const conversationId = convoData.data?.ConversationID;
      if (!conversationId) {
        setResult({
          success: false,
          msg: "No conversation ID returned",
        });
        return;
      }

      // Step 2: Send the message via API
      const msgRes = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: message.trim(),
          message_type: "text",
        }),
      });
      const msgData = await msgRes.json();

      if (msgData.success) {
        setResult({
          success: true,
          msg: "Message sent successfully!",
          conversationId,
        });
      } else {
        setResult({
          success: false,
          msg: msgData.msg || "Failed to send message",
        });
      }
    } catch (error) {
      console.error("Error sending DM:", error);
      setResult({ success: false, msg: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage(defaultMessage);
    setResult(null);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="p-4 space-y-4">
        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            To
          </label>
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {recipient.name}
            </span>
            <span className="text-xs text-gray-400">
              (in-app message)
            </span>
          </div>
        </div>

        {/* Context */}
        {context && (
          <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-xs text-amber-700">{context}</p>
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={5}
            disabled={result?.success}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none disabled:opacity-60 disabled:bg-gray-50"
          />
        </div>

        {/* Result */}
        {result && (
          <div
            className={`flex items-start gap-2 px-4 py-3 rounded-lg ${
              result.success
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <span className="text-sm">{result.msg}</span>

              {/* Success: show navigation options */}
              {result.success && result.conversationId && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/chats/${result.conversationId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Conversation
                  </Link>
                  <button
                    onClick={handleClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions — hidden after successful send */}
      {!result?.success && (
        <BottomSheetActions>
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Message
              </>
            )}
          </button>
        </BottomSheetActions>
      )}
    </BottomSheet>
  );
}
