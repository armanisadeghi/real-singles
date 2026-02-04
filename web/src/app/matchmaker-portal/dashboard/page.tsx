"use client";

import { DashboardStats } from "@/components/matchmaker/DashboardStats";
import { RecentActivity } from "@/components/matchmaker/RecentActivity";
import { useMatchmaker } from "@/contexts/MatchmakerContext";
import { Wand2 } from "lucide-react";

export default function MatchmakerDashboardPage() {
  const { matchmakerId } = useMatchmaker();

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
      <DashboardStats matchmakerId={matchmakerId} />

      {/* Recent Activity */}
      <RecentActivity matchmakerId={matchmakerId} />
    </div>
  );
}
