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
  Wand2,
  Heart,
  Star,
  Flower2,
  Candy,
  Wine,
  Gem,
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
// FEATURE PROMO BANNER COMPONENT (Unified for Coming Soon / Promo sections)
// ============================================================================

interface FeaturePromoBannerProps {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  badgeIcon?: React.ElementType;
  backgroundImage?: string;
  accentColor: "amber" | "purple" | "rose" | "teal";
}

const accentStyles = {
  amber: {
    iconBg: "bg-amber-500",
    iconBgLight: "bg-amber-100 dark:bg-amber-900/40",
    badge: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
    hoverBorder: "hover:border-amber-300 dark:hover:border-amber-700",
    hoverText: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
    overlay: "from-amber-900/80 via-amber-900/60 to-amber-900/40",
  },
  purple: {
    iconBg: "bg-purple-500",
    iconBgLight: "bg-purple-100 dark:bg-purple-900/40",
    badge: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
    hoverBorder: "hover:border-purple-300 dark:hover:border-purple-700",
    hoverText: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
    overlay: "from-purple-900/80 via-purple-900/60 to-purple-900/40",
  },
  rose: {
    iconBg: "bg-rose-500",
    iconBgLight: "bg-rose-100 dark:bg-rose-900/40",
    badge: "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300",
    hoverBorder: "hover:border-rose-300 dark:hover:border-rose-700",
    hoverText: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
    overlay: "from-rose-900/80 via-rose-900/60 to-rose-900/40",
  },
  teal: {
    iconBg: "bg-teal-500",
    iconBgLight: "bg-teal-100 dark:bg-teal-900/40",
    badge: "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300",
    hoverBorder: "hover:border-teal-300 dark:hover:border-teal-700",
    hoverText: "group-hover:text-teal-600 dark:group-hover:text-teal-400",
    overlay: "from-teal-900/80 via-teal-900/60 to-teal-900/40",
  },
};

function FeaturePromoBanner({
  href,
  title,
  description,
  icon: Icon,
  badge,
  badgeIcon: BadgeIcon,
  backgroundImage,
  accentColor,
}: FeaturePromoBannerProps) {
  const styles = accentStyles[accentColor];

  return (
    <Link
      href={href}
      className={`group flex-shrink-0 w-[280px] sm:w-[300px] relative overflow-hidden rounded-2xl border border-border/40 bg-card hover:border-border/80 hover:shadow-md transition-all duration-300 ${styles.hoverBorder}`}
    >
      {/* Image Section - matches EventCard/SpeedDatingCard aspect ratio */}
      <div className="aspect-[16/10] relative overflow-hidden">
        {backgroundImage ? (
          <>
            <img
              src={backgroundImage}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${styles.overlay}`} />
          </>
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${styles.iconBgLight}`}>
            <Icon className={`w-12 h-12 ${styles.iconBg.replace("bg-", "text-")}/30`} />
          </div>
        )}

        {/* Badge - positioned like EventCard price badge */}
        {badge && (
          <div
            className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1 ${
              backgroundImage
                ? "bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm text-foreground"
                : styles.badge
            }`}
          >
            {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
            {badge}
          </div>
        )}

        {/* Floating Icon - centered on image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              backgroundImage
                ? "bg-white/20 backdrop-blur-md"
                : styles.iconBgLight
            }`}
          >
            <Icon
              className={`w-8 h-8 ${
                backgroundImage ? "text-white" : styles.iconBg.replace("bg-", "text-")
              }`}
            />
          </div>
        </div>
      </div>

      {/* Content Section - matches EventCard/SpeedDatingCard padding */}
      <div className="p-4">
        <h3 className={`font-semibold text-foreground line-clamp-1 ${styles.hoverText} transition-colors`}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {description}
        </p>

        {/* CTA row - matches meta info row */}
        <div className="flex items-center justify-between mt-3 text-xs">
          <span className={`font-medium ${styles.iconBg.replace("bg-", "text-")}`}>
            Learn more
          </span>
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground ${styles.hoverText} group-hover:translate-x-0.5 transition-all`}
          />
        </div>
      </div>
    </Link>
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
  const { data, isLoading, error } = useSpeedDating({ limit: 10, status: "upcoming" });
  
  // Map API response to expected format
  const sessions: ApiSpeedDating[] = (data?.data || []).map((s) => ({
    ID: s.ID || s.SessionID,
    Title: s.Title,
    Description: s.Description || "",
    Image: s.Image || "",
    ScheduledDate: s.ScheduledDateTime ? s.ScheduledDateTime.split("T")[0] : "",
    // Format time using toLocaleTimeString which includes AM/PM
    ScheduledTime: s.ScheduledDateTime 
      ? new Date(s.ScheduledDateTime).toLocaleTimeString("en-US", { 
          hour: "numeric", 
          minute: "2-digit",
          hour12: true 
        })
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
// REWARDS HERO BANNER COMPONENT
// ============================================================================

function RewardsHeroBanner() {
  return (
    <Link
      href="/rewards"
      className="group block relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 dark:from-rose-950/30 dark:via-pink-950/30 dark:to-amber-950/30 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex flex-col md:flex-row">
        {/* Content */}
        <div className="flex-1 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Rewards Shop
            </span>
          </div>
          
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
            Impress Your Match
          </h2>
          
          <p className="text-muted-foreground mb-4 max-w-md">
            Send roses, chocolates, or plan the perfect date experience. 
            Earn points by inviting friends and redeem them for romantic gestures.
          </p>
          
          {/* Mini product preview */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center border-2 border-white dark:border-neutral-800">
                <Flower2 className="w-5 h-5 text-red-500" />
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center border-2 border-white dark:border-neutral-800">
                <Candy className="w-5 h-5 text-amber-600" />
              </div>
              <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center border-2 border-white dark:border-neutral-800">
                <Wine className="w-5 h-5 text-pink-500" />
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center border-2 border-white dark:border-neutral-800">
                <Gem className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            <span className="text-sm text-muted-foreground">16+ romantic rewards</span>
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-rose-500/25 group-hover:shadow-xl group-hover:shadow-rose-500/30 transition-all">
            <Gift className="w-4 h-4" />
            Browse Rewards
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
        
        {/* Image */}
        <div className="hidden md:block relative w-72 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-rose-50 dark:to-rose-950/30 z-10" />
          <img
            src="https://sotdovuprhztkrgtonyz.supabase.co/storage/v1/render/image/public/products/promo/rewards-gifts-hero.png?width=600&height=400&quality=75&format=webp"
            alt="Romantic rewards"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ExplorePage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-8">
        {/* Rewards Hero Banner - Prominent placement */}
        <RewardsHeroBanner />

        {/* Events Section - Loads independently */}
        <EventsSection />

        {/* Speed Dating Section - Loads independently */}
        <SpeedDatingSection />

        {/* Professional Matchmakers Section - Full width banner */}
        <section>
          <Link
            href="/matchmakers"
            className="group block relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-rose-950/30 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row">
              {/* Content */}
              <div className="flex-1 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Wand2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    Professional Service
                  </span>
                </div>
                
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Expert Matchmakers
                </h2>
                
                <p className="text-muted-foreground mb-4 max-w-md">
                  Get personalized introductions from experienced matchmakers who understand what you're looking for in a partner.
                </p>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-purple-500/25 group-hover:shadow-xl group-hover:shadow-purple-500/30 transition-all">
                  <Wand2 className="w-4 h-4" />
                  Browse Matchmakers
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              
              {/* Image */}
              <div className="hidden md:block relative w-72 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-purple-50 dark:to-purple-950/30 z-10" />
                <img
                  src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&q=80"
                  alt="Professional matchmakers"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </Link>
        </section>

        {/* Refer Friends Section - Full width banner */}
        <section>
          <Link
            href="/refer"
            className="group block relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row">
              {/* Content */}
              <div className="flex-1 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Earn Rewards
                  </span>
                </div>
                
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Refer Friends
                </h2>
                
                <p className="text-muted-foreground mb-4 max-w-md">
                  Share RealSingles with friends and earn exclusive rewards when they join. Help others find love and get rewarded!
                </p>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-amber-500/25 group-hover:shadow-xl group-hover:shadow-amber-500/30 transition-all">
                  <Gift className="w-4 h-4" />
                  Start Referring
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              
              {/* Image */}
              <div className="hidden md:block relative w-72 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-amber-50 dark:to-amber-950/30 z-10" />
                <img
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80"
                  alt="Refer friends"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
}
