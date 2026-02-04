"use client";

import { Settings } from "lucide-react";

export default function MatchmakerSettingsPage() {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-gray-500 flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your matchmaker profile
          </p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-card rounded-xl border border-border/40 p-12 text-center">
        <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Settings Coming Soon
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Edit your matchmaker bio, specialties, and certifications here.
        </p>
      </div>
    </div>
  );
}
