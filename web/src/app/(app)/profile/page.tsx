import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

// Helper to convert storage path to public URL (works server-side)
function getGalleryPublicUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/gallery/${path}`;
}

async function getMyProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: userData } = await supabase
    .from("users")
    .select("display_name, points_balance, referral_code, created_at")
    .eq("id", user.id)
    .single();

  const { data: gallery } = await supabase
    .from("user_gallery")
    .select("*")
    .eq("user_id", user.id)
    .order("display_order");

  return {
    user: { ...user, ...userData },
    profile,
    gallery: gallery || [],
  };
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

export default async function MyProfilePage() {
  const data = await getMyProfile();
  
  if (!data) {
    redirect("/login");
  }

  const { user, profile, gallery } = data;
  const hasProfile = profile !== null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <Link
          href="/profile/edit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Edit Profile
        </Link>
      </div>

      {!hasProfile ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">👋</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Profile</h2>
          <p className="text-gray-600 mb-6">
            Add your details to start connecting with other singles.
          </p>
          <Link
            href="/profile/edit"
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700"
          >
            Get Started
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="md:flex">
              {/* Photo */}
              <div className="md:w-1/3">
                <div className="aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 relative">
                  {profile.profile_image_url ? (
                    <img
                      src={profile.profile_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-8xl">👤</span>
                    </div>
                  )}
                  {profile.is_verified && (
                    <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Verified
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="md:w-2/3 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile.first_name || user.display_name || "Your Name"}
                    {profile.last_name && ` ${profile.last_name}`}
                  </h2>
                  {profile.date_of_birth && (
                    <span className="text-xl text-gray-500">
                      {calculateAge(profile.date_of_birth)}
                    </span>
                  )}
                </div>

                {profile.city && (
                  <p className="text-gray-600 mb-2">
                    📍 {profile.city}{profile.state ? `, ${profile.state}` : ""}
                  </p>
                )}

                {profile.occupation && (
                  <p className="text-gray-600 mb-4">
                    💼 {profile.occupation}
                  </p>
                )}

                {profile.bio && (
                  <p className="text-gray-700 mb-4">{profile.bio}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-b">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{user.points_balance || 0}</div>
                    <div className="text-sm text-gray-500">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{gallery.length}</div>
                    <div className="text-sm text-gray-500">Photos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {profile.is_verified ? "Yes" : "No"}
                    </div>
                    <div className="text-sm text-gray-500">Verified</div>
                  </div>
                </div>

                {/* Referral Code */}
                {user.referral_code && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Your Referral Code:</strong> {user.referral_code}
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Share this code to earn points when friends sign up!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest: string) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {gallery.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gallery</h3>
              <div className="grid grid-cols-3 gap-4">
                {gallery.map((item) => {
                  const mediaUrl = getGalleryPublicUrl(item.media_url);
                  const isVideo = item.media_type === "video";
                  return (
                    <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {isVideo ? (
                        <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profile.height_inches && (
                <div>
                  <p className="text-sm text-gray-500">Height</p>
                  <p className="font-medium">{Math.floor(profile.height_inches / 12)}'{profile.height_inches % 12}"</p>
                </div>
              )}
              {profile.body_type && (
                <div>
                  <p className="text-sm text-gray-500">Body Type</p>
                  <p className="font-medium capitalize">{profile.body_type}</p>
                </div>
              )}
              {profile.education && (
                <div>
                  <p className="text-sm text-gray-500">Education</p>
                  <p className="font-medium">{profile.education}</p>
                </div>
              )}
              {profile.religion && (
                <div>
                  <p className="text-sm text-gray-500">Religion</p>
                  <p className="font-medium">{profile.religion}</p>
                </div>
              )}
              {profile.smoking && (
                <div>
                  <p className="text-sm text-gray-500">Smoking</p>
                  <p className="font-medium capitalize">{profile.smoking}</p>
                </div>
              )}
              {profile.drinking && (
                <div>
                  <p className="text-sm text-gray-500">Drinking</p>
                  <p className="font-medium capitalize">{profile.drinking}</p>
                </div>
              )}
              {profile.exercise && (
                <div>
                  <p className="text-sm text-gray-500">Exercise</p>
                  <p className="font-medium capitalize">{profile.exercise}</p>
                </div>
              )}
              {profile.wants_kids && (
                <div>
                  <p className="text-sm text-gray-500">Wants Kids</p>
                  <p className="font-medium capitalize">{profile.wants_kids.replace(/_/g, " ")}</p>
                </div>
              )}
              {profile.zodiac_sign && (
                <div>
                  <p className="text-sm text-gray-500">Zodiac</p>
                  <p className="font-medium capitalize">{profile.zodiac_sign}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
