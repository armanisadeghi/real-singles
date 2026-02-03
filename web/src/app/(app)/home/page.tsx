"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Video,
  Calendar,
  MapPin,
  Users,
  RefreshCw,
  Menu,
  Bell,
  Loader2,
} from "lucide-react";
import { PointsBadge } from "@/components/rewards";
import { ProfileCard } from "@/components/search";
import { EmptyState } from "@/components/ui";
import { SideMenu } from "@/components/navigation";
import { useUserProfile } from "@/hooks/queries";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Profile data as returned from the API */
interface ApiProfile {
  ID: string | null;
  id: string | null;
  DisplayName: string;
  FirstName: string;
  LastName: string;
  DOB: string;
  City: string;
  State: string;
  Occupation?: string;
  About: string;
  Image: string | null;
  livePicture: string | null;
  Height: string;
  Interest: string;
  is_verified: boolean;
  IsFavorite: number;
  distance_in_km?: number;
}

/** Video data as returned from the API */
interface ApiVideo {
  ID: string;
  Name: string;
  Link: string;
  VideoURL: string;
  CreatedDate: string | null;
}

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

interface HomeData {
  success: boolean;
  TopMatch: ApiProfile[];
  NearBy: ApiProfile[];
  Videos: ApiVideo[];
  event: ApiEvent[];
  Virtual: ApiSpeedDating[];
  baseImageUrl: string;
  msg: string;
}

interface UserInfo {
  id: string;
  displayName: string;
  profileImage: string | null;
  points: number;
}

// Format profile data from API to component format
function formatProfileForCard(profile: ApiProfile) {
  const id = profile.ID || profile.id || "";
  return {
    id,
    user_id: id,
    first_name: profile.FirstName || profile.DisplayName?.split(" ")[0],
    last_name: profile.LastName || profile.DisplayName?.split(" ").slice(1).join(" "),
    date_of_birth: profile.DOB,
    city: profile.City,
    state: profile.State,
    occupation: profile.Occupation,
    bio: profile.About,
    profile_image_url: profile.Image || profile.livePicture,
    is_verified: profile.is_verified || false,
    height_inches: profile.Height ? parseInt(profile.Height) : null,
    interests: profile.Interest ? profile.Interest.split(", ").filter(Boolean) : [],
    user: {
      display_name: profile.DisplayName,
    },
  };
}

export default function HomePage() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Use TanStack Query for user profile (shared cache with other pages)
  const { data: userProfile, isLoading: userLoading, error: userError, refetch: refetchUser } = useUserProfile();

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const fetchHomeData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    }

    try {
      // Fetch home data
      const homeRes = await fetch("/api/discover");
      if (!homeRes.ok) {
        throw new Error("Failed to fetch home data");
      }
      const data = await homeRes.json();
      setHomeData(data);
      setHomeError(null);
    } catch (err) {
      console.error("Error fetching home data:", err);
      setHomeError("Unable to load home data");
    } finally {
      setHomeLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const handleRefresh = () => {
    refetchUser();
    fetchHomeData(true);
  };

  // Derived user info from TanStack Query data
  const userInfo: UserInfo | null = userProfile ? {
    id: userProfile.UserID || "",
    displayName: userProfile.DisplayName || userProfile.FirstName || "User",
    profileImage: userProfile.ProfileImageUrl || null,
    points: userProfile.Points || 0,
  } : null;

  // Loading state
  const isLoading = userLoading || homeLoading;
  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  // Error state
  const hasError = userError || homeError || !userInfo;
  if (hasError) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <EmptyState
            title="Unable to load home data"
            description="Please refresh the page or try again later."
          />
          <button
            onClick={handleRefresh}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const topMatches = homeData?.TopMatch || [];
  const nearbyProfiles = homeData?.NearBy || [];
  const videos = homeData?.Videos || [];
  const events = homeData?.event || [];
  const speedDating = homeData?.Virtual || [];

  return (
    <div className="min-h-dvh bg-background">
      {/* Clean Header with Logo */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo - theme-aware */}
            <Link href="/home" className="flex items-center gap-2 flex-shrink-0">
              {/* Light mode logo */}
              <img 
                src="/images/logo-transparent.png" 
                alt="RealSingles" 
                className="h-8 sm:h-9 w-auto dark:hidden"
              />
              {/* Dark mode logo */}
              <img 
                src="/images/logo-dark-transparent.png" 
                alt="RealSingles" 
                className="h-8 sm:h-9 w-auto hidden dark:block"
              />
            </Link>
            
            {/* Right Actions: Refresh + Points + Notifications + Menu */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Refresh - subtle, appears on hover of container */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/80 transition-colors disabled:opacity-50"
                title="Refresh content"
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <PointsBadge
                points={userInfo.points}
                size="sm"
                href="/rewards"
              />
              
              <Link
                href="/notifications"
                className="p-2 sm:p-2.5 rounded-full hover:bg-secondary/80 transition-colors"
              >
                <Bell className="w-5 h-5 text-foreground" />
              </Link>
              
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 sm:p-2.5 rounded-full hover:bg-secondary/80 transition-colors"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Action Pills */}
      <section className="bg-background border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide"
          >
            <Link
              href="/search"
              className="flex-shrink-0 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700/60 rounded-full font-medium text-sm transition-colors"
            >
              Discover
            </Link>
            <Link
              href="/matches"
              className="flex-shrink-0 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700/60 rounded-full font-medium text-sm transition-colors"
            >
              Top Matches
            </Link>
            <Link
              href="/search?filter=videos"
              className="flex-shrink-0 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700/60 rounded-full font-medium text-sm transition-colors"
            >
              Videos
            </Link>
            <Link
              href="/speed-dating"
              className="flex-shrink-0 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700/60 rounded-full font-medium text-sm transition-colors"
            >
              Virtual Dates
            </Link>
            <Link
              href="/search?filter=nearby"
              className="flex-shrink-0 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700/60 rounded-full font-medium text-sm transition-colors"
            >
              Nearby
            </Link>
            <Link
              href="/events"
              className="flex-shrink-0 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700/60 rounded-full font-medium text-sm transition-colors"
            >
              Events
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 space-y-10">
        {/* Top Matches Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-amber-700 dark:text-amber-400">Top Matches</h2>
            <Link
              href="/matches"
              className="text-sm font-medium underline text-gray-700 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400"
            >
              View All
            </Link>
          </div>

          {topMatches.length > 0 ? (
            <div
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            >
              {topMatches.slice(0, 10).map((profile) => (
                <div key={profile.ID || profile.id} className="flex-shrink-0 w-40 sm:w-44">
                  <ProfileCard
                    profile={formatProfileForCard(profile)}
                    showActions={false}
                    size="compact"
                    linkBasePath="/search/profile"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No top matches available</p>
          )}
        </section>

        {/* Events Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-amber-700 dark:text-amber-400">Events</h2>
            <Link
              href="/events"
              className="text-sm font-medium underline text-gray-700 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400"
            >
              View All
            </Link>
          </div>

          {events.length > 0 ? (
            <div
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            >
              {events.slice(0, 10).map((event) => (
                <Link
                  key={event.EventID}
                  href={`/events/${event.EventID}`}
                  className="flex-shrink-0 w-72 bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border group"
                >
                  {event.EventImage ? (
                    <div className="aspect-video bg-gradient-to-br from-orange-100 to-pink-100 relative overflow-hidden">
                      <img
                        src={event.EventImage}
                        alt={event.EventName || "Event image"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                      <Calendar className="w-12 h-12 text-orange-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-1 truncate">{event.EventName}</h3>
                    <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                      {event.Description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {event.EventDate}
                      </span>
                      {event.City && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.City}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No events available</p>
          )}
        </section>

        {/* Virtual Speed Dating Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-amber-700 dark:text-amber-400">Virtual Speed Dating</h2>
            <Link
              href="/speed-dating"
              className="text-sm font-medium underline text-gray-700 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400"
            >
              View All
            </Link>
          </div>

          {speedDating.length > 0 ? (
            <div
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            >
              {speedDating.slice(0, 10).map((session) => (
                <Link
                  key={session.ID}
                  href={`/speed-dating/${session.ID}`}
                  className="flex-shrink-0 w-72 bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-black/20 hover:shadow-md dark:hover:shadow-black/30 transition-all overflow-hidden border border-gray-200 dark:border-neutral-700 group"
                >
                  {/* Image section - matches event card pattern */}
                  {session.Image ? (
                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 relative overflow-hidden">
                      <img
                        src={session.Image}
                        alt={session.Title || "Speed dating session"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Status badge overlay */}
                      <span className="absolute top-2 right-2 px-2 py-1 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                        {session.Status}
                      </span>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center relative">
                      <Video className="w-12 h-12 text-white/80" />
                      {/* Status badge overlay */}
                      <span className="absolute top-2 right-2 px-2 py-1 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                        {session.Status}
                      </span>
                    </div>
                  )}
                  {/* Content section */}
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-1 truncate text-gray-900 dark:text-gray-100">{session.Title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-2">
                      {session.Description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {session.ScheduledDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {session.MaxParticipants} max
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No virtual speed dating available</p>
          )}
        </section>

        {/* Nearby Profiles Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-amber-700 dark:text-amber-400">Nearby Profiles</h2>
            <Link
              href="/search?filter=nearby"
              className="text-sm font-medium underline text-gray-700 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400"
            >
              View All
            </Link>
          </div>

          {nearbyProfiles.length > 0 ? (
            <div
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            >
              {nearbyProfiles.slice(0, 10).map((profile) => (
                <div key={profile.ID || profile.id} className="flex-shrink-0 w-40 sm:w-44">
                  <ProfileCard
                    profile={formatProfileForCard(profile)}
                    showActions={false}
                    size="compact"
                    linkBasePath="/discover/profile"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No nearby profiles available</p>
          )}
        </section>

        {/* Featured Videos Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-amber-700 dark:text-amber-400">Featured Videos</h2>
            <Link
              href="/search?filter=videos"
              className="text-sm font-medium underline text-gray-700 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400"
            >
              View All
            </Link>
          </div>

          {videos.length > 0 ? (
            <div
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            >
              {videos.slice(0, 10).map((video) => (
                <Link
                  key={video.ID}
                  href={`/profile/${video.ID}`}
                  className="flex-shrink-0 w-32 group"
                >
                  <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                    {video.VideoURL && (
                      <video
                        src={video.VideoURL}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Video className="w-5 h-5 text-purple-500" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-white font-medium text-xs truncate">
                        {video.Name}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No featured videos available</p>
          )}
        </section>
      </div>

      {/* Side Menu */}
      {userInfo && (
        <SideMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          user={{
            displayName: userInfo.displayName,
            profileImage: userInfo.profileImage,
          }}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
