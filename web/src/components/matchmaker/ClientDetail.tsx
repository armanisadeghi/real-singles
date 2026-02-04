"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, MapPin, Heart, Save, Loader2 } from "lucide-react";
import Link from "next/link";

interface ClientDetailProps {
  clientId: string;
}

export function ClientDetail({ clientId }: ClientDetailProps) {
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch client details - TODO: Implement
    setLoading(false);
  }, [clientId]);

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save notes and status
    setTimeout(() => setSaving(false), 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Back Button */}
      <Link
        href="/matchmaker-portal/clients"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      {/* Client Profile Card */}
      <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Profile Image */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center overflow-hidden">
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                ?
              </span>
            </div>

            {/* Client Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Client Name</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>Age years old</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Location
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Client since Month Year
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="px-3 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 text-sm font-medium rounded-full">
              Active
            </div>
          </div>
        </div>
      </div>

      {/* Status & Notes */}
      <div className="bg-card rounded-xl border border-border/40 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Relationship Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border/40 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Private Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this client's preferences, goals, or any important details..."
            className="w-full h-32 px-4 py-3 bg-background border border-border/40 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            maxLength={5000}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {notes.length} / 5000 characters
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Introductions Made for This Client */}
      <div className="bg-card rounded-xl border border-border/40 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Introductions for This Client
        </h2>
        <div className="text-center py-8">
          <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            No introductions yet. Create one from the Discover page.
          </p>
        </div>
      </div>
    </div>
  );
}
