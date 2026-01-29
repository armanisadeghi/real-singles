"use client";

import { Heart, Users, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStatsProps {
  likesReceived: number;
  likesGiven: number;
  mutualMatches: number;
  superLikesReceived: number;
}

export function QuickStats({
  likesReceived,
  likesGiven,
  mutualMatches,
  superLikesReceived,
}: QuickStatsProps) {
  const stats = [
    {
      label: "Likes Received",
      value: likesReceived,
      icon: Heart,
      gradient: "from-pink-500 to-rose-500",
      bgLight: "bg-pink-50",
      textColor: "text-pink-700",
    },
    {
      label: "Likes Given",
      value: likesGiven,
      icon: Heart,
      gradient: "from-blue-500 to-indigo-500",
      bgLight: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      label: "Mutual Matches",
      value: mutualMatches,
      icon: Users,
      gradient: "from-emerald-500 to-teal-500",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      label: "Super Likes",
      value: superLikesReceived,
      icon: Sparkles,
      gradient: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50",
      textColor: "text-amber-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "relative overflow-hidden rounded-xl p-4",
            stat.bgLight,
            "opacity-100 translate-y-0",
            "[transition:opacity_300ms_ease-out,transform_300ms_ease-out]",
            "[@starting-style]:opacity-0 [@starting-style]:translate-y-2"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                stat.gradient
              )}
            >
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={cn("text-2xl font-bold", stat.textColor)}>
                {stat.value}
              </p>
              <p className="text-xs text-slate-600">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
