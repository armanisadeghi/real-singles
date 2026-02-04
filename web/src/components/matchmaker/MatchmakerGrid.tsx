"use client";

import { useEffect, useState } from "react";
import { MatchmakerCard } from "./MatchmakerCard";

interface Matchmaker {
  id: string;
  user_id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  profile_image_url: string;
  bio: string;
  specialties: string[];
  years_experience: number;
  certifications: string[];
  stats: {
    total_introductions: number;
    successful_introductions: number;
    success_rate: number;
    active_clients: number;
    average_rating: number | null;
    total_reviews: number;
  };
}

export function MatchmakerGrid() {
  const [matchmakers, setMatchmakers] = useState<Matchmaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatchmakers();
  }, []);

  const fetchMatchmakers = async () => {
    try {
      const response = await fetch("/api/matchmakers?limit=50");
      const data = await response.json();

      if (data.success) {
        setMatchmakers(data.data || []);
      } else {
        setError(data.msg || "Failed to load matchmakers");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border/40 p-6 animate-pulse"
          >
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4" />
            <div className="h-4 w-3/4 bg-muted rounded mx-auto mb-2" />
            <div className="h-3 w-1/2 bg-muted rounded mx-auto mb-4" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-5/6 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={fetchMatchmakers}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (matchmakers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No matchmakers available yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {matchmakers.map((matchmaker) => (
        <MatchmakerCard key={matchmaker.id} matchmaker={matchmaker} />
      ))}
    </div>
  );
}
