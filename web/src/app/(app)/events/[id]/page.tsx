"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  Share2,
  CalendarPlus,
  Loader2,
  ExternalLink,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EventDetail {
  EventID: string;
  EventName: string;
  EventDate: string;
  StartTime: string;
  EndTime?: string;
  Description?: string;
  Street?: string;
  VenueName?: string;
  City?: string;
  State?: string;
  EventImage?: string;
  Latitude?: string;
  Longitude?: string;
  MaxAttendees?: number;
  CurrentAttendees: number;
  EventType: string;
  Status: string;
  isMarkInterested: number;
  interestedUsers?: Array<{
    user_id: string;
    display_name: string;
    profile_image_url?: string;
    status: string;
  }>;
  HostedBy?: string;
  AgeMin?: number;
  AgeMax?: number;
  Price?: string;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRsvpLoading, setIsRsvpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Handle payment callback from Stripe
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      setMessage({ type: "success", text: "Payment successful! You are now registered for this event." });
      // Clean URL
      window.history.replaceState({}, "", `/events/${resolvedParams.id}`);
    } else if (paymentStatus === "canceled") {
      setMessage({ type: "error", text: "Payment was canceled. You can try again." });
      window.history.replaceState({}, "", `/events/${resolvedParams.id}`);
    }
  }, [searchParams, resolvedParams.id]);

  useEffect(() => {
    fetchEvent();
  }, [resolvedParams.id]);

  const fetchEvent = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${resolvedParams.id}`);
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

  const handleRsvp = async () => {
    if (!event) return;
    setIsRsvpLoading(true);
    setMessage(null);
    
    try {
      const isCurrentlyRegistered = event.isMarkInterested === 1;
      const method = isCurrentlyRegistered ? "DELETE" : "POST";
      
      const res = await fetch(`/api/events/${event.EventID}/register`, { method });
      const data = await res.json();
      
      if (data.success) {
        // Check if payment is required (paid event)
        if (data.status === "requires_payment" && data.data?.checkoutUrl) {
          // Redirect to Stripe Checkout
          window.location.href = data.data.checkoutUrl;
          return;
        }

        // Free event - update local state
        setEvent(prev => prev ? {
          ...prev,
          isMarkInterested: isCurrentlyRegistered ? 0 : 1,
          CurrentAttendees: isCurrentlyRegistered 
            ? Math.max(0, prev.CurrentAttendees - 1)
            : prev.CurrentAttendees + 1,
        } : null);
      } else {
        setMessage({ type: "error", text: data.msg || "Failed to update RSVP" });
      }
    } catch (err) {
      console.error("Error updating RSVP:", err);
      setMessage({ type: "error", text: "Failed to update RSVP. Please try again." });
    } finally {
      setIsRsvpLoading(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    
    const shareData = {
      title: event.EventName,
      text: `Check out this event: ${event.EventName}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setMessage({ type: "success", text: "Link copied to clipboard!" });
    }
  };

  const handleAddToCalendar = () => {
    if (!event) return;

    const formatDateForICS = (dateStr: string, timeStr?: string) => {
      const date = new Date(dateStr);
      if (timeStr) {
        const [time, period] = timeStr.split(" ");
        const [hours, minutes] = time.split(":");
        let hour = parseInt(hours);
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;
        date.setHours(hour, parseInt(minutes));
      }
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const startDate = formatDateForICS(event.EventDate, event.StartTime);
    const endDate = event.EndTime 
      ? formatDateForICS(event.EventDate, event.EndTime)
      : formatDateForICS(event.EventDate, event.StartTime);

    const location = [event.VenueName, event.Street, event.City, event.State]
      .filter(Boolean)
      .join(", ");

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//RealSingles//Event//EN
BEGIN:VEVENT
UID:${event.EventID}@realsingles.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.EventName}
DESCRIPTION:${event.Description?.replace(/\n/g, "\\n") || ""}
LOCATION:${location}
URL:${window.location.href}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.EventName.replace(/[^a-z0-9]/gi, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openInMaps = () => {
    if (!event) return;
    
    const address = [event.Street, event.City, event.State].filter(Boolean).join(", ");
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const formatDate = (dateStr: string) => {
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
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-dvh bg-gray-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error || "Event not found"}</p>
        <Link
          href="/events"
          className="px-4 py-2 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  const isRegistered = event.isMarkInterested === 1;
  const location = [event.City, event.State].filter(Boolean).join(", ");
  const fullAddress = [event.VenueName, event.Street, location].filter(Boolean).join(", ");
  const eventPrice = event.Price ? parseFloat(event.Price) : 0;
  const isPaidEvent = eventPrice > 0;

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-950 pb-24">
      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-amber-100 dark:from-amber-900/30 to-purple-100 dark:to-purple-900/30">
        {event.EventImage && (
          <img
            src={event.EventImage}
            alt={event.EventName}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-neutral-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-neutral-700 transition-colors"
            title="Share"
          >
            <Share2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={handleAddToCalendar}
            className="w-10 h-10 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-neutral-700 transition-colors"
            title="Add to Calendar"
          >
            <CalendarPlus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Price badge on hero */}
        {isPaidEvent && (
          <div className="absolute bottom-4 right-4 px-4 py-2 bg-white/95 dark:bg-neutral-800/95 backdrop-blur rounded-full shadow-sm">
            <span className="font-bold text-green-600 dark:text-green-400 text-lg">
              ${eventPrice.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Message Banner */}
      {message && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-4">
          <div
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl",
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
            )}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="flex-1 text-sm">{message.text}</p>
            <button
              onClick={() => setMessage(null)}
              className="text-current opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        {message && <div className="h-4" />}
        
        {/* Main card */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-black/20 p-6 mb-6">
          {/* Title and RSVP */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {event.EventName}
              </h1>
              {event.HostedBy && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hosted by {event.HostedBy}
                </p>
              )}
            </div>
            
            {/* RSVP Button */}
            <button
              onClick={handleRsvp}
              disabled={isRsvpLoading || event.Status === "cancelled"}
              className={cn(
                "flex-shrink-0 px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isRegistered
                  ? "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                  : isPaidEvent
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-pink-500 text-white hover:bg-pink-600"
              )}
            >
              {isRsvpLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPaidEvent && !isRegistered ? (
                <DollarSign className="w-4 h-4" />
              ) : null}
              {isRegistered
                ? "Cancel RSVP"
                : isPaidEvent
                  ? `RSVP — $${eventPrice.toFixed(2)}`
                  : "RSVP"}
            </button>
          </div>

          {/* Event info */}
          <div className="grid gap-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(event.EventDate)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {event.StartTime}
                  {event.EndTime && ` - ${event.EndTime}`}
                </p>
              </div>
            </div>

            {fullAddress && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{event.VenueName || location}</p>
                  {event.Street && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{event.Street}</p>
                  )}
                  {event.VenueName && location && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{location}</p>
                  )}
                  <button
                    onClick={openInMaps}
                    className="text-sm text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 mt-1"
                  >
                    Open in Maps
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {event.CurrentAttendees} attending
                </p>
                {event.MaxAttendees && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {event.MaxAttendees - event.CurrentAttendees} spots left
                  </p>
                )}
              </div>
            </div>

            {(event.AgeMin || event.AgeMax) && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Age Range</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {event.AgeMin && event.AgeMax
                      ? `${event.AgeMin}-${event.AgeMax} years`
                      : event.AgeMin
                      ? `${event.AgeMin}+ years`
                      : `Up to ${event.AgeMax} years`}
                  </p>
                </div>
              </div>
            )}

            {isPaidEvent && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Ticket Price</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ${eventPrice.toFixed(2)} per person
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.Description && (
            <div className="border-t border-gray-200 dark:border-neutral-700 pt-6">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">About this event</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {event.Description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
