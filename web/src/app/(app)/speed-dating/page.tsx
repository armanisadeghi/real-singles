"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, Users, Video, ArrowLeft, Loader2 } from "lucide-react";

interface SpeedDatingSession {
  ID: string;
  SessionID?: string;
  Title: string;
  Description?: string | null;
  Image?: string | null;
  ScheduledDateTime: string;
  DurationMinutes?: number | null;
  RoundDurationSeconds?: number | null;
  MaxParticipants?: number | null;
  RegistrationCount?: number;
  Status: string;
}

type FilterStatus = "upcoming" | "past";

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function SpeedDatingPage() {
  const [sessions, setSessions] = useState<SpeedDatingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("upcoming");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [filter]);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Map our filter to the API's status parameter
      const status = filter === "upcoming" ? "scheduled" : "completed";
      const res = await fetch(`/api/speed-dating?status=${status}&limit=50`);
      if (!res.ok) {
        throw new Error("Failed to fetch sessions");
      }
      const data = await res.json();
      if (data.success) {
        setSessions(data.data || []);
      } else {
        throw new Error(data.msg || "Failed to fetch sessions");
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Unable to load sessions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return { label: "Upcoming", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
      case "in_progress":
        return { label: "Live", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
      case "completed":
        return { label: "Completed", className: "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-400" };
      case "cancelled":
        return { label: "Cancelled", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-400" };
    }
  };

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-950">
      {/* Header with tabs */}
      <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-14 sm:top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/explore"
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 flex items-center justify-center transition-colors"
                aria-label="Back to Explore"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Virtual Speed Dating</h1>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 ml-12 sm:ml-0">
              <button
                onClick={() => setFilter("upcoming")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === "upcoming"
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter("past")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === "past"
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700"
                }`}
              >
                Past
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* How it works banner - only show for upcoming */}
        {filter === "upcoming" && !isLoading && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl p-6 mb-8">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">How It Works</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Register</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sign up for an upcoming session
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center shrink-0">
                  <span className="text-pink-600 dark:text-pink-400 font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Meet</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Have quick video dates with multiple people
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
                  <span className="text-rose-600 dark:text-rose-400 font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Match</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Connect with mutual interests after the session
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden animate-pulse"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-48 h-32 sm:h-auto bg-gray-200 dark:bg-neutral-800" />
                  <div className="flex-1 p-4 space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-neutral-800 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-full" />
                    <div className="flex gap-4">
                      <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded w-24" />
                      <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded w-20" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchSessions}
              className="px-4 py-2 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-gray-50 dark:bg-neutral-900 rounded-xl p-8 text-center">
            <Video className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {filter === "upcoming" ? "No sessions scheduled right now" : "No past sessions"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
              {filter === "upcoming"
                ? "We host virtual speed dating sessions regularly. Check back soon or enable notifications to be the first to know when a new session is scheduled!"
                : "Past sessions will appear here after they're completed."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const statusBadge = getStatusBadge(session.Status);
              const sessionId = session.ID || session.SessionID;
              const roundDurationMinutes = session.RoundDurationSeconds 
                ? Math.floor(session.RoundDurationSeconds / 60) 
                : 5;

              return (
                <Link
                  key={sessionId}
                  href={`/speed-dating/${sessionId}`}
                  className="block bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="sm:w-48 h-32 sm:h-auto bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shrink-0">
                      {session.Image ? (
                        <img
                          src={session.Image}
                          alt={session.Title || "Speed dating session"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Video className="w-12 h-12 text-white/80" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {session.Title}
                          </h3>
                          {session.Description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {session.Description}
                            </p>
                          )}
                        </div>
                        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          {formatDate(session.ScheduledDateTime)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          {formatTime(session.ScheduledDateTime)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          {session.RegistrationCount || 0}/{session.MaxParticipants || 20} registered
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {roundDurationMinutes} min per date • {session.DurationMinutes || 60} min total
                        </div>
                        <span className="text-pink-600 dark:text-pink-400 font-medium text-sm">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
