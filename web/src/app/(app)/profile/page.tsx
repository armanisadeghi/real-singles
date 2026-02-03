import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Settings, 
  Edit3, 
  CheckCircle,
  Camera,
  PauseCircle,
  Plus,
  ChevronRight,
  Mic,
  Video,
  Image as ImageIcon,
  ShieldCheck,
  BadgeCheck,
  IdCard,
} from "lucide-react";
import { ReferralCard } from "@/components/profile/ReferralCard";
import { ShareButton } from "@/components/profile/ShareButton";
import { ProfileCompletionBadge } from "@/components/profile/ProfileCompletionBadge";
import { VoiceVideoDisplayClient } from "./VoiceVideoDisplayClient";
import { ProfilePreviewButton } from "./ProfilePreviewButton";
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
import { cn } from "@/lib/utils";

// Server-side completion calculation (mirrors API logic)
interface CompletionField {
  key: string;
  step: number;
  required: boolean;
}

// Complete field list for profile completion calculation
// This MUST match the API at /api/profile/completion
// Step numbers updated after reordering: bio/looking-for moved to steps 7-8
const COMPLETION_FIELDS: CompletionField[] = [
  // Required fields (steps 1-6)
  { key: "first_name", step: 1, required: true },
  { key: "date_of_birth", step: 2, required: true },
  { key: "gender", step: 3, required: true },
  { key: "looking_for", step: 4, required: true },
  // Verification (step 6)
  { key: "verification_selfie_url", step: 6, required: false },
  // About (steps 7-8) - HIGH PRIORITY, moved up
  { key: "bio", step: 7, required: false },
  { key: "looking_for_description", step: 8, required: false },
  // Physical (steps 9-10)
  { key: "height_inches", step: 9, required: false },
  { key: "body_type", step: 9, required: false },
  { key: "ethnicity", step: 10, required: false },
  // Relationship (step 11)
  { key: "dating_intentions", step: 11, required: false },
  { key: "marital_status", step: 11, required: false },
  // Location (step 12)
  { key: "country", step: 12, required: false },
  { key: "city", step: 12, required: false },
  { key: "state", step: 12, required: false },
  { key: "hometown", step: 12, required: false },
  // Career (steps 13-14)
  { key: "occupation", step: 13, required: false },
  { key: "company", step: 13, required: false },
  { key: "education", step: 14, required: false },
  { key: "schools", step: 14, required: false },
  // Beliefs (step 15)
  { key: "religion", step: 15, required: false },
  { key: "political_views", step: 15, required: false },
  // Lifestyle (steps 16-17)
  { key: "exercise", step: 16, required: false },
  { key: "languages", step: 17, required: false },
  // Habits (step 18)
  { key: "smoking", step: 18, required: false },
  { key: "drinking", step: 18, required: false },
  { key: "marijuana", step: 18, required: false },
  // Family (steps 19-20)
  { key: "has_kids", step: 19, required: false },
  { key: "wants_kids", step: 19, required: false },
  { key: "pets", step: 20, required: false },
  // Personality (steps 21-22)
  { key: "interests", step: 21, required: false },
  { key: "life_goals", step: 22, required: false },
  { key: "zodiac_sign", step: 2, required: false },
  // Prompts (steps 23-32)
  { key: "ideal_first_date", step: 23, required: false },
  { key: "non_negotiables", step: 24, required: false },
  { key: "way_to_heart", step: 25, required: false },
  { key: "after_work", step: 26, required: false },
  { key: "nightclub_or_home", step: 27, required: false },
  { key: "pet_peeves", step: 28, required: false },
  { key: "craziest_travel_story", step: 29, required: false },
  { key: "weirdest_gift", step: 30, required: false },
  { key: "worst_job", step: 31, required: false },
  { key: "dream_job", step: 32, required: false },
  { key: "past_event", step: 32, required: false },
  // Social (step 33)
  { key: "social_link_1", step: 33, required: false },
  { key: "social_link_2", step: 33, required: false },
  // Media (voice & video) - not in onboarding steps
  { key: "voice_prompt_url", step: 34, required: false },
  { key: "video_intro_url", step: 34, required: false },
];

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function calculateProfileCompletion(
  profile: Record<string, unknown>,
  photoCount: number
): { percentage: number; completedCount: number; totalCount: number; incompleteFields: string[] } {
  const skippedFields = (profile.profile_completion_skipped as string[]) || [];
  const preferNotFields = (profile.profile_completion_prefer_not as string[]) || [];
  
  let completedCount = 0;
  const incompleteFields: string[] = [];
  
  for (const field of COMPLETION_FIELDS) {
    const value = profile[field.key];
    const isPreferNot = preferNotFields.includes(field.key);
    
    if (hasValue(value) || isPreferNot) {
      completedCount++;
    } else {
      incompleteFields.push(field.key);
    }
  }
  
  // Photos count as 1 field
  const hasPhotos = hasValue(profile.profile_image_url) || photoCount > 0;
  if (hasPhotos) completedCount++;
  
  const totalCount = COMPLETION_FIELDS.length + 1; // +1 for photos
  const percentage = Math.round((completedCount / totalCount) * 100);
  
  return { percentage, completedCount, totalCount, incompleteFields };
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

  // Count photos (images only, not videos)
  const photoCount = (gallery || []).filter(g => g.media_type === "image").length;

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

  // Calculate completion
  const completion = profile 
    ? calculateProfileCompletion(profile, photoCount)
    : { percentage: 0, completedCount: 0, totalCount: COMPLETION_FIELDS.length + 1, incompleteFields: [] };

  return {
    user: { ...user, ...userData },
    profile: profile ? { 
      ...profile, 
      profile_image_url: profileImageUrl,
      voice_prompt_url: voicePromptUrl,
      video_intro_url: videoIntroUrl,
    } : null,
    gallery: galleryWithUrls,
    photoCount,
    completion,
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

  const { user, profile, gallery, photoCount, completion } = data;
  const hasProfile = profile !== null;

  // Completion color based on percentage
  const getCompletionColor = (pct: number) => {
    if (pct < 100) return "text-gray-700 dark:text-gray-300";
    return "text-brand-primary";
  };

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
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6">
              <Edit3 className="w-8 h-8 sm:w-10 sm:h-10 text-brand-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">Complete Your Profile</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 sm:mb-8">
              Add your details to start connecting with other singles.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-lg font-medium hover:from-brand-primary-light hover:to-brand-primary transition-all duration-200 active:scale-[0.98] shadow-sm"
            >
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
                  <div className="w-[72px] h-[72px] sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gray-100 dark:bg-neutral-800 shadow-lg">
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

                  {/* Action Buttons - Icon only for compact fit */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Link
                      href="/profile/edit"
                      className="inline-flex items-center justify-center w-8 h-8 bg-brand-primary text-white rounded-full hover:bg-brand-primary-dark transition-all duration-200 active:scale-[0.98] shadow-sm"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/settings"
                      className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.97]"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                    <ShareButton
                      referralCode={user.referral_code || ""}
                      className="h-8 w-8 !px-0"
                      labelVisibility="never"
                    />
                    <ProfilePreviewButton
                      profile={profile}
                      gallery={gallery}
                      userName={profile.first_name || user.display_name || "You"}
                      iconOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar - 4 columns with completion score */}
          <div className="bg-gray-50/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b dark:border-neutral-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-4 divide-x divide-gray-200 dark:divide-neutral-700">
                <div className="py-3 sm:py-4 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-brand-primary">
                    {user.points_balance || 0}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Points</div>
                </div>
                <div className="py-3 sm:py-4 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{photoCount}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Photos</div>
                </div>
                <div className="py-3 sm:py-4 text-center">
                  <div className="flex items-center justify-center h-6 sm:h-8">
                    {profile.is_verified ? (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                    ) : (
                      <span className="text-lg sm:text-2xl font-bold text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Verified</div>
                </div>
                <Link 
                  href="/onboarding?resume=true"
                  className="py-3 sm:py-4 text-center hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className={cn(
                    "text-lg sm:text-2xl font-bold",
                    getCompletionColor(completion.percentage)
                  )}>
                    {completion.percentage}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Complete</div>
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Completion Badge */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <ProfileCompletionBadge variant="expanded" />
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
            <div className="grid lg:grid-cols-[minmax(0,1fr),400px] gap-6 lg:gap-8">
              {/* Left Column - Main Content */}
              <div className="min-w-0 space-y-6">
                {/* About */}
                <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">About</h3>
                    <Link href="/profile/edit" className="text-sm text-brand-primary font-semibold hover:text-brand-primary-dark transition-colors">Edit</Link>
                  </div>
                  {profile.bio ? (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-[15px] lg:text-base whitespace-pre-wrap">{profile.bio}</p>
                  ) : (
                    <AddFieldPrompt label="Tell others about yourself" step={7} />
                  )}
                </section>

                {/* Profile Prompts - Always show all */}
                <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Profile Prompts</h3>
                    <Link href="/profile/edit" className="text-sm text-brand-primary font-semibold hover:text-brand-primary-dark transition-colors">Edit</Link>
                  </div>
                  <div className="space-y-6">
                    <PromptField question="My ideal first date" answer={profile.ideal_first_date} step={23} />
                    <PromptField question="My non-negotiables" answer={profile.non_negotiables} step={24} />
                    <PromptField question="The way to my heart" answer={profile.way_to_heart} step={25} />
                    <PromptField question="After work you'll find me" answer={profile.after_work} step={26} />
                    <PromptField question="My pet peeves" answer={profile.pet_peeves} step={28} />
                    <PromptField question="Nightclub or cozy night in?" answer={profile.nightclub_or_home} step={27} />
                    <PromptField question="Worst job I've had" answer={profile.worst_job} step={31} />
                    <PromptField question="My dream job" answer={profile.dream_job} step={32} />
                    <PromptField question="Craziest travel story" answer={profile.craziest_travel_story} step={29} />
                    <PromptField question="Weirdest gift I've received" answer={profile.weirdest_gift} step={30} />
                    <PromptField question="Past event I'd attend" answer={profile.past_event} step={32} />
                  </div>
                </section>

                {/* Voice & Video Section - Always show */}
                <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Voice & Video</h3>
                    <Link href="/profile/edit#voice-video" className="text-sm text-brand-primary font-semibold hover:text-brand-primary-dark transition-colors">Edit</Link>
                  </div>
                  {profile.voice_prompt_url || profile.video_intro_url ? (
                    <VoiceVideoDisplayClient
                      voicePromptUrl={profile.voice_prompt_url}
                      voicePromptDuration={profile.voice_prompt_duration_seconds}
                      videoIntroUrl={profile.video_intro_url}
                      videoIntroDuration={profile.video_intro_duration_seconds}
                      userName={profile.first_name || user.display_name || "You"}
                    />
                  ) : null}
                  <div className="space-y-3 mt-3">
                    {!profile.voice_prompt_url && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
                          <Mic className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Voice Prompt</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Record a 30-second voice intro</p>
                        </div>
                        <Link href="/profile/edit#voice-video" className="text-sm text-brand-primary font-medium flex items-center gap-1 hover:text-brand-primary-dark">
                          <Plus className="w-4 h-4" /> Add
                        </Link>
                      </div>
                    )}
                    {!profile.video_intro_url && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
                          <Video className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Video Intro</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Record a 60-second video intro</p>
                        </div>
                        <Link href="/profile/edit#voice-video" className="text-sm text-brand-primary font-medium flex items-center gap-1 hover:text-brand-primary-dark">
                          <Plus className="w-4 h-4" /> Add
                        </Link>
                      </div>
                    )}
                  </div>
                </section>

                {/* Gallery - Always show */}
                <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Gallery ({photoCount} photos)</h3>
                    <Link href="/profile/gallery" className="text-sm text-brand-primary font-semibold hover:text-brand-primary-dark transition-colors">Manage</Link>
                  </div>
                  {gallery.length > 0 ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 lg:gap-3">
                        {gallery.slice(0, 6).map((item) => {
                          const isVideo = item.media_type === "video";
                          return (
                            <div key={item.id} className="aspect-square rounded-xl lg:rounded-2xl overflow-hidden bg-gray-100 dark:bg-neutral-800 shadow-sm">
                              {isVideo ? (
                                <video src={item.media_url} className="w-full h-full object-cover" muted playsInline />
                              ) : (
                                <img src={item.media_url} alt="Gallery photo" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 ease-out" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {gallery.length > 6 && (
                        <Link href="/profile/gallery" className="block text-center text-sm text-gray-500 dark:text-gray-400 font-medium mt-4 hover:text-brand-primary transition-colors">
                          +{gallery.length - 6} more
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Add Photos</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Upload photos to your gallery</p>
                      </div>
                      <Link href="/profile/gallery" className="text-sm text-brand-primary font-medium flex items-center gap-1 hover:text-brand-primary-dark">
                        <Plus className="w-4 h-4" /> Add
                      </Link>
                    </div>
                  )}
                </section>

                {/* Interests - Always show */}
                <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Interests</h3>
                    <Link href="/onboarding?step=21" className="text-sm text-brand-primary font-semibold hover:text-brand-primary-dark transition-colors">Edit</Link>
                  </div>
                  {profile.interests && (profile.interests as string[]).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(profile.interests as string[]).map((interest) => (
                        <span key={interest} className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium border border-gray-200 dark:border-neutral-700">
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <AddFieldPrompt label="Add your interests" step={21} />
                  )}
                </section>

                {/* Life Goals - Always show */}
                <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Life Goals</h3>
                    <Link href="/onboarding?step=22" className="text-sm text-brand-primary font-semibold hover:text-brand-primary-dark transition-colors">Edit</Link>
                  </div>
                  {profile.life_goals && (profile.life_goals as string[]).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(profile.life_goals as string[]).map((goal) => (
                        <span key={goal} className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium border border-gray-200 dark:border-neutral-700">
                          {goal}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <AddFieldPrompt label="Add your life goals" step={22} />
                  )}
                </section>
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Referral Card */}
                {user.referral_code && (
                  <ReferralCard referralCode={user.referral_code} />
                )}

                {/* Verification Status - Always show */}
                <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Verification</h3>
                  <div className="space-y-3">
                    <VerificationRow 
                      icon={<ShieldCheck className="w-5 h-5" />}
                      label="Selfie Verification" 
                      verified={profile.is_verified || false}
                      href="/onboarding?step=6"
                    />
                    <VerificationRow 
                      icon={<BadgeCheck className="w-5 h-5" />}
                      label="Photo Verified" 
                      verified={profile.is_photo_verified || false}
                      href="/onboarding?step=5"
                    />
                    <VerificationRow 
                      icon={<IdCard className="w-5 h-5" />}
                      label="ID Verified" 
                      verified={profile.is_id_verified || false}
                      href="/profile/edit"
                      premium
                    />
                  </div>
                </section>

                {/* About Me - Always show all fields */}
                <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">About Me</h3>
                    <Link href="/onboarding?step=9" className="text-sm text-brand-primary font-semibold hover:text-brand-primary-dark transition-colors">Edit</Link>
                  </div>
                  <div className="space-y-3">
                    <DetailRowWithAdd label="Gender" value={profile.gender ? getGenderLabel(profile.gender) : null} step={3} />
                    <DetailRowWithAdd label="Height" value={profile.height_inches ? formatHeight(profile.height_inches) : null} step={9} />
                    <DetailRowWithAdd label="Body Type" value={profile.body_type ? getBodyTypeLabel(profile.body_type) : null} step={9} />
                    <DetailRowWithAdd label="Ethnicity" value={profile.ethnicity && profile.ethnicity.length > 0 ? getEthnicityLabels(profile.ethnicity) : null} step={10} />
                    <DetailRowWithAdd label="Marital Status" value={profile.marital_status ? getMaritalStatusLabel(profile.marital_status) : null} step={11} />
                    <DetailRowWithAdd label="Zodiac" value={profile.zodiac_sign ? getZodiacLabel(profile.zodiac_sign) : null} step={2} />
                    <DetailRowWithAdd label="Hometown" value={profile.hometown || null} step={12} />
                    <DetailRowWithAdd label="Dating Intentions" value={profile.dating_intentions ? getDatingIntentionsLabel(profile.dating_intentions) : null} step={11} />
                  </div>
                </section>

                {/* Education & Career - Always show all fields */}
                <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Education & Career</h3>
                    <Link href="/onboarding?step=13" className="text-sm text-brand-primary font-semibold hover:text-brand-primary-dark transition-colors">Edit</Link>
                  </div>
                  <div className="space-y-3">
                    <DetailRowWithAdd label="Education" value={profile.education ? getEducationLabel(profile.education) : null} step={14} />
                    <DetailRowWithAdd label="Schools" value={profile.schools && profile.schools.length > 0 ? (profile.schools as string[]).join(", ") : null} step={14} />
                    <DetailRowWithAdd label="Occupation" value={profile.occupation || null} step={13} />
                    <DetailRowWithAdd label="Company" value={profile.company || null} step={13} />
                  </div>
                </section>

                {/* Lifestyle - Always show all fields */}
                <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Lifestyle</h3>
                    <Link href="/onboarding?step=18" className="text-sm text-brand-primary font-semibold hover:text-brand-primary-dark transition-colors">Edit</Link>
                  </div>
                  <div className="space-y-3">
                    <DetailRowWithAdd label="Smoking" value={profile.smoking ? getSmokingLabel(profile.smoking) : null} step={18} />
                    <DetailRowWithAdd label="Drinking" value={profile.drinking ? getDrinkingLabel(profile.drinking) : null} step={18} />
                    <DetailRowWithAdd label="Marijuana" value={profile.marijuana ? getMarijuanaLabel(profile.marijuana) : null} step={18} />
                    <DetailRowWithAdd label="Exercise" value={profile.exercise ? getExerciseLabel(profile.exercise) : null} step={16} />
                  </div>
                </section>

                {/* Family - Always show all fields */}
                <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Family</h3>
                    <Link href="/onboarding?step=19" className="text-sm text-brand-primary font-semibold hover:text-brand-primary-dark transition-colors">Edit</Link>
                  </div>
                  <div className="space-y-3">
                    <DetailRowWithAdd label="Has Kids" value={profile.has_kids ? getHasKidsLabel(profile.has_kids) : null} step={19} />
                    <DetailRowWithAdd label="Wants Kids" value={profile.wants_kids ? getWantsKidsLabel(profile.wants_kids) : null} step={19} />
                    <DetailRowWithAdd label="Pets" value={profile.pets && profile.pets.length > 0 ? (profile.pets as string[]).map(p => getPetsLabel(p)).join(", ") : null} step={20} />
                  </div>
                </section>

                {/* Additional Info - Always show all fields */}
                <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Additional Info</h3>
                    <Link href="/onboarding?step=15" className="text-sm text-brand-primary font-semibold hover:text-brand-primary-dark transition-colors">Edit</Link>
                  </div>
                  <div className="space-y-3">
                    <DetailRowWithAdd label="Religion" value={profile.religion ? getReligionLabel(profile.religion) : null} step={15} />
                    <DetailRowWithAdd label="Politics" value={profile.political_views ? getPoliticalLabel(profile.political_views) : null} step={15} />
                    <DetailRowWithAdd label="Looking For" value={profile.looking_for && profile.looking_for.length > 0 ? (profile.looking_for as string[]).map(g => getGenderLabel(g)).join(", ") : null} step={4} />
                    <DetailRowWithAdd label="Languages" value={profile.languages && profile.languages.length > 0 ? (profile.languages as string[]).join(", ") : null} step={17} />
                  </div>
                </section>

                {/* Social Links - Always show */}
                <section className="bg-white dark:bg-neutral-900 rounded-2xl p-5 lg:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Social Links</h3>
                    <Link href="/onboarding?step=33" className="text-sm text-brand-primary font-semibold hover:text-brand-primary-dark transition-colors">Edit</Link>
                  </div>
                  <div className="space-y-2">
                    {profile.social_link_1 ? (
                      <a href={profile.social_link_1} target="_blank" rel="noopener noreferrer" className="block text-sm text-brand-primary hover:text-brand-primary-dark font-medium break-all">
                        {profile.social_link_1}
                      </a>
                    ) : (
                      <DetailRowWithAdd label="Social Link 1" value={null} step={33} />
                    )}
                    {profile.social_link_2 ? (
                      <a href={profile.social_link_2} target="_blank" rel="noopener noreferrer" className="block text-sm text-brand-primary hover:text-brand-primary-dark font-medium break-all">
                        {profile.social_link_2}
                      </a>
                    ) : (
                      <DetailRowWithAdd label="Social Link 2" value={null} step={33} />
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper component for "Add" field prompts
function AddFieldPrompt({ label, href, step }: { label: string; href?: string; step?: number }) {
  const targetHref = step ? `/onboarding?step=${step}` : (href || "/onboarding?resume=true");
  return (
    <Link 
      href={targetHref}
      className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 hover:text-brand-primary transition-colors group"
    >
      <Plus className="w-4 h-4" />
      <span>{label}</span>
      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-1 transition-opacity" />
    </Link>
  );
}

// Helper component for detail rows with "Add" indicator
function DetailRowWithAdd({ label, value, step }: { label: string; value: string | null; step?: number }) {
  const href = step ? `/onboarding?step=${step}` : "/onboarding?resume=true";
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">{label}</span>
      {value ? (
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize text-right break-words">{value}</span>
      ) : (
        <Link href={href} className="text-sm text-gray-300 dark:text-gray-600 hover:text-brand-primary flex items-center gap-1 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </Link>
      )}
    </div>
  );
}

// Helper component for prompt fields (always show, with "Add" if empty)
function PromptField({ question, answer, step }: { question: string; answer: string | null | undefined; step?: number }) {
  const href = step ? `/onboarding?step=${step}` : "/onboarding?resume=true";
  return (
    <div>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{question}</p>
      {answer ? (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{answer}</p>
      ) : (
        <Link 
          href={href}
          className="inline-flex items-center gap-1 text-sm text-gray-300 dark:text-gray-600 hover:text-brand-primary transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add your answer</span>
        </Link>
      )}
    </div>
  );
}

// Helper component for verification status rows
function VerificationRow({ 
  icon, 
  label, 
  verified, 
  href,
  premium = false 
}: { 
  icon: React.ReactNode;
  label: string; 
  verified: boolean;
  href: string;
  premium?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center",
        verified 
          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
          : "bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {premium && !verified && (
          <p className="text-xs text-gray-500 dark:text-gray-400">Premium feature</p>
        )}
      </div>
      {verified ? (
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
      ) : (
        <Link href={href} className="text-sm text-brand-primary font-medium flex items-center gap-1 hover:text-brand-primary-dark">
          <Plus className="w-4 h-4" /> Verify
        </Link>
      )}
    </div>
  );
}
