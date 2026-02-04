"use client";

import { useEffect, useState } from "react";
import { Users, Heart, TrendingUp, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  total_introductions: number;
  successful_introductions: number;
  active_clients: number;
  total_clients: number;
  average_rating: number | null;
  total_reviews: number;
  success_rate: number;
}

interface DashboardStatsProps {
  matchmakerId: string;
}

export function DashboardStats({ matchmakerId }: DashboardStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/matchmakers/${matchmakerId}/stats`);
        const data = await response.json();

        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.msg || "Failed to fetch stats");
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to load stats");
      } finally {
        setLoading(false);
      }
    };

    if (matchmakerId) {
      fetchStats();
    }
  }, [matchmakerId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border/40 p-6 animate-pulse"
          >
            <div className="h-4 w-24 bg-muted rounded mb-3" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50 text-sm text-red-800 dark:text-red-300">
        {error}
      </div>
    );
  }

  const statCards = [
    {
      label: "Active Clients",
      value: stats?.active_clients || 0,
      icon: Users,
      bgColor: "bg-blue-100 dark:bg-blue-950/30",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Total Introductions",
      value: stats?.total_introductions || 0,
      icon: Heart,
      bgColor: "bg-pink-100 dark:bg-pink-950/30",
      textColor: "text-pink-600 dark:text-pink-400",
    },
    {
      label: "Success Rate",
      value: `${stats?.success_rate || 0}%`,
      icon: TrendingUp,
      bgColor: "bg-green-100 dark:bg-green-950/30",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Average Rating",
      value: stats?.average_rating
        ? stats.average_rating.toFixed(1)
        : "No reviews",
      icon: Star,
      bgColor: "bg-amber-100 dark:bg-amber-950/30",
      textColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-card rounded-xl border border-border/40 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">
                {card.label}
              </p>
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  card.bgColor
                )}
              >
                <Icon className={cn("w-4 h-4", card.textColor)} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}
