"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { Avatar } from "@/components/ui";

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
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRsvpLoading, setIsRsvpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    
    try {
      const isCurrentlyRegistered = event.isMarkInterested === 1;
      const method = isCurrentlyRegistered ? "DELETE" : "POST";
      
      const res = await fetch(`/api/events/${event.EventID}/register`, { method });
      const data = await res.json();
      
      if (data.success) {
        // Update local state
        setEvent(prev => prev ? {
          ...prev,
          isMarkInterested: isCurrentlyRegistered ? 0 : 1,
          CurrentAttendees: isCurrentlyRegistered 
            ? Math.max(0, prev.CurrentAttendees - 1)
            : prev.CurrentAttendees + 1,
        } : null);
      } else {
        alert(data.msg || "Failed to update RSVP");
      }
    } catch (err) {
      console.error("Error updating RSVP:", err);
      alert("Failed to update RSVP. Please try again.");
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
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleAddToCalendar = () => {
    if (!event) return;

    // Create ICS file content
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
    
    // Use Google Maps URL (works on all platforms)
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
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-4">{error || "Event not found"}</p>
        <Link
          href="/events"
          className="px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  const isRegistered = event.isMarkInterested === 1;
  const location = [event.City, event.State].filter(Boolean).join(", ");
  const fullAddress = [event.VenueName, event.Street, location].filter(Boolean).join(", ");
  const registeredUsers = event.interestedUsers?.filter(u => u.status === "registered") || [];

  return (
    <div className="min-h-dvh bg-gray-50 pb-24">
      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-primary/30 to-purple-200">
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
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            title="Share"
          >
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleAddToCalendar}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            title="Add to Calendar"
          >
            <CalendarPlus className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        {/* Main card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {/* Title and RSVP */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {event.EventName}
              </h1>
              {event.HostedBy && (
                <p className="text-sm text-gray-500">
                  Hosted by {event.HostedBy}
                </p>
              )}
            </div>
            
            <button
              onClick={handleRsvp}
              disabled={isRsvpLoading || event.Status === "cancelled"}
              className={`flex-shrink-0 px-6 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 ${
                isRegistered
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-primary text-white hover:bg-primary/90"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRsvpLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {isRegistered ? "Cancel RSVP" : "RSVP"}
            </button>
          </div>

          {/* Event info */}
          <div className="grid gap-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {formatDate(event.EventDate)}
                </p>
                <p className="text-sm text-gray-500">
                  {event.StartTime}
                  {event.EndTime && ` - ${event.EndTime}`}
                </p>
              </div>
            </div>

            {fullAddress && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{event.VenueName || location}</p>
                  {event.Street && (
                    <p className="text-sm text-gray-500">{event.Street}</p>
                  )}
                  {event.VenueName && location && (
                    <p className="text-sm text-gray-500">{location}</p>
                  )}
                  <button
                    onClick={openInMaps}
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    Open in Maps
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {event.CurrentAttendees} attending
                </p>
                {event.MaxAttendees && (
                  <p className="text-sm text-gray-500">
                    {event.MaxAttendees - event.CurrentAttendees} spots left
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {event.Description && (
            <div className="border-t pt-6">
              <h2 className="font-semibold text-gray-900 mb-3">About this event</h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {event.Description}
              </p>
            </div>
          )}
        </div>

        {/* Attendees */}
        {registeredUsers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Who's going ({registeredUsers.length})
            </h2>
            <div className="flex flex-wrap gap-3">
              {registeredUsers.slice(0, 12).map((user) => (
                <Link
                  key={user.user_id}
                  href={`/profile/${user.user_id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Avatar
                    src={user.profile_image_url}
                    name={user.display_name}
                    size="sm"
                  />
                  <span className="text-sm text-gray-700">
                    {user.display_name}
                  </span>
                </Link>
              ))}
              {registeredUsers.length > 12 && (
                <div className="flex items-center px-3 text-sm text-gray-500">
                  +{registeredUsers.length - 12} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
