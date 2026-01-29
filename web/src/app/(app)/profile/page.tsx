import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Settings, 
  Edit3, 
  MapPin, 
  Briefcase, 
  CheckCircle,
  Sparkles,
  Share2,
  Camera,
  PauseCircle,
} from "lucide-react";
import { ReferralCard } from "@/components/profile/ReferralCard";
import { VoiceVideoDisplayClient } from "./VoiceVideoDisplayClient";

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

  // Generate signed URLs for gallery items
  const galleryWithUrls = await Promise.all(
    (gallery || []).map(async (item) => {
      if (item.media_url.startsWith("http")) {
        return item;
      }
      
      const { data: signedData } = await supabase.storage
        .from("gallery")
        .createSignedUrl(item.media_url, 3600); // 1 hour expiry
      
      return {
        ...item,
        media_url: signedData?.signedUrl || item.media_url,
      };
    })
  );

  // Generate signed URL for profile image
  let profileImageUrl = profile?.profile_image_url || null;
  if (profileImageUrl && !profileImageUrl.startsWith("http")) {
    const bucket = profileImageUrl.includes("/avatar") ? "avatars" : "gallery";
    const { data: signedData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(profileImageUrl, 3600);
    profileImageUrl = signedData?.signedUrl || profileImageUrl;
  }

  // Generate signed URLs for voice prompt and video intro
  let voicePromptUrl = profile?.voice_prompt_url || null;
  if (voicePromptUrl && !voicePromptUrl.startsWith("http")) {
    const { data: signedData } = await supabase.storage
      .from("gallery")
      .createSignedUrl(voicePromptUrl, 3600);
    voicePromptUrl = signedData?.signedUrl || voicePromptUrl;
  }

  let videoIntroUrl = profile?.video_intro_url || null;
  if (videoIntroUrl && !videoIntroUrl.startsWith("http")) {
    const { data: signedData } = await supabase.storage
      .from("gallery")
      .createSignedUrl(videoIntroUrl, 3600);
    videoIntroUrl = signedData?.signedUrl || videoIntroUrl;
  }

  return {
    user: { ...user, ...userData },
    profile: profile ? { 
      ...profile, 
      profile_image_url: profileImageUrl,
      voice_prompt_url: voicePromptUrl,
      video_intro_url: videoIntroUrl,
    } : null,
    gallery: galleryWithUrls,
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

  // Format height helper
  const formatHeight = (inches: number) => {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  };

  return (
    <div className="min-h-dvh bg-gray-50">
      {!hasProfile ? (
        /* Empty State - No Profile Yet */
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Complete Your Profile</h2>
            <p className="text-gray-600 mb-8">
              Add your details to start connecting with other singles.
            </p>
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-medium hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg shadow-pink-500/25"
            >
              <Edit3 className="w-5 h-5" />
              Get Started
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Profile Paused Banner */}
          {profile.profile_hidden && (
            <div className="bg-orange-500 text-white px-4 py-3">
              <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
                <PauseCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">
                  Your profile is paused — you won't appear in discovery or matches
                </span>
                <Link
                  href="/settings"
                  className="ml-2 text-sm underline underline-offset-2 hover:no-underline"
                >
                  Unpause
                </Link>
              </div>
            </div>
          )}
          
          {/* Hero Header - Compact & Modern */}
          <div className="bg-white border-b">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center gap-6">
                {/* Profile Photo - Constrained Size */}
                <div className="relative shrink-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 shadow-lg">
                    {profile.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt={`Profile photo of ${profile.first_name || "user"}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl sm:text-5xl">👤</span>
                      </div>
                    )}
                  </div>
                  {profile.is_verified && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {/* Camera overlay for edit */}
                  <Link
                    href="/profile/gallery"
                    className="absolute inset-0 bg-black/0 hover:bg-black/20 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-all"
                  >
                    <Camera className="w-6 h-6 text-white drop-shadow-lg" />
                  </Link>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                      {profile.first_name || user.display_name || "Your Name"}
                    </h1>
                    {profile.date_of_birth && (
                      <span className="text-xl sm:text-2xl text-gray-400 font-light">
                        {calculateAge(profile.date_of_birth)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-gray-500 text-sm mb-3">
                    {profile.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {profile.city}{profile.state ? `, ${profile.state}` : ""}
                      </span>
                    )}
                    {profile.occupation && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {profile.occupation}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/profile/edit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium rounded-full hover:from-pink-600 hover:to-rose-600 transition-all shadow-md"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 transition-all">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-white border-b">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-around py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                    {user.points_balance || 0}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">Points</div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{gallery.length}</div>
                  <div className="text-xs text-gray-500 font-medium">Photos</div>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {profile.is_verified ? (
                      <CheckCircle className="w-6 h-6 text-blue-500 mx-auto" />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">Verified</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="md:col-span-2 space-y-6">
                {/* About */}
                {profile.bio && (
                  <section className="bg-white rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">About</h3>
                    <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                  </section>
                )}

                {/* Voice & Video Section */}
                {(profile.voice_prompt_url || profile.video_intro_url) && (
                  <section className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Voice & Video</h3>
                      <Link href="/profile/edit#voice-video" className="text-sm text-pink-500 font-medium hover:text-pink-600">
                        Edit
                      </Link>
                    </div>
                    <VoiceVideoDisplayClient
                      voicePromptUrl={profile.voice_prompt_url}
                      voicePromptDuration={profile.voice_prompt_duration_seconds}
                      videoIntroUrl={profile.video_intro_url}
                      videoIntroDuration={profile.video_intro_duration_seconds}
                      userName={profile.first_name || user.display_name || "You"}
                    />
                  </section>
                )}

                {/* Gallery */}
                {gallery.length > 0 && (
                  <section className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Gallery</h3>
                      <Link href="/profile/gallery" className="text-sm text-pink-500 font-medium hover:text-pink-600">
                        Manage
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {gallery.slice(0, 6).map((item) => {
                        const isVideo = item.media_type === "video";
                        return (
                          <div key={item.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                            {isVideo ? (
                              <video src={item.media_url} className="w-full h-full object-cover" muted playsInline />
                            ) : (
                              <img src={item.media_url} alt="Gallery photo" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {gallery.length > 6 && (
                      <Link href="/profile/gallery" className="block text-center text-sm text-gray-500 mt-3 hover:text-pink-500">
                        +{gallery.length - 6} more
                      </Link>
                    )}
                  </section>
                )}

                {/* Interests */}
                {profile.interests && (profile.interests as string[]).length > 0 && (
                  <section className="bg-white rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {(profile.interests as string[]).map((interest) => (
                        <span
                          key={interest}
                          className="px-3 py-1.5 bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 rounded-full text-sm font-medium border border-pink-100"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Referral Card */}
                {user.referral_code && (
                  <ReferralCard referralCode={user.referral_code} />
                )}

                {/* Details Card */}
                <section className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Details</h3>
                  <div className="space-y-3">
                    {profile.height_inches && (
                      <DetailRow label="Height" value={formatHeight(profile.height_inches)} />
                    )}
                    {profile.body_type && (
                      <DetailRow label="Body Type" value={profile.body_type} />
                    )}
                    {profile.education && (
                      <DetailRow label="Education" value={profile.education} />
                    )}
                    {profile.religion && (
                      <DetailRow label="Religion" value={profile.religion} />
                    )}
                    {profile.zodiac_sign && (
                      <DetailRow label="Zodiac" value={profile.zodiac_sign} />
                    )}
                    {profile.dating_intentions && (
                      <DetailRow label="Looking For" value={profile.dating_intentions.replace(/_/g, " ")} />
                    )}
                  </div>
                </section>

                {/* Lifestyle Card */}
                {(profile.smoking || profile.drinking || profile.exercise || profile.wants_kids) && (
                  <section className="bg-white rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Lifestyle</h3>
                    <div className="space-y-3">
                      {profile.smoking && (
                        <DetailRow label="Smoking" value={profile.smoking} />
                      )}
                      {profile.drinking && (
                        <DetailRow label="Drinking" value={profile.drinking} />
                      )}
                      {profile.exercise && (
                        <DetailRow label="Exercise" value={profile.exercise} />
                      )}
                      {profile.wants_kids && (
                        <DetailRow label="Wants Kids" value={profile.wants_kids.replace(/_/g, " ")} />
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper component for detail rows
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 capitalize">{value}</span>
    </div>
  );
}
