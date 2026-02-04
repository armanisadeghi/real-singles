"use client";

import { useEffect, useState, useCallback } from "react";
import { IntroApprovalCard } from "./IntroApprovalCard";
import { Heart, Loader2 } from "lucide-react";

interface OtherUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  city: string | null;
  state: string | null;
  age: number | null;
  bio: string | null;
  occupation: string | null;
}

interface Matchmaker {
  id: string;
  name: string;
  profile_image_url: string | null;
}

interface Introduction {
  id: string;
  status: string;
  my_response: string | null;
  intro_message: string;
  conversation_id: string | null;
  created_at: string;
  expires_at: string | null;
  other_user: OtherUser;
  matchmaker: Matchmaker;
}

export function IntroListPage() {
  const [intros, setIntros] = useState<Introduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "past">(
    "pending"
  );

  const fetchIntroductions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/users/me/introductions");
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
  }, []);

  useEffect(() => {
    fetchIntroductions();
  }, [fetchIntroductions]);

  const handleIntroUpdate = () => {
    // Refetch introductions when one is updated
    fetchIntroductions();
  };

  // Count intros by category
  const pendingCount = intros.filter(
    (intro) =>
      intro.status === "pending" ||
      (intro.my_response === null &&
        (intro.status === "user_a_accepted" ||
          intro.status === "user_b_accepted"))
  ).length;

  const activeCount = intros.filter(
    (intro) => intro.status === "active" || intro.status === "both_accepted"
  ).length;

  const pastCount = intros.filter(
    (intro) =>
      intro.status.includes("declined") ||
      intro.status === "expired" ||
      intro.my_response !== null
  ).length;

  const tabs = [
    { id: "pending" as const, label: "Pending", count: pendingCount },
    { id: "active" as const, label: "Active", count: activeCount },
    { id: "past" as const, label: "Past", count: pastCount },
  ];

  const filteredIntros = intros.filter((intro) => {
    if (activeTab === "pending") {
      // Show intros where user hasn't responded yet
      return (
        intro.my_response === null &&
        !intro.status.includes("declined") &&
        intro.status !== "active" &&
        intro.status !== "both_accepted"
      );
    }
    if (activeTab === "active") {
      // Both accepted, has conversation
      return intro.status === "active" || intro.status === "both_accepted";
    }
    if (activeTab === "past") {
      // User has responded (accepted waiting, or declined), or other user declined
      return (
        intro.my_response !== null ||
        intro.status.includes("declined") ||
        intro.status === "expired"
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50 text-sm text-red-800 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-purple-500 text-purple-700 dark:text-purple-300"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Introduction Cards */}
      {filteredIntros.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            {activeTab === "pending" && "No pending introductions"}
            {activeTab === "active" && "No active introductions yet"}
            {activeTab === "past" && "No past introductions"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIntros.map((intro) => (
            <IntroApprovalCard
              key={intro.id}
              introduction={intro}
              onUpdate={handleIntroUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
