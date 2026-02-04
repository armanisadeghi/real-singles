"use client";

import { IntroHistoryTable } from "@/components/matchmaker/IntroHistoryTable";
import { Heart } from "lucide-react";

export default function IntroductionsPage() {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            My Introductions
          </h1>
          <p className="text-sm text-muted-foreground">
            Track and manage your introduction history
          </p>
        </div>
      </div>

      {/* Introduction History Table */}
      <IntroHistoryTable />
    </div>
  );
}
