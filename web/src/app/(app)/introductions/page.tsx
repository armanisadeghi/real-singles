"use client";

import { IntroListPage } from "@/components/matchmaker/IntroListPage";
import { Heart } from "lucide-react";

export default function IntroductionsPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Matchmaker Introductions
            </h1>
            <p className="text-sm text-muted-foreground">
              Review introductions from your matchmaker
            </p>
          </div>
        </div>

        {/* Introduction List */}
        <IntroListPage />
      </div>
    </div>
  );
}
