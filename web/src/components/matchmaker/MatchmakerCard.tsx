"use client";

import Link from "next/link";
import { Star, Heart, Users, TrendingUp } from "lucide-react";

interface MatchmakerCardProps {
  matchmaker: {
    id: string;
    display_name: string;
    first_name: string;
    last_name: string;
    profile_image_url: string;
    bio: string;
    specialties: string[];
    years_experience: number;
    stats: {
      total_introductions: number;
      successful_introductions: number;
      success_rate: number;
      active_clients: number;
      average_rating: number | null;
      total_reviews: number;
    };
  };
}

export function MatchmakerCard({ matchmaker }: MatchmakerCardProps) {
  const formatSpecialty = (specialty: string) => {
    return specialty
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Link
      href={`/matchmakers/${matchmaker.id}`}
      className="group bg-card rounded-xl border border-border/40 overflow-hidden hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-lg transition-all duration-200"
    >
      {/* Profile Section */}
      <div className="p-6 text-center">
        {/* Profile Image */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center overflow-hidden ring-4 ring-purple-100 dark:ring-purple-950/50 group-hover:ring-purple-200 dark:group-hover:ring-purple-900/50 transition-all">
          {matchmaker.profile_image_url ? (
            <img
              src={matchmaker.profile_image_url}
              alt={matchmaker.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {matchmaker.first_name?.charAt(0) || "M"}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-foreground group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
          {matchmaker.display_name}
        </h3>

        {/* Experience */}
        <p className="text-sm text-muted-foreground mt-1">
          {matchmaker.years_experience} years experience
        </p>

        {/* Rating */}
        {matchmaker.stats.average_rating !== null && (
          <div className="flex items-center justify-center gap-1 mt-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium text-foreground">
              {matchmaker.stats.average_rating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({matchmaker.stats.total_reviews} reviews)
            </span>
          </div>
        )}

        {/* Bio Preview */}
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
          {matchmaker.bio}
        </p>
      </div>

      {/* Stats Section */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Heart className="w-3.5 h-3.5 text-pink-500" />
              <p className="text-xs text-muted-foreground">Intros</p>
            </div>
            <p className="text-sm font-bold text-foreground">
              {matchmaker.stats.total_introductions}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <p className="text-xs text-muted-foreground">Success</p>
            </div>
            <p className="text-sm font-bold text-foreground">
              {matchmaker.stats.success_rate}%
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-xs text-muted-foreground">Clients</p>
            </div>
            <p className="text-sm font-bold text-foreground">
              {matchmaker.stats.active_clients}
            </p>
          </div>
        </div>
      </div>

      {/* Specialties */}
      {matchmaker.specialties.length > 0 && (
        <div className="px-6 pb-6">
          <div className="flex flex-wrap gap-2">
            {matchmaker.specialties.slice(0, 3).map((specialty) => (
              <span
                key={specialty}
                className="px-2 py-1 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full"
              >
                {formatSpecialty(specialty)}
              </span>
            ))}
            {matchmaker.specialties.length > 3 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                +{matchmaker.specialties.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* View Profile CTA */}
      <div className="px-6 pb-6">
        <div className="w-full py-2.5 text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg group-hover:from-purple-600 group-hover:to-pink-600 transition-colors">
          View Full Profile
        </div>
      </div>
    </Link>
  );
}
