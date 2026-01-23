import Image from "next/image";
import Link from "next/link";
import {
  CalendarHeart,
  MapPin,
  Clock,
  Users,
  Video,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";

// Sample events data - in production this would come from API
const upcomingEvents = [
  {
    id: 1,
    title: "Saturday Night Speed Dating",
    type: "speed_dating",
    date: "2026-01-25",
    time: "7:00 PM - 10:00 PM",
    location: "The Velvet Lounge, NYC",
    address: "123 West 45th Street, New York, NY",
    spots: 24,
    spotsLeft: 8,
    price: "Free",
    image: "/images/events-party.jpg",
    description: "Meet up to 15 singles in one evening. Quick dates, real connections.",
  },
  {
    id: 2,
    title: "Virtual Speed Dating: 30s & 40s",
    type: "virtual",
    date: "2026-01-28",
    time: "8:00 PM - 9:30 PM EST",
    location: "Online via Zoom",
    address: null,
    spots: 20,
    spotsLeft: 12,
    price: "Free",
    image: null,
    description: "Age-specific speed dating from the comfort of your home.",
  },
  {
    id: 3,
    title: "Singles Wine Tasting",
    type: "social",
    date: "2026-02-01",
    time: "6:00 PM - 9:00 PM",
    location: "Vino & Co Wine Bar, Chicago",
    address: "456 N Michigan Ave, Chicago, IL",
    spots: 40,
    spotsLeft: 15,
    price: "$35",
    image: null,
    description: "Sip, mingle, and meet other wine-loving singles.",
  },
  {
    id: 4,
    title: "Valentine's Day Mixer",
    type: "social",
    date: "2026-02-14",
    time: "7:00 PM - 11:00 PM",
    location: "Rooftop at The Standard, LA",
    address: "550 S Flower St, Los Angeles, CA",
    spots: 100,
    spotsLeft: 35,
    price: "$50",
    image: null,
    description: "The biggest singles event of the year. Don't spend Valentine's alone!",
  },
];

const eventTypes = [
  {
    name: "Speed Dating",
    description: "Meet multiple singles in one evening with structured 5-minute dates.",
    icon: CalendarHeart,
    color: "bg-pink-100 text-pink-600",
  },
  {
    name: "Virtual Events",
    description: "Join from anywhere with our video speed dating and online mixers.",
    icon: Video,
    color: "bg-blue-100 text-blue-600",
  },
  {
    name: "Social Mixers",
    description: "Relaxed social events at bars, restaurants, and unique venues.",
    icon: Users,
    color: "bg-purple-100 text-purple-600",
  },
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function EventsPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-[#F6EDE1] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
              Singles <span className="text-brand-primary">Events</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Skip the endless swiping. Meet real singles at our curated events, both in-person and virtual.
            </p>
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {eventTypes.map((type) => (
              <div
                key={type.name}
                className="flex flex-col items-center text-center p-6"
              >
                <div className={`w-16 h-16 rounded-2xl ${type.color} flex items-center justify-center mb-4`}>
                  <type.icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {type.name}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="bg-muted py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Upcoming <span className="text-brand-primary">Events</span>
              </h2>
              <p className="mt-2 text-muted-foreground">
                Find and register for events near you.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-white hover:bg-muted transition-colors">
              <Filter className="w-4 h-4" />
              Filter Events
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {event.image && (
                  <div className="relative h-48">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        event.type === 'virtual' 
                          ? 'bg-blue-500 text-white' 
                          : event.type === 'speed_dating'
                          ? 'bg-pink-500 text-white'
                          : 'bg-purple-500 text-white'
                      }`}>
                        {event.type === 'virtual' ? 'Virtual' : event.type === 'speed_dating' ? 'Speed Dating' : 'Social'}
                      </span>
                    </div>
                  </div>
                )}
                
                {!event.image && (
                  <div className="h-32 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center">
                    <div className="text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        event.type === 'virtual' 
                          ? 'bg-blue-500 text-white' 
                          : event.type === 'speed_dating'
                          ? 'bg-pink-500 text-white'
                          : 'bg-purple-500 text-white'
                      }`}>
                        {event.type === 'virtual' ? 'Virtual Event' : event.type === 'speed_dating' ? 'Speed Dating' : 'Social Mixer'}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-foreground">
                    {event.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {event.description}
                  </p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarHeart className="w-4 h-4 text-brand-primary" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-brand-primary" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-brand-primary" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 text-brand-primary" />
                      <span>{event.spotsLeft} spots left of {event.spots}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-lg font-semibold text-brand-primary">
                      {event.price}
                    </span>
                    <Link
                      href={`/events/${event.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand-primary text-white font-medium hover:bg-brand-primary-dark transition-colors"
                    >
                      Register
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Want to see more events? Create an account to access all upcoming events.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-3 font-semibold text-white hover:bg-brand-primary-dark transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Sign Up for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Host an Event Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Want to <span className="text-brand-primary">Host an Event</span>?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Are you a venue owner, event organizer, or community leader? Partner with us to host singles events in your area.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Access to our verified singles community",
                  "Marketing support and event promotion",
                  "Event planning resources and best practices",
                  "Revenue sharing opportunities",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-primary/10 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-brand-primary" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="mt-8 inline-flex items-center gap-2 text-brand-primary font-semibold hover:underline"
              >
                Contact Us About Hosting
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-muted rounded-2xl p-8 lg:p-12">
              <h3 className="text-xl font-semibold text-foreground mb-6">
                Event Partnership Inquiry
              </h3>
              <form className="space-y-4">
                <div>
                  <label htmlFor="venue-name" className="block text-sm font-medium text-foreground mb-1">
                    Venue / Organization Name
                  </label>
                  <input
                    type="text"
                    id="venue-name"
                    className="w-full px-4 py-3 rounded-lg border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors"
                    placeholder="Your venue name"
                  />
                </div>
                <div>
                  <label htmlFor="venue-email" className="block text-sm font-medium text-foreground mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="venue-email"
                    className="w-full px-4 py-3 rounded-lg border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="venue-location" className="block text-sm font-medium text-foreground mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    id="venue-location"
                    className="w-full px-4 py-3 rounded-lg border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors"
                    placeholder="City, State"
                  />
                </div>
                <div>
                  <label htmlFor="venue-message" className="block text-sm font-medium text-foreground mb-1">
                    Tell us about your venue
                  </label>
                  <textarea
                    id="venue-message"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors resize-none"
                    placeholder="Describe your venue and event ideas..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-brand-primary text-white font-semibold hover:bg-brand-primary-dark transition-colors"
                >
                  Submit Inquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
