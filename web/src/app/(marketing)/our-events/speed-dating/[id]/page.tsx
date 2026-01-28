"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Video,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";
import { QuickSignUpModal } from "@/components/auth/QuickSignUpModal";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PublicSpeedDating {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  round_duration_minutes: number;
  min_participants: number | null;
  max_participants: number | null;
  participant_count: number;
  spots_available: number | null;
  is_full: boolean;
  status: string;
  gender_preference: string | null;
  age_min: number | null;
  age_max: number | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeStr: string) {
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEligibility(session: PublicSpeedDating): string | null {
  const parts: string[] = [];

  if (session.gender_preference && session.gender_preference !== "mixed") {
    parts.push(session.gender_preference.replace("_", " "));
  }

  if (session.age_min && session.age_max) {
    parts.push(`Ages ${session.age_min}-${session.age_max}`);
  } else if (session.age_min) {
    parts.push(`Ages ${session.age_min}+`);
  } else if (session.age_max) {
    parts.push(`Ages up to ${session.age_max}`);
  }

  return parts.length > 0 ? parts.join(" • ") : null;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function PublicSpeedDatingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<PublicSpeedDating | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/speed-dating/${id}`);
      if (!res.ok) {
        throw new Error("Session not found");
      }
      const data = await res.json();
      if (data.success) {
        setSession(data.data);
      } else {
        throw new Error(data.msg || "Failed to fetch session");
      }
    } catch (err) {
      console.error("Error fetching session:", err);
      setError("Unable to load session details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegisterClick = () => {
    setShowSignUpModal(true);
  };

  const handleSignUpSuccess = () => {
    // Redirect to authenticated speed dating page after successful signup
    router.push(`/speed-dating/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center p-4">
        <Sparkles className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">{error || "Session not found"}</p>
        <Link
          href="/our-events"
          className="px-4 py-2 bg-brand-primary text-white rounded-full font-medium hover:bg-brand-primary-dark transition-colors"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  const canRegister = session.status === "scheduled" && !session.is_full;
  const eligibility = formatEligibility(session);

  return (
    <>
      <div className="min-h-dvh bg-gray-50 pb-24">
        {/* Hero Image */}
        <div className="relative h-64 sm:h-80 bg-gradient-to-br from-purple-400 to-pink-500">
          {session.image_url ? (
            <Image
              src={session.image_url}
              alt={session.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Video className="w-24 h-24 text-white/30" />
            </div>
          )}
          
          {/* Back button */}
          <Link
            href="/our-events"
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>

          {/* Status badge */}
          <div className="absolute bottom-4 left-4">
            {session.is_full ? (
              <span className="bg-gray-900/80 text-white text-sm px-3 py-1.5 rounded-full">
                Session Full
              </span>
            ) : session.spots_available !== null ? (
              <span className="bg-green-600/90 text-white text-sm px-3 py-1.5 rounded-full">
                {session.spots_available} spots left
              </span>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
          {/* Main card */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
              <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                <Video className="w-4 h-4" />
                Virtual
              </span>
            </div>

            {/* Description */}
            {session.description && (
              <p className="text-gray-600 mb-6">{session.description}</p>
            )}

            {/* Details grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(session.date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium text-gray-900">
                    {formatTime(session.start_time)}
                    {session.end_time && ` - ${formatTime(session.end_time)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Participants</p>
                  <p className="font-medium text-gray-900">
                    {session.participant_count}
                    {session.max_participants && `/${session.max_participants}`} registered
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Format</p>
                  <p className="font-medium text-gray-900">
                    {session.round_duration_minutes} min per date
                  </p>
                </div>
              </div>
            </div>

            {/* Duration info */}
            <div className="p-4 bg-purple-50 rounded-xl mb-6">
              <div className="flex items-center gap-2 text-purple-800 font-medium mb-1">
                <Sparkles className="w-4 h-4" />
                About Speed Dating
              </div>
              <p className="text-sm text-purple-700">
                You'll have {session.round_duration_minutes} minutes to chat with each match via video. 
                The total session lasts approximately {session.duration_minutes} minutes. 
                After the event, you can see who you matched with!
              </p>
            </div>

            {/* Eligibility preferences */}
            {eligibility && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl mb-6">
                <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-900">Eligibility</p>
                  <p className="text-sm text-amber-700">{eligibility}</p>
                </div>
              </div>
            )}
          </div>

          {/* Register button */}
          <button
            onClick={handleRegisterClick}
            disabled={!canRegister}
            className={`w-full py-3.5 rounded-xl font-semibold text-lg transition-all ${
              canRegister
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-xl active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {session.is_full
              ? "Session Full"
              : session.status !== "scheduled"
              ? "Registration Closed"
              : "Sign Up & Register"}
          </button>

          {/* Sign up prompt */}
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">
              Ready to find your match?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Create a free account to register for speed dating sessions and start connecting with real singles.
            </p>
            <p className="text-xs text-gray-500">
              Already have an account?{" "}
              <Link href={`/login?returnUrl=/speed-dating/${session.id}`} className="text-brand-primary hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Sign Up Modal */}
      <QuickSignUpModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        speedDatingId={session?.id}
        speedDatingTitle={session?.title}
        onSuccess={handleSignUpSuccess}
      />
    </>
  );
}
