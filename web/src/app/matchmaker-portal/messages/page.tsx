"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";

export default function MessagesPage() {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Chat with your clients and manage conversations
          </p>
        </div>
      </div>

      {/* Redirect Info */}
      <div className="bg-card rounded-xl border border-border/40 p-12 text-center">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Use Main Messaging
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
          Your matchmaker conversations appear in the main RealSingles messages
          interface. Group chats from introductions will show there as well.
        </p>
        <Link
          href="/messages"
          className="inline-block px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors"
        >
          Go to Messages
        </Link>
      </div>
    </div>
  );
}
