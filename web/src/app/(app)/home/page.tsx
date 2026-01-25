"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  Video,
  Calendar,
  MapPin,
  Heart,
  ArrowRight,
  Users,
  RefreshCw,
  Menu,
  Bell,
  Loader2,
} from "lucide-react";
import { PointsBadge } from "@/components/rewards";
import { ProfileCard } from "@/components/discovery";
import { Avatar, EmptyState } from "@/components/ui";

interface HomeData {
  success: boolean;
  TopMatch: any[];
  NearBy: any[];
  Videos: any[];
  event: any[];
  Virtual: any[];
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
function formatProfileForCard(profile: any) {
  return {
    id: profile.ID || profile.id,
    user_id: profile.ID || profile.id,
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    }

    try {
      // Fetch user info
      const userRes = await fetch("/api/users/me");
      if (!userRes.ok) {
        if (userRes.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch user info");
      }
      const userResponse = await userRes.json();
      const userData = userResponse.data || userResponse;
      setUserInfo({
        id: userData.ID || userData.id,
        displayName: userData.DisplayName || userData.FirstName || "User",
        profileImage: userData.Image || userData.ProfileImageUrl || null,
        points: userData.PointsBalance || userData.RedeemPoints || 0,
      });

      // Fetch home data
      const homeRes = await fetch("/api/discover");
      if (!homeRes.ok) {
        throw new Error("Failed to fetch home data");
      }
      const data = await homeRes.json();
      setHomeData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Unable to load home data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !userInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-background">
      {/* Hero Section - Matches Mobile */}
      <section 
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('/images/hero/homepage-hero.jpg')",
          minHeight: "240px",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Top Row - Profile, Notifications, Menu */}
          <div className="flex justify-between items-start">
            {/* Profile Avatar */}
            <Link href="/profile" className="block">
              <Avatar
                src={userInfo.profileImage}
                name={userInfo.displayName}
                size="lg"
                className="border-2 border-white shadow-lg"
              />
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/notifications"
                className="p-2 border border-white/30 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                <Bell className="w-5 h-5 text-white" />
              </Link>
              <button
                className="p-2 border border-white/30 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Hero Content - Title and Points Badge */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-8">
            <div className="max-w-md">
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                Find Your Perfect Match
              </h1>
            </div>
            <PointsBadge
              points={userInfo.points}
              size="md"
              href="/rewards"
            />
          </div>
        </div>
      </section>

      {/* Quick Action Pills - Matches Mobile */}
      <section className="bg-white border-b sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <Link
              href="/discover"
              className="flex-shrink-0 px-4 py-2 bg-primary text-white rounded-full font-medium text-sm transition-colors"
            >
              Discover
            </Link>
            <Link
              href="/matches"
              className="flex-shrink-0 px-4 py-2 bg-white border border-primary text-primary hover:bg-primary/5 rounded-full font-medium text-sm transition-colors"
            >
              Top Matches
            </Link>
            <Link
              href="/discover?filter=videos"
              className="flex-shrink-0 px-4 py-2 bg-white border border-primary text-primary hover:bg-primary/5 rounded-full font-medium text-sm transition-colors"
            >
              Videos
            </Link>
            <Link
              href="/speed-dating"
              className="flex-shrink-0 px-4 py-2 bg-white border border-primary text-primary hover:bg-primary/5 rounded-full font-medium text-sm transition-colors"
            >
              Virtual Dates
            </Link>
            <Link
              href="/discover?filter=nearby"
              className="flex-shrink-0 px-4 py-2 bg-white border border-primary text-primary hover:bg-primary/5 rounded-full font-medium text-sm transition-colors"
            >
              Nearby
            </Link>
            <Link
              href="/events"
              className="flex-shrink-0 px-4 py-2 bg-white border border-primary text-primary hover:bg-primary/5 rounded-full font-medium text-sm transition-colors"
            >
              Events
            </Link>
          </div>
        </div>
      </section>

      {/* Refresh Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-end">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">
        {/* Top Matches Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-primary">Top Matches</h2>
            <Link
              href="/matches"
              className="text-sm font-medium underline text-gray-700 hover:text-primary"
            >
              View All
            </Link>
          </div>

          {topMatches.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {topMatches.slice(0, 10).map((profile: any) => (
                <div key={profile.ID || profile.id} className="flex-shrink-0 w-44">
                  <ProfileCard
                    profile={formatProfileForCard(profile)}
                    showActions={false}
                    size="compact"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No top matches available</p>
          )}
        </section>

        {/* Featured Videos Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-primary">Featured Videos</h2>
            <Link
              href="/discover?filter=videos"
              className="text-sm font-medium underline text-gray-700 hover:text-primary"
            >
              View All
            </Link>
          </div>

          {videos.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {videos.slice(0, 10).map((video: any) => (
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

        {/* Virtual Speed Dating Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-primary">Virtual Speed Dating</h2>
            <Link
              href="/speed-dating"
              className="text-sm font-medium underline text-gray-700 hover:text-primary"
            >
              View All
            </Link>
          </div>

          {speedDating.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {speedDating.slice(0, 10).map((session: any) => (
                <Link
                  key={session.ID}
                  href={`/speed-dating/${session.ID}`}
                  className="flex-shrink-0 w-64 bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 border"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                      {session.Status}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm mb-1 truncate">{session.Title}</h3>
                  <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                    {session.Description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {session.ScheduledDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {session.MaxParticipants} max
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No virtual speed dating available</p>
          )}
        </section>

        {/* Nearby Profiles Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-primary">Nearby Profile</h2>
            <Link
              href="/discover?filter=nearby"
              className="text-sm font-medium underline text-gray-700 hover:text-primary"
            >
              View All
            </Link>
          </div>

          {nearbyProfiles.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {nearbyProfiles.slice(0, 10).map((profile: any) => (
                <div key={profile.ID || profile.id} className="flex-shrink-0 w-44">
                  <ProfileCard
                    profile={formatProfileForCard(profile)}
                    showActions={false}
                    size="compact"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No nearby profiles available</p>
          )}
        </section>

        {/* Events Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-primary">Events</h2>
            <Link
              href="/events"
              className="text-sm font-medium underline text-gray-700 hover:text-primary"
            >
              View All
            </Link>
          </div>

          {events.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {events.slice(0, 10).map((event: any) => (
                <Link
                  key={event.EventID}
                  href={`/events/${event.EventID}`}
                  className="flex-shrink-0 w-72 bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border group"
                >
                  {event.EventImage ? (
                    <div className="aspect-video bg-gradient-to-br from-orange-100 to-pink-100 relative overflow-hidden">
                      <img
                        src={event.EventImage}
                        alt=""
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
            <p className="text-gray-500 text-sm">No events available</p>
          )}
        </section>
      </div>
    </div>
  );
}
