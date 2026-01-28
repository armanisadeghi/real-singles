import Image from "next/image";
import Link from "next/link";
import { CalendarHeart, MapPin, Users, Clock, Sparkles, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  image_url: string | null;
  venue_name: string | null;
  city: string | null;
  state: string | null;
  start_datetime: string;
  max_attendees: number | null;
  current_attendees: number | null;
}

async function getUpcomingEvents(): Promise<PublicEvent[]> {
  const supabase = await createClient();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data: events } = await supabase
    .from("events")
    .select(`
      id,
      title,
      description,
      event_type,
      image_url,
      venue_name,
      city,
      state,
      start_datetime,
      max_attendees,
      current_attendees
    `)
    .eq("is_public", true)
    .eq("status", "published")
    .gte("start_datetime", today.toISOString())
    .order("start_datetime", { ascending: true })
    .limit(9);

  return (events || []) as PublicEvent[];
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatEventTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function PublicEventsPage() {
  const events = await getUpcomingEvents();

  return (
    <>
      {/* Hero Section */}
      <section className="bg-[#F6EDE1] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-primary/10 rounded-full px-4 py-2 mb-6">
              <CalendarHeart className="w-4 h-4 text-brand-primary" />
              <span className="text-sm text-brand-primary font-medium">
                Meet Singles In Person
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
              Upcoming <span className="text-brand-primary">Events</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Skip the endless swiping. Our curated events bring singles together in real life. From speed dating nights to social mixers, find your connection in person.
            </p>
          </div>
        </div>
      </section>

      {/* Event Types */}
      <section className="bg-white py-16 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { name: "Speed Dating", icon: "⚡", desc: "Quick connections" },
              { name: "Social Mixers", icon: "🎉", desc: "Relaxed networking" },
              { name: "Virtual Events", icon: "💻", desc: "From anywhere" },
              { name: "Activity Groups", icon: "🎯", desc: "Shared interests" },
            ].map((type) => (
              <div key={type.name} className="p-4">
                <div className="text-4xl mb-2">{type.icon}</div>
                <h3 className="font-semibold text-foreground">{type.name}</h3>
                <p className="text-sm text-muted-foreground">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="bg-muted py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Upcoming <span className="text-brand-primary">Events</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join us at one of our upcoming events and meet amazing singles in your area.
            </p>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Event Image */}
                  <div className="relative h-48 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20">
                    {event.image_url && (
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-sm text-brand-primary text-xs font-semibold px-3 py-1 rounded-full">
                        {event.event_type.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                      {event.title}
                    </h3>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarHeart className="w-4 h-4 text-brand-primary" />
                        <span>{formatEventDate(event.start_datetime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 text-brand-primary" />
                        <span>{formatEventTime(event.start_datetime)}</span>
                      </div>
                      {(event.city || event.venue_name) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 text-brand-primary" />
                          <span className="truncate">
                            {event.venue_name ? `${event.venue_name}, ` : ""}
                            {event.city}{event.state ? `, ${event.state}` : ""}
                          </span>
                        </div>
                      )}
                      {event.max_attendees && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4 text-brand-primary" />
                          <span>
                            {event.current_attendees || 0} / {event.max_attendees} spots
                          </span>
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    {/* CTA to sign up */}
                    <Link
                      href="/register"
                      className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary/10 text-brand-primary px-4 py-2 text-sm font-semibold hover:bg-brand-primary/20 transition-colors"
                    >
                      Sign up to RSVP
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <CalendarHeart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No upcoming events</h3>
              <p className="text-muted-foreground mt-2">
                Sign up to be notified when new events are posted.
              </p>
              <Link
                href="/register"
                className="mt-6 inline-flex items-center gap-2 text-brand-primary font-semibold hover:underline"
              >
                Create an account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-brand-primary to-brand-primary-dark py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Meet Amazing Singles?
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            Join Real Singles today to RSVP to events, get notified about new events in your area, and connect with like-minded singles.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-brand-primary shadow-lg hover:bg-gray-100 transition-all hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Already a member? Log in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
