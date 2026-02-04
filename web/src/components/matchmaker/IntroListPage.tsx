"use client";

import { useEffect, useState } from "react";
import { IntroApprovalCard } from "./IntroApprovalCard";
import { Heart } from "lucide-react";

interface Introduction {
  id: string;
  matchmaker_name: string;
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
  intro_message: string;
  status: string;
  conversation_id: string | null;
  created_at: string;
}

export function IntroListPage() {
  const [intros, setIntros] = useState<Introduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "declined">("pending");

  useEffect(() => {
    // Fetch user's introductions - TODO: Implement API call
    setLoading(false);
  }, []);

  const tabs = [
    { id: "pending" as const, label: "Pending", count: 0 },
    { id: "active" as const, label: "Active", count: 0 },
    { id: "declined" as const, label: "Declined", count: 0 },
  ];

  const filteredIntros = intros.filter((intro) => {
    if (activeTab === "pending") {
      return intro.status === "pending" || intro.status.includes("accepted") && intro.status !== "both_accepted";
    }
    if (activeTab === "active") {
      return intro.status === "both_accepted";
    }
    if (activeTab === "declined") {
      return intro.status.includes("declined");
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
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
            {activeTab === "active" && "No active introductions"}
            {activeTab === "declined" && "No declined introductions"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIntros.map((intro) => (
            <IntroApprovalCard key={intro.id} introduction={intro} />
          ))}
        </div>
      )}
    </div>
  );
}
