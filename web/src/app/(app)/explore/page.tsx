"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Video,
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { EmptyState } from "@/components/ui";

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

interface ExploreData {
  success: boolean;
  event: ApiEvent[];
  Virtual: ApiSpeedDating[];
  baseImageUrl: string;
  msg: string;
}

// ============================================================================
// SECTION HEADER COMPONENT
// ============================================================================

function SectionHeader({
  title,
  subtitle,
  href,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <Link
        href={href}
        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
      >
        View All
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
      className="group flex-shrink-0 w-[320px] bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-border hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
        {event.EventImage ? (
          <img
            src={event.EventImage}
            alt={event.EventName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-16 h-16 text-amber-200" />
          </div>
        )}
        {/* Price badge */}
        {event.EventPrice && (
          <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-sm font-semibold text-foreground shadow-sm">
            {event.EventPrice === "0" || event.EventPrice === "Free"
              ? "Free"
              : `$${event.EventPrice}`}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {event.EventName}
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
          {event.Description}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {formatDate(event.EventDate)}
          </span>
          {event.City && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
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

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "live":
        return "bg-green-500 text-white";
      case "upcoming":
        return "bg-blue-500 text-white";
      case "full":
        return "bg-amber-500 text-white";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <Link
      href={`/speed-dating/${session.ID}`}
      className="group flex-shrink-0 w-[320px] bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-border hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-violet-100 to-pink-50">
        {session.Image ? (
          <img
            src={session.Image}
            alt={session.Title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-16 h-16 text-violet-200" />
          </div>
        )}
        {/* Status badge */}
        {session.Status && (
          <div
            className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(session.Status)}`}
          >
            {session.Status}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {session.Title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
          {session.Description}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {formatDate(session.ScheduledDate)}
          </span>
          {session.ScheduledTime && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {session.ScheduledTime}
            </span>
          )}
          {session.MaxParticipants && (
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {session.MaxParticipants} spots
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

function ComingSoonSection({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="relative rounded-2xl border border-dashed border-border bg-gradient-to-br from-muted/30 to-muted/10 p-8 sm:p-12">
      <div className="absolute top-4 right-4 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />
        Coming Soon
      </div>

      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5">
          <Icon className="w-8 h-8 text-primary/60" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE SECTION COMPONENT
// ============================================================================

function EmptySection({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ExplorePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [exploreData, setExploreData] = useState<ExploreData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const exploreRes = await fetch("/api/discover");
      if (!exploreRes.ok) {
        if (exploreRes.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch explore data");
      }
      const data = await exploreRes.json();
      setExploreData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Unable to load explore data");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading experiences...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center">
          <EmptyState
            title="Unable to load content"
            description="Please refresh the page or try again later."
          />
          <button
            onClick={() => {
              setIsLoading(true);
              fetchData();
            }}
            className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const events = exploreData?.event || [];
  const speedDating = exploreData?.Virtual || [];

  return (
    <div className="min-h-dvh bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Explore
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Discover events, virtual speed dating, and more ways to connect.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-12">
        {/* Events Section */}
        <section>
          <SectionHeader
            title="Events"
            subtitle="Meet singles at curated in-person events"
            href="/events"
            icon={Calendar}
          />

          {events.length > 0 ? (
            <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {events.slice(0, 10).map((event) => (
                <EventCard key={event.EventID} event={event} />
              ))}
            </div>
          ) : (
            <EmptySection
              title="No upcoming events"
              description="Check back soon for new events in your area."
              icon={Calendar}
            />
          )}
        </section>

        {/* Virtual Speed Dating Section */}
        <section>
          <SectionHeader
            title="Virtual Speed Dating"
            subtitle="Quick video dates from the comfort of home"
            href="/speed-dating"
            icon={Video}
          />

          {speedDating.length > 0 ? (
            <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {speedDating.slice(0, 10).map((session) => (
                <SpeedDatingCard key={session.ID} session={session} />
              ))}
            </div>
          ) : (
            <EmptySection
              title="No sessions scheduled"
              description="New speed dating sessions are added regularly."
              icon={Video}
            />
          )}
        </section>

        {/* Videos Section - Coming Soon */}
        <section>
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Videos</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Expert dating tips and relationship advice
              </p>
            </div>
          </div>

          <ComingSoonSection
            title="Video Content"
            description="We're preparing exclusive video content from dating experts, relationship coaches, and success stories. Stay tuned for tips that will help you make meaningful connections."
            icon={Video}
          />
        </section>
      </div>
    </div>
  );
}
