"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Clock, CheckCircle, XCircle, MessageSquare, Calendar, ArrowRight } from "lucide-react";

interface Introduction {
  id: string;
  user_a: {
    id: string;
    display_name: string;
    first_name: string;
    profile_image_url: string;
  };
  user_b: {
    id: string;
    display_name: string;
    first_name: string;
    profile_image_url: string;
  };
  status: string;
  outcome: string | null;
  created_at: string;
  conversation_id: string | null;
}

export function IntroHistoryTable() {
  const [intros, setIntros] = useState<Introduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    // Fetch introductions - TODO: Implement
    setLoading(false);
  }, [statusFilter]);

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "both_accepted", label: "Accepted" },
    { value: "user_a_declined", label: "Declined" },
    { value: "user_b_declined", label: "Declined" },
  ];

  const getStatusIcon = (status: string) => {
    if (status === "both_accepted") return CheckCircle;
    if (status.includes("declined")) return XCircle;
    if (status.includes("accepted")) return Clock;
    return Heart;
  };

  const getStatusColor = (status: string) => {
    if (status === "both_accepted") return "text-green-600 dark:text-green-400";
    if (status.includes("declined")) return "text-red-600 dark:text-red-400";
    if (status.includes("accepted")) return "text-amber-600 dark:text-amber-400";
    return "text-purple-600 dark:text-purple-400";
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "Pending",
      user_a_accepted: "User A Accepted",
      user_b_accepted: "User B Accepted",
      both_accepted: "Both Accepted",
      user_a_declined: "User A Declined",
      user_b_declined: "User B Declined",
      expired: "Expired",
    };
    return labels[status] || status;
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return null;

    const outcomeConfig: { [key: string]: { label: string; color: string } } = {
      chatted: { label: "Chatted", color: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" },
      dated: { label: "Dated", color: "bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300" },
      relationship: { label: "In Relationship", color: "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300" },
      declined: { label: "Declined", color: "bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300" },
      no_response: { label: "No Response", color: "bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300" },
    };

    const config = outcomeConfig[outcome];
    if (!config) return null;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/40 p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-muted rounded" />
                <div className="h-3 w-1/3 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
      {/* Filters */}
      <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === option.value
                  ? "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Introduction List */}
      {intros.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            No introductions yet. Browse profiles to create your first introduction!
          </p>
          <Link
            href="/matchmaker-portal/discover"
            className="inline-block mt-4 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            Browse Profiles
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {intros.map((intro) => {
            const StatusIcon = getStatusIcon(intro.status);
            const statusColor = getStatusColor(intro.status);

            return (
              <Link
                key={intro.id}
                href={`/matchmaker-portal/introductions/${intro.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group"
              >
                {/* Status Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColor}`}>
                  <StatusIcon className="w-5 h-5" />
                </div>

                {/* Users */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 overflow-hidden">
                    {intro.user_a.profile_image_url ? (
                      <img
                        src={intro.user_a.profile_image_url}
                        alt={intro.user_a.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                        {intro.user_a.first_name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {intro.user_a.display_name}
                  </span>
                  <Heart className="w-4 h-4 text-pink-500" />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 overflow-hidden">
                    {intro.user_b.profile_image_url ? (
                      <img
                        src={intro.user_b.profile_image_url}
                        alt={intro.user_b.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                        {intro.user_b.first_name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {intro.user_b.display_name}
                  </span>
                </div>

                {/* Status & Outcome */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${statusColor}`}>
                      {getStatusLabel(intro.status)}
                    </p>
                    {intro.outcome && (
                      <div className="mt-1">{getOutcomeBadge(intro.outcome)}</div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(intro.created_at).toLocaleDateString()}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
