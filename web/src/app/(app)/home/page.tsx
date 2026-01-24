import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Compass,
  Video,
  Calendar,
  MapPin,
  Heart,
  Sparkles,
  Filter,
  ArrowRight,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProfileCard } from "@/components/discovery";
import { EmptyState } from "@/components/ui";

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

async function getHomeData(): Promise<HomeData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch home data from our API
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/discover`,
    {
      headers: {
        Cookie: `sb-access-token=${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return null;
  }

  return res.json();
}

async function getUserInfo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, profile_image_url")
    .eq("user_id", user.id)
    .single();

  const { data: userData } = await supabase
    .from("users")
    .select("display_name, points_balance")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    displayName:
      userData?.display_name || profile?.first_name || user.email?.split("@")[0],
    profileImage: profile?.profile_image_url,
    points: userData?.points_balance || 0,
  };
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

export default async function HomePage() {
  const userInfo = await getUserInfo();
  const homeData = await getHomeData();

  if (!userInfo) {
    redirect("/login");
  }

  if (!homeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          title="Unable to load home data"
          description="Please refresh the page or try again later."
        />
      </div>
    );
  }

  const topMatches = homeData.TopMatch?.slice(0, 10) || [];
  const nearbyProfiles = homeData.NearBy?.slice(0, 10) || [];
  const videos = homeData.Videos?.slice(0, 10) || [];
  const events = homeData.event?.slice(0, 5) || [];
  const speedDating = homeData.Virtual?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with User Welcome */}
      <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Welcome Message */}
            <div className="flex items-center gap-4">
              {userInfo.profileImage ? (
                <img
                  src={userInfo.profileImage}
                  alt=""
                  className="w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  {userInfo.displayName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Welcome back, {userInfo.displayName}!
                </h1>
                <p className="text-gray-600 mt-1">
                  Discover your perfect match today
                </p>
              </div>
            </div>

            {/* Points Display */}
            <Link
              href="/rewards"
              className="flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all group"
            >
              <div className="relative">
                <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
                <Sparkles className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{userInfo.points}</p>
                <p className="text-xs text-gray-500">Reward Points</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Action Categories */}
      <section className="bg-white border-b sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            <Link
              href="/discover"
              className="flex-shrink-0 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              Browse All
            </Link>
            <Link
              href="/discover?filter=top-matches"
              className="flex-shrink-0 px-4 py-2 bg-white border-2 border-pink-500 text-pink-600 hover:bg-pink-50 rounded-full font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Top Matches
            </Link>
            <Link
              href="/discover?filter=videos"
              className="flex-shrink-0 px-4 py-2 bg-white border-2 border-purple-500 text-purple-600 hover:bg-purple-50 rounded-full font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Featured Videos
            </Link>
            <Link
              href="/speed-dating"
              className="flex-shrink-0 px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 rounded-full font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Speed Dating
            </Link>
            <Link
              href="/events"
              className="flex-shrink-0 px-4 py-2 bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 rounded-full font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Events
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Top Matches Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Heart className="w-6 h-6 text-pink-500" />
                Top Matches
              </h2>
              <p className="text-gray-600 mt-1">
                People who match your preferences
              </p>
            </div>
            <Link
              href="/discover?filter=top-matches"
              className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1 group"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {topMatches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {topMatches.slice(0, 4).map((profile) => (
                <ProfileCard
                  key={profile.ID || profile.id}
                  profile={formatProfileForCard(profile)}
                  showActions={false}
                  size="normal"
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matches yet"
              description="Update your filters to find compatible matches"
            />
          )}
        </section>

        {/* Featured Videos Section */}
        {videos.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Video className="w-6 h-6 text-purple-500" />
                  Featured Videos
                </h2>
                <p className="text-gray-600 mt-1">
                  See authentic video introductions
                </p>
              </div>
              <Link
                href="/discover?filter=videos"
                className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 group"
              >
                View All
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {videos.slice(0, 5).map((video) => (
                <Link
                  key={video.ID}
                  href={`#video-${video.ID}`}
                  className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 hover:shadow-lg transition-all"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Video className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white font-semibold text-sm truncate">
                      {video.Name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Virtual Speed Dating Section */}
        {speedDating.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-500" />
                  Virtual Speed Dating
                </h2>
                <p className="text-gray-600 mt-1">Join upcoming sessions</p>
              </div>
              <Link
                href="/speed-dating"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group"
              >
                View All
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {speedDating.slice(0, 3).map((session) => (
                <Link
                  key={session.ID}
                  href={`/speed-dating/${session.ID}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                      {session.Status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{session.Title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {session.Description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {session.ScheduledDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {session.MaxParticipants} max
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Nearby Profiles Section */}
        {nearbyProfiles.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-green-500" />
                  Nearby Profiles
                </h2>
                <p className="text-gray-600 mt-1">
                  Singles in your area
                </p>
              </div>
              <Link
                href="/discover?filter=nearby"
                className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1 group"
              >
                View All
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nearbyProfiles.slice(0, 4).map((profile) => (
                <ProfileCard
                  key={profile.ID || profile.id}
                  profile={formatProfileForCard(profile)}
                  showActions={false}
                  size="normal"
                />
              ))}
            </div>
          </section>
        )}

        {/* Events Section */}
        {events.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-orange-500" />
                  Upcoming Events
                </h2>
                <p className="text-gray-600 mt-1">
                  Meet singles in person
                </p>
              </div>
              <Link
                href="/events"
                className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 group"
              >
                View All
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.slice(0, 3).map((event) => (
                <Link
                  key={event.EventID}
                  href={`#event-${event.EventID}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border group"
                >
                  {event.EventImage && (
                    <div className="aspect-video bg-gradient-to-br from-orange-100 to-pink-100 relative overflow-hidden">
                      <img
                        src={event.EventImage}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2">{event.EventName}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {event.Description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {event.EventDate}
                      </span>
                      {event.City && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.City}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
