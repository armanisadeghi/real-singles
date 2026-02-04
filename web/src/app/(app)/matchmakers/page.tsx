"use client";

import { MatchmakerGrid } from "@/components/matchmaker/MatchmakerGrid";
import { Wand2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MatchmakersPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6">
        {/* Back button */}
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Professional Matchmakers
            </h1>
            <p className="text-sm text-muted-foreground">
              Connect with expert matchmakers who can help you find your perfect match
            </p>
          </div>
        </div>

        {/* Matchmaker Grid */}
        <MatchmakerGrid />
      </div>
    </div>
  );
}
