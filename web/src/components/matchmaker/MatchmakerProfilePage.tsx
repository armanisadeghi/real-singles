"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Heart,
  Users,
  TrendingUp,
  Award,
  Briefcase,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface MatchmakerProfile {
  id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  profile_image_url: string;
  city: string;
  state: string;
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
  reviews: Array<{
    id: string;
    rating: number;
    review_text: string;
    is_verified_client: boolean;
    created_at: string;
    reviewer: {
      display_name: string;
      first_name: string;
      profile_image_url: string;
    };
  }>;
}

interface MatchmakerProfilePageProps {
  matchmakerId: string;
}

export function MatchmakerProfilePage({ matchmakerId }: MatchmakerProfilePageProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<MatchmakerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hiring, setHiring] = useState(false);
  const [hasRelationship, setHasRelationship] = useState(false);

  useEffect(() => {
    fetchProfile();
    checkRelationship();
  }, [matchmakerId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/matchmakers/${matchmakerId}`);
      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkRelationship = async () => {
    try {
      const response = await fetch("/api/users/me/matchmaker");
      const data = await response.json();

      if (data.success && data.data?.matchmaker_id === matchmakerId) {
        setHasRelationship(true);
      }
    } catch (err) {
      console.error("Failed to check relationship:", err);
    }
  };

  const handleHire = async () => {
    setHiring(true);

    try {
      const response = await fetch(`/api/matchmakers/${matchmakerId}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        setHasRelationship(true);
        // TODO: Show success message/toast
      } else {
        alert(data.msg || "Failed to hire matchmaker");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setHiring(false);
    }
  };

  const formatSpecialty = (specialty: string) => {
    return specialty
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Matchmaker not found</p>
        <Link
          href="/matchmakers"
          className="inline-block px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors"
        >
          Back to Matchmakers
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Back Button */}
        <Link
          href="/matchmakers"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Matchmakers
        </Link>

        {/* Profile Header */}
        <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Profile Image */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center overflow-hidden ring-4 ring-purple-100 dark:ring-purple-950/50">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {profile.first_name?.charAt(0) || "M"}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {profile.display_name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {profile.years_experience} years experience
                  </span>
                  {(profile.city || profile.state) && (
                    <span>
                      {profile.city && profile.state
                        ? `${profile.city}, ${profile.state}`
                        : profile.city || profile.state}
                    </span>
                  )}
                </div>

                {/* Rating */}
                {profile.stats.average_rating !== null && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(profile.stats.average_rating!)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300 dark:text-gray-700"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {profile.stats.average_rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({profile.stats.total_reviews} reviews)
                    </span>
                  </div>
                )}

                {/* Bio */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-px bg-border/40">
            <div className="bg-card p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Heart className="w-4 h-4 text-pink-500" />
                <p className="text-xs text-muted-foreground">Total Introductions</p>
              </div>
              <p className="text-xl font-bold text-foreground">
                {profile.stats.total_introductions}
              </p>
            </div>
            <div className="bg-card p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
              <p className="text-xl font-bold text-foreground">
                {profile.stats.success_rate}%
              </p>
            </div>
            <div className="bg-card p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground">Active Clients</p>
              </div>
              <p className="text-xl font-bold text-foreground">
                {profile.stats.active_clients}
              </p>
            </div>
          </div>
        </div>

        {/* Specialties */}
        {profile.specialties.length > 0 && (
          <div className="bg-card rounded-xl border border-border/40 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Specialties
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="px-3 py-1.5 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full"
                >
                  {formatSpecialty(specialty)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {profile.certifications.length > 0 && (
          <div className="bg-card rounded-xl border border-border/40 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Certifications
            </h2>
            <ul className="space-y-2">
              {profile.certifications.map((cert, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {cert}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-card rounded-xl border border-border/40 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Reviews
          </h2>

          {profile.reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No reviews yet
            </p>
          ) : (
            <div className="space-y-4">
              {profile.reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-border/40 last:border-0 pb-4 last:pb-0"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center overflow-hidden">
                      {review.reviewer.profile_image_url ? (
                        <img
                          src={review.reviewer.profile_image_url}
                          alt={review.reviewer.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                          {review.reviewer.first_name?.charAt(0) || "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {review.reviewer.display_name}
                        </p>
                        {review.is_verified_client && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                            Verified Client
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300 dark:text-gray-700"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-muted-foreground ml-13">
                      {review.review_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hire Button */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/40 p-4 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="max-w-4xl mx-auto">
            {hasRelationship ? (
              <div className="flex items-center justify-center gap-2 py-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-300 rounded-xl">
                <Users className="w-5 h-5" />
                <span className="font-medium">You're working with this matchmaker</span>
              </div>
            ) : (
              <button
                onClick={handleHire}
                disabled={hiring}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
              >
                {hiring ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Hiring...
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5" />
                    Hire This Matchmaker
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
