"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Video,
  MapPin,
  Check,
  Info,
} from "lucide-react";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface SpeedDatingSession {
  id: string;
  name: string;
  description?: string | null;
  session_date: string;
  start_time: string;
  end_time?: string | null;
  duration_minutes: number;
  round_duration_minutes: number;
  max_participants: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  event_type: "in_person" | "virtual";
  city?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  image_url?: string | null;
  min_age?: number | null;
  max_age?: number | null;
  gender_preference?: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

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

export default function SpeedDatingDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const toast = useToast();
  const [session, setSession] = useState<SpeedDatingSession | null>(null);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registering, setRegistering] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/speed-dating/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setRegistrationCount(data.registration_count || 0);
        setIsRegistered(data.is_registered || false);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const res = await fetch(`/api/speed-dating/${id}/register`, {
        method: "POST",
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setIsRegistered(true);
        setRegistrationCount((prev) => prev + 1);
        setShowConfirm(false);
        toast.success("You're registered! We'll send you a reminder before the session.");
      } else {
        toast.error(data.msg || "Failed to register for this session");
      }
    } catch (error) {
      console.error("Error registering:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Skeleton className="h-6 w-32 mb-6" />
        <Skeleton className="aspect-video w-full rounded-xl mb-6" />
        <Skeleton className="h-8 w-2/3 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Session Not Found
        </h1>
        <Link
          href="/speed-dating"
          className="text-pink-600 hover:text-pink-700 font-medium"
        >
          Back to Speed Dating
        </Link>
      </div>
    );
  }

  const isFull = registrationCount >= session.max_participants;
  const canRegister =
    session.status === "upcoming" && !isRegistered && !isFull;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back button */}
      <Link
        href="/speed-dating"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Speed Dating
      </Link>

      {/* Image */}
      <div className="aspect-video rounded-xl overflow-hidden mb-6">
        {session.image_url ? (
          <img
            src={session.image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
            <Video className="w-20 h-20 text-white/80" />
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
        <span
          className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium ${
            session.status === "upcoming"
              ? "bg-green-100 text-green-700"
              : session.status === "ongoing"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {session.status}
        </span>
      </div>

      {/* Description */}
      {session.description && (
        <p className="text-gray-600 mb-6">{session.description}</p>
      )}

      {/* Details grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <Calendar className="w-5 h-5 text-pink-500" />
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium text-gray-900">
              {formatDate(session.session_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <Clock className="w-5 h-5 text-pink-500" />
          <div>
            <p className="text-sm text-gray-500">Time</p>
            <p className="font-medium text-gray-900">
              {formatTime(session.start_time)}
              {session.end_time && ` - ${formatTime(session.end_time)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <Users className="w-5 h-5 text-pink-500" />
          <div>
            <p className="text-sm text-gray-500">Participants</p>
            <p className="font-medium text-gray-900">
              {registrationCount}/{session.max_participants} registered
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <Video className="w-5 h-5 text-pink-500" />
          <div>
            <p className="text-sm text-gray-500">Format</p>
            <p className="font-medium text-gray-900">
              {session.round_duration_minutes} min per date
            </p>
          </div>
        </div>

        {session.city && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl sm:col-span-2">
            <MapPin className="w-5 h-5 text-pink-500" />
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium text-gray-900">
                {session.venue_name
                  ? `${session.venue_name}, ${session.city}`
                  : session.city}
              </p>
              {session.venue_address && (
                <p className="text-sm text-gray-500">{session.venue_address}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Age/Gender preferences */}
      {(session.min_age || session.max_age || session.gender_preference) && (
        <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl mb-6">
          <Info className="w-5 h-5 text-purple-500 mt-0.5" />
          <div>
            <p className="font-medium text-purple-900">Preferences</p>
            <p className="text-sm text-purple-700">
              {session.min_age && session.max_age
                ? `Ages ${session.min_age}-${session.max_age}`
                : session.min_age
                ? `Ages ${session.min_age}+`
                : session.max_age
                ? `Ages up to ${session.max_age}`
                : ""}
              {session.gender_preference &&
                ` • Looking for ${session.gender_preference}`}
            </p>
          </div>
        </div>
      )}

      {/* Registration status */}
      {isRegistered && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">You're registered!</p>
            <p className="text-sm text-green-600">
              We'll send you a reminder before the session starts.
            </p>
          </div>
        </div>
      )}

      {/* Register button */}
      <button
        onClick={() => setShowConfirm(true)}
        disabled={!canRegister}
        className={cn(
          "w-full py-3 rounded-xl font-semibold text-lg transition-all",
          canRegister
            ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-xl active:scale-[0.98]"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        )}
      >
        {isRegistered
          ? "Already Registered"
          : isFull
          ? "Session Full"
          : session.status !== "upcoming"
          ? "Registration Closed"
          : "Register Now"}
      </button>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleRegister}
        title="Register for Speed Dating"
        message={`Ready to join "${session.name}" on ${formatDate(session.session_date)} at ${formatTime(session.start_time)}?`}
        confirmLabel="Register"
        variant="success"
        loading={registering}
      />
    </div>
  );
}
