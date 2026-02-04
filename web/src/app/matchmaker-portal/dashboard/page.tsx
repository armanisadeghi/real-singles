"use client";

import { useEffect, useState } from "react";
import { DashboardStats } from "@/components/matchmaker/DashboardStats";
import { RecentActivity } from "@/components/matchmaker/RecentActivity";
import { Wand2 } from "lucide-react";

export default function MatchmakerDashboardPage() {
  const [matchmakerId, setMatchmakerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user's matchmaker ID
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          // Get matchmaker ID from users table
          fetch("/api/matchmakers")
            .then((res) => res.json())
            .then((mmData) => {
              // Find matchmaker by current user
              // For now, we'll need to get it from the matchmakers table
              // This is a temporary solution - ideally we'd have it in the user profile
              setLoading(false);
            });
        }
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Wand2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Matchmaker Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here's your overview
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardStats />

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
