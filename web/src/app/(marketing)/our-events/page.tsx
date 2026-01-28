import Image from "next/image";
import Link from "next/link";
import { CalendarHeart, MapPin, Clock, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/marketing";

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
    .limit(12);

  return (events || []) as PublicEvent[];
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function EventsPage() {
  const events = await getUpcomingEvents();

  return (
    <>
      {/* Hero Section */}
      <PageHero
        title="Events"
        backgroundColor="beige"
      />

      {/* Events List */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {events.length > 0 ? (
            <div className="space-y-8">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-muted rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="grid md:grid-cols-3 gap-0">
                    {/* Event Image */}
                    <div className="relative h-48 md:h-full md:min-h-[240px] bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20">
                      {event.image_url ? (
                        <Image
                          src={event.image_url}
                          alt={event.title}
                          fill
                          className="object-cover"
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
                      <h3 className="text-2xl font-bold text-foreground">
                        {event.title}
                      </h3>

                      {/* Description */}
                      {event.description && (
                        <p className="mt-3 text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Date */}
                      <div className="mt-4 flex items-center gap-2 text-brand-primary font-semibold">
                        <Clock className="w-4 h-4" />
                        <span>{formatEventDate(event.start_datetime)}</span>
                      </div>

                      {/* CTA */}
                      <Link
                        href="/register"
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark transition-colors"
                      >
                        Attend
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
          )}
        </div>
      </section>
    </>
  );
}
