"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Heart,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader2,
  User,
} from "lucide-react";

interface Introduction {
  id: string;
  user_a: {
    id: string;
    display_name: string;
    first_name: string;
    last_name: string;
    profile_image_url: string;
  };
  user_b: {
    id: string;
    display_name: string;
    first_name: string;
    last_name: string;
    profile_image_url: string;
  };
  status: string;
  outcome: string | null;
  created_at: string;
  conversation_id: string | null;
}

interface IntroHistoryTableProps {
  matchmakerId: string;
}

export function IntroHistoryTable({ matchmakerId }: IntroHistoryTableProps) {
  const [intros, setIntros] = useState<Introduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchIntroductions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(
        `/api/matchmakers/${matchmakerId}/introductions?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        setIntros(data.data || []);
      } else {
        setError(data.msg || "Failed to fetch introductions");
      }
    } catch (err) {
      console.error("Error fetching introductions:", err);
      setError("Failed to load introductions");
    } finally {
      setLoading(false);
    }
  }, [matchmakerId, statusFilter]);

  useEffect(() => {
    if (matchmakerId) {
      fetchIntroductions();
    }
  }, [matchmakerId, statusFilter, fetchIntroductions]);

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "active", label: "Active" },
    { value: "declined", label: "Declined" },
    { value: "expired", label: "Expired" },
  ];

  const getStatusIcon = (status: string) => {
    if (status === "active" || status === "both_accepted") return CheckCircle;
    if (status.includes("declined")) return XCircle;
    if (status === "pending") return Clock;
    return Heart;
  };

  const getStatusColor = (status: string) => {
    if (status === "active" || status === "both_accepted")
      return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/30";
    if (status.includes("declined"))
      return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/30";
    if (status === "pending")
      return "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30";
    if (status === "expired")
      return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/30";
    return "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/30";
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "Pending",
      user_a_accepted: "User A Accepted",
      user_b_accepted: "User B Accepted",
      both_accepted: "Both Accepted",
      active: "Active",
      user_a_declined: "User A Declined",
      user_b_declined: "User B Declined",
      declined: "Declined",
      expired: "Expired",
    };
    return labels[status] || status;
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return null;

    const outcomeConfig: { [key: string]: { label: string; color: string } } = {
      chatted: {
        label: "Chatted",
        color:
          "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
      },
      dated: {
        label: "Dated",
        color:
          "bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300",
      },
      relationship: {
        label: "In Relationship",
        color:
          "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300",
      },
      declined: {
        label: "Declined",
        color:
          "bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300",
      },
      no_response: {
        label: "No Response",
        color:
          "bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300",
      },
    };

    const config = outcomeConfig[outcome];
    if (!config) return null;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/40 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl border border-border/40 p-6">
        <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50 text-sm text-red-800 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
      {/* Filters */}
      <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-2 flex-wrap">
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
            {statusFilter === "all"
              ? "No introductions yet. Browse profiles to create your first introduction!"
              : `No ${statusFilter} introductions found.`}
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
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColor}`}
                >
                  <StatusIcon className="w-5 h-5" />
                </div>

                {/* Users */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 overflow-hidden flex-shrink-0">
                    {intro.user_a.profile_image_url ? (
                      <img
                        src={intro.user_a.profile_image_url}
                        alt={intro.user_a.first_name || "User A"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">
                    {intro.user_a.first_name || "User"}
                  </span>
                  <Heart className="w-4 h-4 text-pink-500 flex-shrink-0" />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 overflow-hidden flex-shrink-0">
                    {intro.user_b.profile_image_url ? (
                      <img
                        src={intro.user_b.profile_image_url}
                        alt={intro.user_b.first_name || "User B"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">
                    {intro.user_b.first_name || "User"}
                  </span>
                </div>

                {/* Status & Outcome */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${statusColor.split(" ")[0]}`}
                    >
                      {getStatusLabel(intro.status)}
                    </p>
                    {intro.outcome && (
                      <div className="mt-1">{getOutcomeBadge(intro.outcome)}</div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
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
