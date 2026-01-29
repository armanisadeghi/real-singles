import Image from "next/image";
import Link from "next/link";
import { CalendarHeart, MapPin, Clock, ArrowRight, Video, Users, Sparkles } from "lucide-react";
import { PageHero } from "@/components/marketing";

// Force dynamic rendering - this page fetches from API routes which aren't
// available during static build time
export const dynamic = "force-dynamic";

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
  max_attendees: number | null;
  attendee_count: number;
}

interface PublicSpeedDating {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  date: string;
  start_time: string;
  duration_minutes: number;
  round_duration_minutes: number;
  max_participants: number | null;
  participant_count: number;
  spots_available: number | null;
  is_full: boolean;
  gender_preference: string | null;
  age_min: number | null;
  age_max: number | null;
}

// ============================================================================
// DATA FETCHING - Using internal API routes (Server-side)
// ============================================================================

function getBaseUrl(): string {
  // For server-side rendering, we need an absolute URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Default to localhost for development
  return "http://localhost:3000";
}

async function getPublicEvents(): Promise<PublicEvent[]> {
  try {
    const baseUrl = getBaseUrl();
    
    const res = await fetch(`${baseUrl}/api/public/events?limit=12`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!res.ok) {
      console.error("Failed to fetch events:", res.status);
      return [];
    }

    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error fetching public events:", error);
    return [];
  }
}

async function getPublicSpeedDating(): Promise<PublicSpeedDating[]> {
  try {
    const baseUrl = getBaseUrl();
    
    const res = await fetch(`${baseUrl}/api/public/speed-dating?limit=12`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!res.ok) {
      console.error("Failed to fetch speed dating:", res.status);
      return [];
    }

    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error fetching public speed dating:", error);
    return [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
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

export default async function EventsPage() {
  const [events, speedDatingSessions] = await Promise.all([
    getPublicEvents(),
    getPublicSpeedDating(),
  ]);

  const hasEvents = events.length > 0;
  const hasSpeedDating = speedDatingSessions.length > 0;
  const hasAnyContent = hasEvents || hasSpeedDating;

  return (
    <>
      {/* Hero Section */}
      <PageHero
        title="Events"
        subtitle="Meet amazing singles at our in-person events and virtual speed dating sessions"
        backgroundImage="/images/marketing/hero/halloween-party.jpg"
      />

      {/* Speed Dating Section */}
      {hasSpeedDating && (
        <section className="bg-gradient-to-b from-brand-primary/5 to-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary/10">
                <Video className="w-5 h-5 text-brand-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Virtual Speed Dating
              </h2>
            </div>

            <p className="text-muted-foreground mb-8 max-w-2xl">
              Meet multiple singles in one session through video chat. Each round gives you a few minutes to connect before moving to the next match.
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {speedDatingSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/our-events/speed-dating/${session.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
                >
                  {/* Image */}
                  <div className="relative h-40 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20">
                    {session.image_url ? (
                      <Image
                        src={session.image_url}
                        alt={session.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-brand-primary/30" />
                      </div>
                    )}
                    {/* Status badge */}
                    {session.is_full ? (
                      <span className="absolute top-3 right-3 bg-gray-900/80 text-white text-xs px-2 py-1 rounded-full">
                        Full
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 bg-green-600/90 text-white text-xs px-2 py-1 rounded-full">
                        {session.spots_available} spots left
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-brand-primary transition-colors">
                      {session.title}
                    </h3>

                    {session.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {session.description}
                      </p>
                    )}

                    {/* Date & Time */}
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-brand-primary" />
                      <span>{formatEventDate(session.date)} at {session.start_time}</span>
                    </div>

                    {/* Duration */}
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Video className="w-4 h-4 text-brand-primary" />
                      <span>{session.duration_minutes} min session • {session.round_duration_minutes} min rounds</span>
                    </div>

                    {/* Participants */}
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 text-brand-primary" />
                      <span>{session.participant_count} registered</span>
                    </div>

                    {/* Eligibility */}
                    {formatEligibility(session) && (
                      <p className="mt-2 text-xs text-muted-foreground/80 italic">
                        {formatEligibility(session)}
                      </p>
                    )}

                    {/* CTA */}
                    <div className="mt-4 flex items-center gap-1 text-brand-primary font-medium text-sm group-hover:gap-2 transition-all">
                      <span>View Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* In-Person Events Section */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {hasSpeedDating && (
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary/10">
                <CalendarHeart className="w-5 h-5 text-brand-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                In-Person Events
              </h2>
            </div>
          )}

          {hasEvents ? (
            <div className="space-y-6">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/our-events/${event.id}`}
                  className="block bg-muted rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <div className="grid md:grid-cols-3 gap-0">
                    {/* Event Image */}
                    <div className="relative h-48 md:h-full md:min-h-[220px] bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20">
                      {event.image_url ? (
                        <Image
                          src={event.image_url}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CalendarHeart className="w-16 h-16 text-brand-primary/30" />
                        </div>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="md:col-span-2 p-6 md:p-8">
                      {/* Location */}
                      {(event.city || event.venue_name) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-4 h-4 text-brand-primary" />
                          <span>
                            {event.venue_name}
                            {event.venue_name && event.city ? ", " : ""}
                            {event.city}{event.state ? `, ${event.state}` : ""}
                          </span>
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="text-2xl font-bold text-foreground group-hover:text-brand-primary transition-colors">
                        {event.title}
                      </h3>

                      {/* Description */}
                      {event.description && (
                        <p className="mt-3 text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Date & Attendees */}
                      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                        <div className="flex items-center gap-2 text-brand-primary font-semibold">
                          <Clock className="w-4 h-4" />
                          <span>{formatEventDate(event.date)}</span>
                          {event.start_time && (
                            <span className="text-muted-foreground font-normal">
                              at {event.start_time}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4 text-brand-primary" />
                          <span>{event.attendee_count} attending</span>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white group-hover:bg-brand-primary-dark transition-colors">
                        View Event
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            !hasSpeedDating && (
              <div className="text-center py-16">
                <CalendarHeart className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-foreground">No upcoming events</h3>
                <p className="text-muted-foreground mt-2 mb-8">
                  Sign up to be notified when new events are posted in your area.
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-8 py-4 text-lg font-semibold text-white hover:bg-brand-primary-dark transition-colors"
                >
                  Create an Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )
          )}

          {/* Empty state when only speed dating exists */}
          {!hasEvents && hasSpeedDating && (
            <div className="text-center py-12 bg-muted rounded-2xl">
              <CalendarHeart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground">No in-person events scheduled</h3>
              <p className="text-muted-foreground mt-2">
                Check back soon for upcoming in-person events in your area!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {hasAnyContent && (
        <section className="bg-[#F6EDE1] py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Ready to meet someone special?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Create a free account to RSVP for events and start connecting with real singles.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-primary px-8 py-4 text-lg font-semibold text-white hover:bg-brand-primary-dark transition-colors"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
