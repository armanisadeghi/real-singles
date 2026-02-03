import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Settings, 
  Edit3, 
  CheckCircle,
  Sparkles,
  Camera,
  PauseCircle,
} from "lucide-react";
import { ReferralCard } from "@/components/profile/ReferralCard";
import { ShareButton } from "@/components/profile/ShareButton";
import { VoiceVideoDisplayClient } from "./VoiceVideoDisplayClient";
import {
  getEducationLabel,
  getReligionLabel,
  getZodiacLabel,
  getDatingIntentionsLabel,
  getSmokingLabel,
  getDrinkingLabel,
  getMarijuanaLabel,
  getExerciseLabel,
  getWantsKidsLabel,
  getHasKidsLabel,
  getBodyTypeLabel,
  getMaritalStatusLabel,
  getEthnicityLabels,
  getGenderLabel,
  getPoliticalLabel,
  getPetsLabel,
} from "@/types";

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
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-900">
      {!hasProfile ? (
        /* Empty State - No Profile Yet */
        <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 sm:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-pink-500 dark:text-pink-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">Complete Your Profile</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 sm:mb-8">
              Add your details to start connecting with other singles.
            </p>
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.97] shadow-lg shadow-pink-500/25"
            >
              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
              Get Started
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Profile Paused Banner */}
          {profile.profile_hidden && (
            <div className="bg-orange-500 text-white px-4 py-2.5 sm:py-3">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
                <PauseCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">
                  Profile paused — you won't appear to others
                </span>
                <Link
                  href="/settings"
                  className="text-xs sm:text-sm font-medium underline underline-offset-2 hover:no-underline"
                >
                  Unpause
                </Link>
              </div>
            </div>
          )}
          
          {/* Hero Header - Always Side-by-Side */}
          <div className="bg-white dark:bg-neutral-900 border-b dark:border-neutral-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Profile Photo */}
                <div className="relative shrink-0">
                  <div className="w-[72px] h-[72px] sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 shadow-lg">
                    {profile.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt={`Profile photo of ${profile.first_name || "user"}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl sm:text-4xl">👤</span>
                      </div>
                    )}
                  </div>
                  {profile.is_verified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-7 sm:h-7 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  )}
                  {/* Camera overlay for edit */}
                  <Link
                    href="/profile/gallery"
                    className="absolute inset-0 bg-black/0 hover:bg-black/20 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200"
                  >
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-lg" />
                  </Link>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Name & Age */}
                  <div className="flex items-baseline gap-1.5 sm:gap-2 mb-0.5">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                      {profile.first_name || user.display_name || "Your Name"}
                    </h1>
                    {profile.date_of_birth && (
                      <span className="text-base sm:text-xl text-gray-400 dark:text-gray-500 font-light shrink-0">
                        {calculateAge(profile.date_of_birth)}
                      </span>
                    )}
                  </div>

                  {/* Location & Occupation - Single line with separator */}
                  {(profile.city || profile.occupation) && (
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2.5 sm:mb-3 truncate">
                      {profile.city && (
                        <span>{profile.city}{profile.state ? `, ${profile.state}` : ""}</span>
                      )}
                      {profile.city && profile.occupation && (
                        <span className="mx-1 sm:mx-1.5 text-gray-300 dark:text-gray-600">•</span>
                      )}
                      {profile.occupation && (
                        <span>{profile.occupation}</span>
                      )}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Link
                      href="/profile/edit"
                      className="inline-flex items-center justify-center gap-1 h-8 px-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium rounded-full hover:from-pink-600 hover:to-rose-600 transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.97] shadow-md shadow-pink-500/20"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="inline-flex items-center justify-center gap-1 h-8 px-3 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.97]"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Settings</span>
                    </Link>
                    <ShareButton
                      referralCode={user.referral_code || ""}
                      className="h-8 px-3 text-sm"
                      labelVisibility="always"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar - Compact & Refined */}
          <div className="bg-gray-50/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b dark:border-neutral-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-neutral-700">
                <div className="py-3 sm:py-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                    {user.points_balance || 0}
                  </div>
                  <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Points</div>
                </div>
                <div className="py-3 sm:py-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{gallery.length}</div>
                  <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Photos</div>
                </div>
                <div className="py-3 sm:py-4 text-center">
                  <div className="flex items-center justify-center h-7 sm:h-8">
                    {profile.is_verified ? (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                    ) : (
                      <span className="text-xl sm:text-2xl font-bold text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </div>
                  <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Verified</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
            <div className="grid lg:grid-cols-[minmax(0,1fr),400px] gap-6 lg:gap-8">
              {/* Left Column - Main Content */}
              <div className="min-w-0 space-y-6">
                {/* About */}
                {profile.bio && (
                  <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">About</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-[15px] lg:text-base whitespace-pre-wrap">{profile.bio}</p>
                  </section>
                )}

                {/* Profile Prompts */}
                {(profile.ideal_first_date || profile.non_negotiables || profile.way_to_heart || 
                  profile.after_work || profile.pet_peeves || profile.nightclub_or_home ||
                  profile.worst_job || profile.dream_job || profile.craziest_travel_story ||
                  profile.weirdest_gift || profile.past_event) && (
                  <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">My Profile</h3>
                      <Link 
                        href="/profile/edit" 
                        className="text-sm text-pink-500 font-semibold hover:text-pink-600 transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                    <div className="space-y-6">
                      {profile.ideal_first_date && (
                        <PromptAnswer 
                          question="My ideal first date" 
                          answer={profile.ideal_first_date} 
                        />
                      )}
                      {profile.non_negotiables && (
                        <PromptAnswer 
                          question="My non-negotiables" 
                          answer={profile.non_negotiables} 
                        />
                      )}
                      {profile.way_to_heart && (
                        <PromptAnswer 
                          question="The way to my heart" 
                          answer={profile.way_to_heart} 
                        />
                      )}
                      {profile.after_work && (
                        <PromptAnswer 
                          question="After work you'll find me" 
                          answer={profile.after_work} 
                        />
                      )}
                      {profile.pet_peeves && (
                        <PromptAnswer 
                          question="My pet peeves" 
                          answer={profile.pet_peeves} 
                        />
                      )}
                      {profile.nightclub_or_home && (
                        <PromptAnswer 
                          question="Nightclub or cozy night in?" 
                          answer={profile.nightclub_or_home} 
                        />
                      )}
                      {profile.worst_job && (
                        <PromptAnswer 
                          question="Worst job I've had" 
                          answer={profile.worst_job} 
                        />
                      )}
                      {profile.dream_job && (
                        <PromptAnswer 
                          question="My dream job" 
                          answer={profile.dream_job} 
                        />
                      )}
                      {profile.craziest_travel_story && (
                        <PromptAnswer 
                          question="Craziest travel story" 
                          answer={profile.craziest_travel_story} 
                        />
                      )}
                      {profile.weirdest_gift && (
                        <PromptAnswer 
                          question="Weirdest gift I've received" 
                          answer={profile.weirdest_gift} 
                        />
                      )}
                      {profile.past_event && (
                        <PromptAnswer 
                          question="Past event I'd attend" 
                          answer={profile.past_event} 
                        />
                      )}
                    </div>
                  </section>
                )}

                {/* Voice & Video Section */}
                {(profile.voice_prompt_url || profile.video_intro_url) && (
                  <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Voice & Video</h3>
                      <Link 
                        href="/profile/edit#voice-video" 
                        className="text-sm text-pink-500 font-semibold hover:text-pink-600 transition-colors"
                      >
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
                  <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Gallery</h3>
                      <Link 
                        href="/profile/gallery" 
                        className="text-sm text-pink-500 font-semibold hover:text-pink-600 transition-colors"
                      >
                        Manage
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-2 lg:gap-3">
                      {gallery.slice(0, 6).map((item) => {
                        const isVideo = item.media_type === "video";
                        return (
                          <div key={item.id} className="aspect-square rounded-xl lg:rounded-2xl overflow-hidden bg-gray-100 dark:bg-neutral-800 shadow-sm">
                            {isVideo ? (
                              <video src={item.media_url} className="w-full h-full object-cover" muted playsInline />
                            ) : (
                              <img 
                                src={item.media_url} 
                                alt="Gallery photo" 
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 ease-out" 
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {gallery.length > 6 && (
                      <Link 
                        href="/profile/gallery" 
                        className="block text-center text-sm text-gray-500 dark:text-gray-400 font-medium mt-4 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
                      >
                        +{gallery.length - 6} more
                      </Link>
                    )}
                  </section>
                )}

                {/* Interests */}
                {profile.interests && (profile.interests as string[]).length > 0 && (
                  <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {(profile.interests as string[]).map((interest) => (
                        <span
                          key={interest}
                          className="px-4 py-2 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm font-semibold border border-pink-100 dark:border-pink-800"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Life Goals */}
                {profile.life_goals && (profile.life_goals as string[]).length > 0 && (
                  <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Life Goals</h3>
                    <div className="flex flex-wrap gap-2">
                      {(profile.life_goals as string[]).map((goal) => (
                        <span
                          key={goal}
                          className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold border border-blue-100 dark:border-blue-800"
                        >
                          {goal}
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

                {/* Basic Details */}
                <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">About Me</h3>
                  <div className="space-y-3">
                    {profile.gender && (
                      <DetailRow label="Gender" value={getGenderLabel(profile.gender)} />
                    )}
                    {profile.height_inches && (
                      <DetailRow label="Height" value={formatHeight(profile.height_inches)} />
                    )}
                    {profile.body_type && (
                      <DetailRow label="Body Type" value={getBodyTypeLabel(profile.body_type)} />
                    )}
                    {profile.ethnicity && profile.ethnicity.length > 0 && (
                      <DetailRow label="Ethnicity" value={getEthnicityLabels(profile.ethnicity)} />
                    )}
                    {profile.marital_status && (
                      <DetailRow label="Marital Status" value={getMaritalStatusLabel(profile.marital_status)} />
                    )}
                    {profile.zodiac_sign && (
                      <DetailRow label="Zodiac" value={getZodiacLabel(profile.zodiac_sign)} />
                    )}
                    {profile.hometown && (
                      <DetailRow label="Hometown" value={profile.hometown} />
                    )}
                  </div>
                </section>

                {/* Education & Career */}
                {(profile.education || profile.occupation || profile.company || (profile.schools && profile.schools.length > 0)) && (
                  <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Education & Career</h3>
                    <div className="space-y-3">
                      {profile.education && (
                        <DetailRow label="Education" value={getEducationLabel(profile.education)} />
                      )}
                      {profile.schools && profile.schools.length > 0 && (
                        <DetailRow label="Schools" value={(profile.schools as string[]).join(", ")} />
                      )}
                      {profile.occupation && (
                        <DetailRow label="Occupation" value={profile.occupation} />
                      )}
                      {profile.company && (
                        <DetailRow label="Company" value={profile.company} />
                      )}
                    </div>
                  </section>
                )}

                {/* Lifestyle */}
                {(profile.smoking || profile.drinking || profile.marijuana || profile.exercise || 
                  profile.has_kids || profile.wants_kids || (profile.pets && profile.pets.length > 0)) && (
                  <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Lifestyle</h3>
                    <div className="space-y-3">
                      {profile.smoking && (
                        <DetailRow label="Smoking" value={getSmokingLabel(profile.smoking)} />
                      )}
                      {profile.drinking && (
                        <DetailRow label="Drinking" value={getDrinkingLabel(profile.drinking)} />
                      )}
                      {profile.marijuana && (
                        <DetailRow label="Marijuana" value={getMarijuanaLabel(profile.marijuana)} />
                      )}
                      {profile.exercise && (
                        <DetailRow label="Exercise" value={getExerciseLabel(profile.exercise)} />
                      )}
                      {profile.has_kids && (
                        <DetailRow label="Has Kids" value={getHasKidsLabel(profile.has_kids)} />
                      )}
                      {profile.wants_kids && (
                        <DetailRow label="Wants Kids" value={getWantsKidsLabel(profile.wants_kids)} />
                      )}
                      {profile.pets && profile.pets.length > 0 && (
                        <DetailRow 
                          label="Pets" 
                          value={(profile.pets as string[]).map(p => getPetsLabel(p)).join(", ")} 
                        />
                      )}
                    </div>
                  </section>
                )}

                {/* Additional Info */}
                {(profile.religion || profile.political_views || profile.dating_intentions || 
                  (profile.languages && profile.languages.length > 0) || 
                  (profile.looking_for && profile.looking_for.length > 0)) && (
                  <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Additional Info</h3>
                    <div className="space-y-3">
                      {profile.religion && (
                        <DetailRow label="Religion" value={getReligionLabel(profile.religion)} />
                      )}
                      {profile.political_views && (
                        <DetailRow label="Politics" value={getPoliticalLabel(profile.political_views)} />
                      )}
                      {profile.dating_intentions && (
                        <DetailRow label="Dating Intentions" value={getDatingIntentionsLabel(profile.dating_intentions)} />
                      )}
                      {profile.looking_for && profile.looking_for.length > 0 && (
                        <DetailRow 
                          label="Looking For" 
                          value={(profile.looking_for as string[]).join(", ")} 
                        />
                      )}
                      {profile.languages && profile.languages.length > 0 && (
                        <DetailRow label="Languages" value={(profile.languages as string[]).join(", ")} />
                      )}
                    </div>
                  </section>
                )}

                {/* Social Links */}
                {(profile.social_link_1 || profile.social_link_2) && (
                  <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Social Links</h3>
                    <div className="space-y-2">
                      {profile.social_link_1 && (
                        <a 
                          href={profile.social_link_1} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-pink-500 hover:text-pink-600 font-medium break-all"
                        >
                          {profile.social_link_1}
                        </a>
                      )}
                      {profile.social_link_2 && (
                        <a 
                          href={profile.social_link_2} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-pink-500 hover:text-pink-600 font-medium break-all"
                        >
                          {profile.social_link_2}
                        </a>
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
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize text-right break-words">{value}</span>
    </div>
  );
}

// Helper component for prompt answers
function PromptAnswer({ question, answer }: { question: string; answer: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{question}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{answer}</p>
    </div>
  );
}
