"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  Share2,
  Loader2,
  CalendarHeart,
} from "lucide-react";
import { QuickSignUpModal } from "@/components/auth/QuickSignUpModal";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PublicEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  image_url: string;
  venue_name: string;
  city: string;
  state: string;
  date: string;
  start_time: string;
  end_time: string;
  start_datetime: string;
  end_datetime: string | null;
  max_attendees: number | null;
  attendee_count: number;
  is_full: boolean;
  spots_remaining: number | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function PublicEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [resolvedParams.id]);

  const fetchEvent = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/public/events/${resolvedParams.id}`);
      if (!res.ok) {
        throw new Error("Event not found");
      }
      const data = await res.json();
      if (data.success) {
        setEvent(data.data);
      } else {
        throw new Error(data.msg || "Failed to fetch event");
      }
    } catch (err) {
      console.error("Error fetching event:", err);
      setError("Unable to load event details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    
    const shareData = {
      title: event.title,
      text: `Check out this event: ${event.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleRsvpClick = () => {
    setShowSignUpModal(true);
  };

  const handleSignUpSuccess = () => {
    // Redirect to authenticated event page after successful signup
    router.push(`/events/${resolvedParams.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center p-4">
        <CalendarHeart className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">{error || "Event not found"}</p>
        <Link
          href="/our-events"
          className="px-4 py-2 bg-brand-primary text-white rounded-full font-medium hover:bg-brand-primary-dark transition-colors"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  const location = [event.city, event.state].filter(Boolean).join(", ");

  return (
    <>
      <div className="min-h-dvh bg-gray-50 pb-24">
        {/* Hero Image */}
        <div className="relative h-64 sm:h-80 bg-gradient-to-br from-brand-primary/30 to-purple-200">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <CalendarHeart className="w-24 h-24 text-white/30" />
            </div>
          )}
          
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Share button */}
          <div className="absolute top-4 right-4">
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Status badge */}
          {event.is_full && (
            <div className="absolute bottom-4 left-4">
              <span className="bg-gray-900/80 text-white text-sm px-3 py-1.5 rounded-full">
                Event Full
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
          {/* Main card */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            {/* Title and RSVP */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {event.title}
                </h1>
                {event.event_type && (
                  <span className="inline-block text-xs font-medium text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-full capitalize">
                    {event.event_type.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              
              <button
                onClick={handleRsvpClick}
                disabled={event.is_full}
                className="flex-shrink-0 px-6 py-2.5 rounded-full font-medium transition-all bg-brand-primary text-white hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {event.is_full ? "Event Full" : "RSVP Now"}
              </button>
            </div>

            {/* Event info */}
            <div className="grid gap-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(event.date)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {event.start_time}
                    {event.end_time && ` - ${event.end_time}`}
                  </p>
                </div>
              </div>

              {(event.venue_name || location) && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div>
                    {event.venue_name && (
                      <p className="font-medium text-gray-900">{event.venue_name}</p>
                    )}
                    {location && (
                      <p className="text-sm text-gray-500">{location}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {event.attendee_count} attending
                  </p>
                  {event.spots_remaining !== null && event.spots_remaining > 0 && (
                    <p className="text-sm text-gray-500">
                      {event.spots_remaining} spots left
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="border-t pt-6">
                <h2 className="font-semibold text-gray-900 mb-3">About this event</h2>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* Sign up prompt */}
          <div className="bg-brand-primary/5 rounded-xl p-6 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">
              Want to attend this event?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Create a free account to RSVP and connect with other attendees.
            </p>
            <button
              onClick={handleRsvpClick}
              disabled={event.is_full}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-full font-medium hover:bg-brand-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {event.is_full ? "Event is Full" : "Sign Up & RSVP"}
            </button>
            <p className="text-xs text-gray-500 mt-3">
              Already have an account?{" "}
              <Link href={`/login?returnUrl=/events/${event.id}`} className="text-brand-primary hover:underline">
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
        eventId={event?.id}
        eventTitle={event?.title}
        onSuccess={handleSignUpSuccess}
      />
    </>
  );
}
