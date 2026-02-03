"use client";

import Link from "next/link";
import {
  Video,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Sparkles,
  Gift,
  UserPlus,
} from "lucide-react";
import { useEvents, useSpeedDating } from "@/hooks/queries";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Event data as returned from the API */
interface ApiEvent {
  EventID: string;
  EventName: string;
  EventDate: string;
  EventPrice: string;
  StartTime: string;
  EndTime: string;
  Description: string;
  Street: string;
  City: string;
  State: string;
  EventImage: string | null;
  HostedBy: string;
}

/** Speed dating session data as returned from the API */
interface ApiSpeedDating {
  ID: string;
  Title: string;
  Description: string;
  Image: string;
  ScheduledDate: string;
  ScheduledTime: string;
  Duration: number | null;
  MaxParticipants: number | null;
  Status: string | null;
}

// ============================================================================
// SECTION HEADER COMPONENT
// ============================================================================

function SectionHeader({
  title,
  href,
  icon: Icon,
}: {
  title: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors whitespace-nowrap"
      >
        View All
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ============================================================================
// EVENT CARD COMPONENT
// ============================================================================

function EventCard({ event }: { event: ApiEvent }) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Link
      href={`/events/${event.EventID}`}
      className="group flex-shrink-0 w-[280px] sm:w-[300px] bg-card rounded-2xl border border-border/40 overflow-hidden hover:border-border/80 hover:shadow-md transition-all duration-300"
    >
      {/* Image */}
      <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        {event.EventImage ? (
          <img
            src={event.EventImage}
            alt={event.EventName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-12 h-12 text-amber-200 dark:text-amber-800" />
          </div>
        )}
        {/* Price badge */}
        {event.EventPrice && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-full text-xs font-semibold text-foreground shadow-sm">
            {event.EventPrice === "0" || event.EventPrice === "Free"
              ? "Free"
              : `$${event.EventPrice}`}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
          {event.EventName}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {event.Description}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(event.EventDate)}
          </span>
          {event.City && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {event.City}, {event.State}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// SPEED DATING CARD COMPONENT
// ============================================================================

function SpeedDatingCard({ session }: { session: ApiSpeedDating }) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Format time to remove seconds (e.g., "4:47:00 PM" -> "4:47 PM")
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    // Handle HH:MM:SS format
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      const hours = parseInt(parts[0]);
      const minutes = parts[1];
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    }
    return timeStr;
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "live":
        return "bg-green-500 dark:bg-green-600 text-white";
      case "upcoming":
      case "scheduled":
        return "bg-blue-500 dark:bg-blue-600 text-white";
      case "full":
        return "bg-amber-500 dark:bg-amber-600 text-white";
      default:
        return "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "Upcoming";
      case "in_progress":
        return "Live";
      default:
        return status;
    }
  };

  return (
    <Link
      href={`/speed-dating/${session.ID}`}
      className="group flex-shrink-0 w-[280px] sm:w-[300px] bg-card rounded-2xl border border-border/40 overflow-hidden hover:border-border/80 hover:shadow-md transition-all duration-300"
    >
      {/* Image */}
      <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-violet-100 to-pink-50 dark:from-violet-950/30 dark:to-pink-950/30">
        {session.Image ? (
          <img
            src={session.Image}
            alt={session.Title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-12 h-12 text-violet-200 dark:text-violet-800" />
          </div>
        )}
        {/* Status badge */}
        {session.Status && (
          <div
            className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(session.Status)}`}
          >
            {getStatusLabel(session.Status)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
          {session.Title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {session.Description}
        </p>

        {/* Meta info - simplified to just date and time */}
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(session.ScheduledDate)}
          </span>
          {session.ScheduledTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {session.ScheduledTime}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// COMING SOON SECTION COMPONENT
// ============================================================================

function ComingSoonSection() {
  return (
    <div className="relative rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 sm:p-8">
      <div className="absolute top-3 right-3 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        Coming Soon
      </div>

      <div className="flex flex-col items-center text-center max-w-sm mx-auto pt-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 dark:from-amber-900/30 to-amber-50 dark:to-amber-950/20 flex items-center justify-center mb-4">
          <Video className="w-7 h-7 text-amber-400 dark:text-amber-500" />
        </div>
        <p className="text-muted-foreground text-sm">
          Expert dating tips and relationship advice videos coming soon.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE SECTION COMPONENT
// ============================================================================

function EmptySection({
  title,
  icon: Icon,
}: {
  title: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-6 text-center">
      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

// ============================================================================
// REFER FRIENDS BANNER COMPONENT
// ============================================================================

function ReferFriendsBanner() {
  return (
    <Link
      href="/refer"
      className="group block rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800 transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
          <Gift className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-foreground">
              Refer Friends, Earn Rewards
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Share RealSingles with friends and get exclusive rewards when they join. Everyone wins!
          </p>
        </div>

        {/* Arrow indicator */}
        <div className="flex-shrink-0">
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// SECTION LOADING SKELETON
// ============================================================================

function SectionSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex-shrink-0 w-[280px] sm:w-[300px] bg-card rounded-2xl border border-border/40 overflow-hidden animate-pulse"
        >
          <div className="aspect-[16/10] bg-gray-100 dark:bg-neutral-800" />
          <div className="p-4 space-y-3">
            <div className="h-5 w-3/4 bg-gray-100 dark:bg-neutral-800 rounded" />
            <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
            <div className="flex gap-3">
              <div className="h-3 w-20 bg-gray-100 dark:bg-neutral-800 rounded" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-neutral-800 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EVENTS SECTION WITH TANSTACK QUERY CACHING
// ============================================================================

function EventsSection() {
  const { data, isLoading, error } = useEvents({ limit: 10, status: "upcoming" });
  const events = data?.data || [];

  return (
    <section>
      <SectionHeader title="Events" href="/events" icon={Calendar} />

      {isLoading ? (
        <SectionSkeleton />
      ) : error ? (
        <EmptySection title="Unable to load events" icon={Calendar} />
      ) : events.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {events.map((event) => (
            <EventCard key={event.EventID} event={event} />
          ))}
        </div>
      ) : (
        <EmptySection title="No upcoming events" icon={Calendar} />
      )}
    </section>
  );
}

// ============================================================================
// SPEED DATING SECTION WITH TANSTACK QUERY CACHING
// ============================================================================

function SpeedDatingSection() {
  const { data, isLoading, error } = useSpeedDating({ limit: 10, status: "scheduled" });
  
  // Map API response to expected format
  const sessions: ApiSpeedDating[] = (data?.data || []).map((s) => ({
    ID: s.ID || s.SessionID,
    Title: s.Title,
    Description: s.Description || "",
    Image: s.Image || "",
    ScheduledDate: s.ScheduledDateTime ? s.ScheduledDateTime.split("T")[0] : "",
    // toLocaleTimeString already includes AM/PM, so no need for formatTime to add it again
    ScheduledTime: s.ScheduledDateTime 
      ? new Date(s.ScheduledDateTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : "",
    Duration: s.DurationMinutes,
    MaxParticipants: s.MaxParticipants,
    Status: s.Status,
  }));

  return (
    <section>
      <SectionHeader title="Virtual Speed Dating" href="/speed-dating" icon={Video} />

      {isLoading ? (
        <SectionSkeleton />
      ) : error ? (
        <EmptySection title="Unable to load sessions" icon={Video} />
      ) : sessions.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {sessions.map((session) => (
            <SpeedDatingCard key={session.ID} session={session} />
          ))}
        </div>
      ) : (
        <EmptySection title="No sessions scheduled" icon={Video} />
      )}
    </section>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ExplorePage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-8">
        {/* Events Section - Loads independently */}
        <EventsSection />

        {/* Speed Dating Section - Loads independently */}
        <SpeedDatingSection />

        {/* Refer Friends Banner */}
        <ReferFriendsBanner />

        {/* Videos Section - Coming Soon */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Video className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Videos</h2>
          </div>
          <ComingSoonSection />
        </section>
      </div>
    </div>
  );
}
