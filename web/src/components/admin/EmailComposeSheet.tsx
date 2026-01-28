"use client";

import { useState } from "react";
import { BottomSheet, BottomSheetActions } from "@/components/ui/BottomSheet";
import { Mail, Send, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Recipient {
  id: string;
  email: string;
  name: string;
}

interface EmailComposeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: Recipient[];
  defaultSubject?: string;
  defaultMessage?: string;
  title?: string;
}

export function EmailComposeSheet({
  isOpen,
  onClose,
  recipients,
  defaultSubject = "",
  defaultMessage = "",
  title = "Compose Email",
}: EmailComposeSheetProps) {
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setResult({ success: false, msg: "Subject and message are required" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipients.map((r) => r.email),
          subject,
          message,
        }),
      });

      const data = await res.json();
      setResult({ success: data.success, msg: data.msg });

      if (data.success) {
        // Clear form and close after a delay
        setTimeout(() => {
          setSubject(defaultSubject);
          setMessage(defaultMessage);
          setResult(null);
          onClose();
        }, 2000);
      }
    } catch (error) {
      setResult({ success: false, msg: "Failed to send email" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubject(defaultSubject);
    setMessage(defaultMessage);
    setResult(null);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="p-4 space-y-4">
        {/* Recipients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            To ({recipients.length} recipient{recipients.length !== 1 ? "s" : ""})
          </label>
          <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg max-h-24 overflow-y-auto">
            {recipients.slice(0, 10).map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-full text-xs"
              >
                <Mail className="w-3 h-3 text-gray-400" />
                {r.name || r.email}
              </span>
            ))}
            {recipients.length > 10 && (
              <span className="inline-flex items-center px-2 py-1 text-xs text-gray-500">
                +{recipients.length - 10} more
              </span>
            )}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Result */}
        {result && (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
              result.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{result.msg}</span>
          </div>
        )}
      </div>

      <BottomSheetActions>
        <button
          onClick={handleClose}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={loading || !subject.trim() || !message.trim()}
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
              Send Email
            </>
          )}
        </button>
      </BottomSheetActions>
    </BottomSheet>
  );
}
