import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

async function getDiscoverProfiles() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  // Get profiles excluding current user
  const { data: profiles } = await supabase
    .from("profiles")
    .select(`
      *,
      user:user_id(display_name, status)
    `)
    .neq("user_id", user.id)
    .limit(20);

  return profiles || [];
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default async function DiscoverPage() {
  const profiles = await getDiscoverProfiles();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center">
          <span className="mr-2">🔍</span>
          Filters
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">👀</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No profiles yet</h2>
          <p className="text-gray-600 mb-6">Be the first to complete your profile!</p>
          <Link
            href="/profile/edit"
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700"
          >
            Complete Your Profile
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/profile/${profile.user_id}`}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Photo */}
              <div className="aspect-[3/4] bg-gradient-to-br from-indigo-100 to-purple-100 relative">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">👤</span>
                  </div>
                )}
                
                {/* Verified Badge */}
                {profile.is_verified && (
                  <div className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    ✓ Verified
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {profile.first_name || (profile.user as { display_name?: string })?.display_name || "Anonymous"}
                    {profile.date_of_birth && (
                      <span className="text-gray-500 font-normal">
                        , {calculateAge(profile.date_of_birth)}
                      </span>
                    )}
                  </h3>
                </div>
                
                {profile.city && (
                  <p className="text-sm text-gray-500 mt-1">
                    📍 {profile.city}{profile.state ? `, ${profile.state}` : ""}
                  </p>
                )}

                {profile.occupation && (
                  <p className="text-sm text-gray-600 mt-1">
                    💼 {profile.occupation}
                  </p>
                )}

                {profile.bio && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {profile.bio}
                  </p>
                )}

                {/* Interests */}
                {profile.interests && profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {profile.interests.slice(0, 3).map((interest: string) => (
                      <span
                        key={interest}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        {interest}
                      </span>
                    ))}
                    {profile.interests.length > 3 && (
                      <span className="px-2 py-1 text-gray-400 text-xs">
                        +{profile.interests.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
