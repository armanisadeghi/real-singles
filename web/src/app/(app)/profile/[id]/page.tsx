"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { cn, calculateAge, formatHeight } from "@/lib/utils";
import { VoiceVideoDisplay } from "@/components/profile";

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
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Touch/swipe state for mobile photo navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Fullscreen image viewer state (desktop)
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);

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
  }, [userId]);

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

  const nextPhoto = useCallback(() => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  }, [photos.length]);

  const prevPhoto = useCallback(() => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  }, [photos.length]);

  // Keyboard navigation for fullscreen viewer
  useEffect(() => {
    if (!showFullscreenImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFullscreenImage(false);
      } else if (e.key === 'ArrowRight') {
        nextPhoto();
      } else if (e.key === 'ArrowLeft') {
        prevPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullscreenImage, nextPhoto, prevPhoto]);

  // Minimum swipe distance threshold (in pixels)
  const minSwipeDistance = 50;

  // Touch handlers for swipe navigation
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isTransitioning) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeOffset(0);
  }, [isTransitioning]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (isTransitioning || touchStart === null) return;
    const currentX = e.targetTouches[0].clientX;
    setTouchEnd(currentX);
    // Calculate swipe offset with resistance at edges
    const rawOffset = currentX - touchStart;
    const isAtStart = currentPhotoIndex === 0 && rawOffset > 0;
    const isAtEnd = currentPhotoIndex === photos.length - 1 && rawOffset < 0;
    const resistance = isAtStart || isAtEnd ? 0.3 : 1;
    setSwipeOffset(rawOffset * resistance);
  }, [isTransitioning, touchStart, currentPhotoIndex, photos.length]);

  const onTouchEnd = useCallback(() => {
    if (isTransitioning || touchStart === null) return;

    const distance = touchStart - (touchEnd ?? touchStart);
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    setIsTransitioning(true);

    if (isLeftSwipe && currentPhotoIndex < photos.length - 1) {
      nextPhoto();
    } else if (isRightSwipe && currentPhotoIndex > 0) {
      prevPhoto();
    }

    // Reset swipe offset with animation
    setSwipeOffset(0);

    // Reset touch state after transition
    setTimeout(() => {
      setTouchStart(null);
      setTouchEnd(null);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, touchStart, touchEnd, nextPhoto, prevPhoto, currentPhotoIndex, photos.length]);

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevPhoto();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextPhoto();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevPhoto, nextPhoto]);

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
      <div className="min-h-[calc(100dvh-var(--header-height))] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-[calc(100dvh-var(--header-height))] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error || "Profile not found"}</p>
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
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-var(--header-height))] bg-gray-50">
      {/* Hero Section with Photo - constrained to max-w-6xl for desktop consistency */}
      <div className="max-w-6xl mx-auto">
        <div className="relative">
          {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-20 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Photo Gallery */}
        <div
          className="relative aspect-[3/4] sm:aspect-[4/3] md:aspect-[4/3] lg:aspect-[16/10] max-h-[600px] mx-auto bg-gradient-to-br from-pink-100 to-purple-100 touch-none select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {photos.length > 0 ? (
            <img
              src={photos[currentPhotoIndex]}
              alt=""
              className="w-full h-full object-cover select-none cursor-pointer"
              draggable={false}
              onClick={() => setShowFullscreenImage(true)}
              style={{
                transform: `translateX(${swipeOffset}px)`,
                transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl">👤</span>
                </div>
                <p className="text-gray-500">No photo available</p>
              </div>
            </div>
          )}

          {/* Gradient overlay - rendered first with lower z-index and pointer-events-none */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-[1] pointer-events-none" />

          {/* Tap zones for mobile navigation (hidden on md+) */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-0 top-0 w-1/3 h-full md:hidden z-20 focus:outline-none"
                aria-label="Previous photo"
              />
              <button
                onClick={nextPhoto}
                className="absolute right-0 top-0 w-1/3 h-full md:hidden z-20 focus:outline-none"
                aria-label="Next photo"
              />
            </>
          )}

          {/* Photo navigation - always render structure, let CSS handle visibility */}
          {photos.length > 1 && (
            <>
              {/* Dots indicator */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhotoIndex(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === currentPhotoIndex
                        ? "w-6 bg-white"
                        : "w-1.5 bg-white/60 hover:bg-white/80"
                    )}
                  />
                ))}
              </div>

              {/* Arrow buttons - visible on md+ screens */}
              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/95 backdrop-blur rounded-full items-center justify-center shadow-lg ring-1 ring-black/10 hover:bg-white transition-colors hidden md:flex z-20"
              >
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/95 backdrop-blur rounded-full items-center justify-center shadow-lg ring-1 ring-black/10 hover:bg-white transition-colors hidden md:flex z-20"
              >
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>
            </>
          )}

          {/* Verified badge */}
          {profile.is_verified && (
            <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 z-20">
              <CheckCircle className="w-4 h-4" />
              Verified
            </div>
          )}

          {/* Basic info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-[5]">
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
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3">
          <div
            className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide sm:justify-center"
            style={{
              touchAction: 'pan-x',
              overscrollBehaviorX: 'contain'
            }}
          >
            <button
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium transition-all text-sm sm:text-base",
                isFavorite
                  ? "bg-pink-100 text-pink-600 hover:bg-pink-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {favoriteLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Heart
                  className={cn("w-4 h-4 sm:w-5 sm:h-5", isFavorite && "fill-current")}
                />
              )}
              {isFavorite ? "Favorited" : "Favorite"}
            </button>

            <button
              onClick={handleMessage}
              disabled={isPending}
              className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-medium hover:from-pink-600 hover:to-rose-600 transition-all text-sm sm:text-base"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              Message
            </button>

            <button
              onClick={handleShare}
              className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-all text-sm sm:text-base"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
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
              <section className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {profile.About}
                </p>
              </section>
            )}

            {/* Voice & Video Section */}
            {(profile.VoicePromptUrl || profile.VideoIntroUrl) && (
              <section className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Hear from {profile.DisplayName || profile.FirstName}</h2>
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
              <section className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Get to Know Me</h2>
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
              <section className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Interests
                </h2>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 rounded-full text-sm font-medium border border-pink-100"
                    >
                      {interest.charAt(0).toUpperCase() + interest.slice(1)}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery */}
            {profile.gallery && profile.gallery.length > 0 && (
              <section className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Gallery
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {profile.gallery.slice(0, 6).map((item, i) => (
                    <div
                      key={item.id || i}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100"
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
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
                    value={profile.BodyType}
                  />
                )}
                {profile.Ethnicity?.length > 0 && (
                  <InfoRow
                    icon={<Sparkles className="w-4 h-4" />}
                    label="Ethnicity"
                    value={Array.isArray(profile.Ethnicity) ? profile.Ethnicity.join(", ") : profile.Ethnicity}
                  />
                )}
                {profile.DatingIntentions && (
                  <InfoRow
                    icon={<Heart className="w-4 h-4" />}
                    label="Looking For"
                    value={profile.DatingIntentions.replace(/_/g, " ")}
                  />
                )}
              </div>
            </section>

            {/* Lifestyle */}
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Lifestyle
              </h2>
              <div className="space-y-4">
                {profile.Education && (
                  <InfoRow
                    icon={<GraduationCap className="w-4 h-4" />}
                    label="Education"
                    value={profile.Education}
                  />
                )}
                {profile.Religion && (
                  <InfoRow
                    icon={<Church className="w-4 h-4" />}
                    label="Religion"
                    value={profile.Religion}
                  />
                )}
                {profile.Smoking && (
                  <InfoRow
                    icon={<Cigarette className="w-4 h-4" />}
                    label="Smoking"
                    value={profile.Smoking}
                  />
                )}
                {profile.Drinks && (
                  <InfoRow
                    icon={<Wine className="w-4 h-4" />}
                    label="Drinking"
                    value={profile.Drinks}
                  />
                )}
                {profile.Marijuana && (
                  <InfoRow
                    icon={<Cannabis className="w-4 h-4" />}
                    label="Marijuana"
                    value={profile.Marijuana}
                  />
                )}
              </div>
            </section>

            {/* Family */}
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Family</h2>
              <div className="space-y-4">
                {profile.HaveChild && (
                  <InfoRow
                    icon={<Baby className="w-4 h-4" />}
                    label="Has Children"
                    value={profile.HaveChild}
                  />
                )}
                {profile.WantChild && (
                  <InfoRow
                    icon={<Baby className="w-4 h-4" />}
                    label="Wants Children"
                    value={profile.WantChild}
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
              <section className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Horoscope
                </h2>
                <div className="flex flex-wrap gap-2">
                  {horoscopes.map((sign, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
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

      {/* Fullscreen Image Viewer */}
      {showFullscreenImage && photos.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setShowFullscreenImage(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setShowFullscreenImage(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Photo counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur px-4 py-1.5 rounded-full text-white text-sm font-medium">
            {currentPhotoIndex + 1} / {photos.length}
          </div>

          {/* Image container - click stops propagation to allow zoom */}
          <div 
            className="relative w-full h-full flex items-center justify-center p-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[currentPhotoIndex]}
              alt=""
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
          </div>

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* Thumbnail strip at bottom */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur p-2 rounded-xl">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex(i);
                  }}
                  className={cn(
                    "w-12 h-12 rounded-lg overflow-hidden transition-all",
                    i === currentPhotoIndex
                      ? "ring-2 ring-white ring-offset-2 ring-offset-black/50"
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={photo}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
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
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900 capitalize">{value}</span>
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
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100/50">
      <p className="text-sm font-medium text-pink-700 mb-2">{prompt}</p>
      <p className="text-gray-700 leading-relaxed">{response}</p>
    </div>
  );
}
