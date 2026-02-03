"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Briefcase,
  CheckCircle,
  Calendar,
  Ruler,
  GraduationCap,
  Church,
  Cigarette,
  Wine,
  Cannabis,
  Baby,
  PawPrint,
  Sparkles,
  ImageIcon,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn, calculateAge, formatHeight } from "@/lib/utils";
import { VoiceVideoDisplay } from "@/components/profile";
import { PhotoCarousel } from "@/components/search/PhotoCarousel";
import {
  getBodyTypeLabel,
  getEducationLabel,
  getReligionLabel,
  getDatingIntentionsLabel,
  getSmokingLabel,
  getDrinkingLabel,
  getMarijuanaLabel,
  getHasKidsLabel,
  getWantsKidsLabel,
  getEthnicityLabels,
} from "@/types";

interface ProfileData {
  ID: string;
  id: string;
  Email: string;
  DisplayName: string;
  FirstName: string;
  LastName: string;
  DOB: string;
  Gender: string;
  Image: string;
  livePicture: string;
  About: string;
  City: string;
  State: string;
  Height: string;
  BodyType: string;
  Ethnicity: string[];
  Religion: string;
  Education: string;
  JobTitle: string;
  Smoking: string;
  Drinks: string;
  Marijuana: string;
  HaveChild: string;
  WantChild: string;
  Pets: string;
  HSign: string;
  Interest: string;
  DatingIntentions: string;
  // Profile Prompts
  IdealFirstDate: string;
  NonNegotiables: string;
  WorstJob: string;
  DreamJob: string;
  NightclubOrHome: string;
  PetPeeves: string;
  AfterWork: string;
  WayToHeart: string;
  CraziestTravelStory: string;
  WeirdestGift: string;
  PastEvent: string;
  is_verified: boolean;
  IsFavorite: number;
  FollowStatus: string;
  IsMatched: boolean;
  // Voice & Video Prompts
  VoicePromptUrl?: string;
  VideoIntroUrl?: string;
  VoicePromptDurationSeconds?: number | null;
  VideoIntroDurationSeconds?: number | null;
  gallery: Array<{
    id: string;
    media_url: string;
    media_type: string;
    thumbnail_url?: string;
  }>;
}

export default function OtherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fetch profile data
  useEffect(() => {
    if (!userId) return;

    async function fetchProfile() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();

        if (data.success) {
          // If not matched, redirect to the discover profile page
          // The search profile page allows liking/passing, while this page is for matched users only
          if (!data.data.IsMatched) {
            router.replace(`/search/profile/${userId}`);
            return;
          }
          
          setProfile(data.data);
          setIsFavorite(data.data.IsFavorite === 1);
        } else {
          setError(data.msg || "Failed to load profile");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId, router]);

  // Build photo array (deduplicated to avoid showing primary image twice)
  const photos = profile
    ? [
        profile.Image,
        ...(profile.gallery
          ?.filter((g) => g.media_type === "image")
          .map((g) => g.media_url) || []),
      ]
      .filter(Boolean)
      .filter((url, index, arr) => arr.indexOf(url) === index) // Deduplicate by URL
    : [];

  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    if (!profile) return;
    setFavoriteLoading(true);

    try {
      const method = isFavorite ? "DELETE" : "POST";
      const res = await fetch(`/api/favorites/${profile.ID}`, { method });
      const data = await res.json();

      if (data.success) {
        setIsFavorite(!isFavorite);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!profile) return;

    const shareUrl = `${window.location.origin}/profile/${profile.ID}`;
    const shareText = `Check out ${profile.DisplayName}'s profile on RealSingles!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.DisplayName}'s Profile`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert("Profile link copied to clipboard!");
    }
  };

  // Handle message - create or find existing conversation
  const handleMessage = async () => {
    if (!profile) return;

    startTransition(async () => {
      try {
        // Create or find existing direct conversation
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "direct",
            participant_ids: [profile.ID],
          }),
        });

        const data = await res.json();

        if (data.success && data.data?.ConversationID) {
          router.push(`/chats/${data.data.ConversationID}`);
        } else {
          console.error("Failed to create conversation:", data.msg);
          alert(data.msg || "Failed to start conversation");
        }
      } catch (err) {
        console.error("Error creating conversation:", err);
        alert("Failed to start conversation. Please try again.");
      }
    });
  };

  // Parse interests
  const interests = profile?.Interest?.split(",").map((i) => i.trim()).filter(Boolean) || [];
  const horoscopes = profile?.HSign?.split(",").map((h) => h.trim()).filter(Boolean) || [];

  // Format height (assuming Height is in inches as string)
  const heightDisplay = profile?.Height
    ? formatHeight(parseInt(profile.Height))
    : null;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-var(--header-height))] flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-[calc(100dvh-var(--header-height))] flex items-center justify-center px-4 bg-gray-50 dark:bg-neutral-950">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Oops!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "Profile not found"}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-var(--header-height))] bg-gray-50 dark:bg-neutral-950">
      {/* Hero Section with Photo - full width on mobile, constrained on desktop */}
      <div className="relative md:max-w-6xl md:mx-auto">
        {/* Back button - floats over carousel */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-30 w-10 h-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg dark:shadow-black/30 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Verified badge - floats over carousel */}
        {profile.is_verified && (
          <div className="absolute top-4 right-4 z-30 bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            Verified
          </div>
        )}

        {/* Photo Carousel - reusable component with fullscreen support */}
        <PhotoCarousel
          images={photos}
          height="auto"
          showGradient={true}
          className="w-full aspect-[3/4] sm:aspect-[4/3] md:aspect-[4/3] lg:aspect-[16/10] md:max-h-[600px]"
        />

        {/* Basic info overlay - positioned over gradient */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-[5] pointer-events-none">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold">
                {profile.DisplayName || profile.FirstName || "Anonymous"}
              </h1>
              {profile.DOB && (
                <span className="text-2xl md:text-3xl font-light opacity-90">
                  {calculateAge(profile.DOB)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-white/90">
              {(profile.City || profile.State) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {[profile.City, profile.State].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {profile.JobTitle && (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  <span>{profile.JobTitle}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            {/* Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              className={cn(
                "flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all text-sm",
                isFavorite
                  ? "bg-pink-500 text-white hover:bg-pink-600"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
              )}
            >
              {favoriteLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
              )}
              {isFavorite ? "Saved" : "Save"}
            </button>

            {/* Message Button - Primary CTA */}
            <button
              onClick={handleMessage}
              disabled={isPending}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-all text-sm"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MessageCircle className="w-5 h-5" />
              )}
              Message
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all text-sm"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* About */}
            {profile.About && (
              <section className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm dark:shadow-black/20">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">About</h2>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                  {profile.About}
                </p>
              </section>
            )}

            {/* Voice & Video Section */}
            {(profile.VoicePromptUrl || profile.VideoIntroUrl) && (
              <section className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm dark:shadow-black/20">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Hear from {profile.DisplayName || profile.FirstName}</h2>
                <VoiceVideoDisplay
                  voicePromptUrl={profile.VoicePromptUrl}
                  voicePromptDuration={profile.VoicePromptDurationSeconds}
                  videoIntroUrl={profile.VideoIntroUrl}
                  videoIntroDuration={profile.VideoIntroDurationSeconds}
                  userName={profile.DisplayName || profile.FirstName || "User"}
                />
              </section>
            )}

            {/* Profile Prompts - Get to Know Me */}
            {(profile.IdealFirstDate || profile.NonNegotiables || profile.WayToHeart || 
              profile.AfterWork || profile.NightclubOrHome || profile.PetPeeves ||
              profile.CraziestTravelStory || profile.WeirdestGift || profile.WorstJob || profile.DreamJob) && (
              <section className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm dark:shadow-black/20">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Get to Know Me</h2>
                <div className="space-y-5">
                  {profile.IdealFirstDate && (
                    <PromptCard
                      prompt="My ideal first date starts with... and ends with..."
                      response={profile.IdealFirstDate}
                    />
                  )}
                  {profile.NonNegotiables && (
                    <PromptCard
                      prompt="My top non-negotiables"
                      response={profile.NonNegotiables}
                    />
                  )}
                  {profile.WayToHeart && (
                    <PromptCard
                      prompt="The way to my heart is through..."
                      response={profile.WayToHeart}
                    />
                  )}
                  {profile.AfterWork && (
                    <PromptCard
                      prompt="After work, you can find me..."
                      response={profile.AfterWork}
                    />
                  )}
                  {profile.NightclubOrHome && (
                    <PromptCard
                      prompt="Nightclub or night at home?"
                      response={profile.NightclubOrHome}
                    />
                  )}
                  {profile.PetPeeves && (
                    <PromptCard
                      prompt="My pet peeves"
                      response={profile.PetPeeves}
                    />
                  )}
                  {profile.CraziestTravelStory && (
                    <PromptCard
                      prompt="Craziest travel story"
                      response={profile.CraziestTravelStory}
                    />
                  )}
                  {profile.WeirdestGift && (
                    <PromptCard
                      prompt="Weirdest gift I've received"
                      response={profile.WeirdestGift}
                    />
                  )}
                  {profile.WorstJob && (
                    <PromptCard
                      prompt="The worst job I ever had"
                      response={profile.WorstJob}
                    />
                  )}
                  {profile.DreamJob && (
                    <PromptCard
                      prompt="The job I'd do for no money"
                      response={profile.DreamJob}
                    />
                  )}
                </div>
              </section>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <section className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm dark:shadow-black/20">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Interests
                </h2>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm font-medium border border-pink-100 dark:border-pink-800"
                    >
                      {interest.charAt(0).toUpperCase() + interest.slice(1)}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery */}
            {profile.gallery && profile.gallery.length > 0 && (
              <section className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm dark:shadow-black/20">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Gallery
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {profile.gallery.slice(0, 6).map((item, i) => (
                    <div
                      key={item.id || i}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-800"
                    >
                      {item.media_type === "video" ? (
                        <video
                          src={item.media_url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.media_url}
                          alt=""
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar - Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <section className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm dark:shadow-black/20">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Basic Info
              </h2>
              <div className="space-y-4">
                {profile.Gender && (
                  <InfoRow
                    icon={<Sparkles className="w-4 h-4" />}
                    label="Gender"
                    value={profile.Gender}
                  />
                )}
                {profile.DOB && (
                  <InfoRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="Age"
                    value={`${calculateAge(profile.DOB)} years`}
                  />
                )}
                {heightDisplay && (
                  <InfoRow
                    icon={<Ruler className="w-4 h-4" />}
                    label="Height"
                    value={heightDisplay}
                  />
                )}
                {profile.BodyType && (
                  <InfoRow
                    icon={<Sparkles className="w-4 h-4" />}
                    label="Body Type"
                    value={getBodyTypeLabel(profile.BodyType)}
                  />
                )}
                {profile.Ethnicity?.length > 0 && (
                  <InfoRow
                    icon={<Sparkles className="w-4 h-4" />}
                    label="Ethnicity"
                    value={getEthnicityLabels(profile.Ethnicity)}
                  />
                )}
                {profile.DatingIntentions && (
                  <InfoRow
                    icon={<Heart className="w-4 h-4" />}
                    label="Looking For"
                    value={getDatingIntentionsLabel(profile.DatingIntentions)}
                  />
                )}
              </div>
            </section>

            {/* Lifestyle */}
            <section className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm dark:shadow-black/20">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Lifestyle
              </h2>
              <div className="space-y-4">
                {profile.Education && (
                  <InfoRow
                    icon={<GraduationCap className="w-4 h-4" />}
                    label="Education"
                    value={getEducationLabel(profile.Education)}
                  />
                )}
                {profile.Religion && (
                  <InfoRow
                    icon={<Church className="w-4 h-4" />}
                    label="Religion"
                    value={getReligionLabel(profile.Religion)}
                  />
                )}
                {profile.Smoking && (
                  <InfoRow
                    icon={<Cigarette className="w-4 h-4" />}
                    label="Smoking"
                    value={getSmokingLabel(profile.Smoking)}
                  />
                )}
                {profile.Drinks && (
                  <InfoRow
                    icon={<Wine className="w-4 h-4" />}
                    label="Drinking"
                    value={getDrinkingLabel(profile.Drinks)}
                  />
                )}
                {profile.Marijuana && (
                  <InfoRow
                    icon={<Cannabis className="w-4 h-4" />}
                    label="Marijuana"
                    value={getMarijuanaLabel(profile.Marijuana)}
                  />
                )}
              </div>
            </section>

            {/* Family */}
            <section className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm dark:shadow-black/20">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Family</h2>
              <div className="space-y-4">
                {profile.HaveChild && (
                  <InfoRow
                    icon={<Baby className="w-4 h-4" />}
                    label="Has Children"
                    value={getHasKidsLabel(profile.HaveChild)}
                  />
                )}
                {profile.WantChild && (
                  <InfoRow
                    icon={<Baby className="w-4 h-4" />}
                    label="Wants Children"
                    value={getWantsKidsLabel(profile.WantChild)}
                  />
                )}
                {profile.Pets && (
                  <InfoRow
                    icon={<PawPrint className="w-4 h-4" />}
                    label="Pets"
                    value={profile.Pets}
                  />
                )}
              </div>
            </section>

            {/* Horoscope */}
            {horoscopes.length > 0 && (
              <section className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm dark:shadow-black/20">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Horoscope
                </h2>
                <div className="flex flex-wrap gap-2">
                  {horoscopes.map((sign, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                    >
                      {sign.charAt(0).toUpperCase() + sign.slice(1)}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

// Helper component for info rows
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{value}</span>
    </div>
  );
}

// Helper component for profile prompts
function PromptCard({
  prompt,
  response,
}: {
  prompt: string;
  response: string;
}) {
  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-pink-100/50 dark:border-pink-800/50">
      <p className="text-sm font-medium text-pink-700 dark:text-pink-300 mb-2">{prompt}</p>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{response}</p>
    </div>
  );
}
