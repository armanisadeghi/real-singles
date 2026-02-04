"use client";

import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your performance and success metrics
          </p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-card rounded-xl border border-border/40 p-12 text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Analytics Dashboard Coming Soon
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Detailed charts and metrics for your matchmaking performance will be
          available here, including intro trends, success rates, and client
          insights.
        </p>
      </div>
    </div>
  );
}
