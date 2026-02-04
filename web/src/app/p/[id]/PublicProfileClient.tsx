"use client";

/**
 * Public Profile Client Component
 * 
 * Mobile-first design with enticing CTA to convert visitors to users.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Share2,
  Loader2,
  User,
  CheckCircle,
  Heart,
  Sparkles,
  Users,
  Shield,
  MessageCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header, Footer } from "@/components/layout";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PublicProfile {
  first_name: string;
  age: number | null;
  location: string | null;
  bio: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
}

interface PublicProfileClientProps {
  userId: string;
  initialProfile: PublicProfile | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PublicProfileClient({ userId, initialProfile }: PublicProfileClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(initialProfile);
  const [isLoading, setIsLoading] = useState(!initialProfile);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User is authenticated - redirect to full profile
        router.replace(`/search/profile/${userId}`);
        return;
      }
      
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, [userId, router]);

  // Fetch profile data if not provided
  useEffect(() => {
    if (isCheckingAuth || initialProfile) return;
    
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/public/profile/${userId}`);
        if (!res.ok) {
          throw new Error("Profile not found");
        }
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
        } else {
          throw new Error(data.msg || "Failed to fetch profile");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Unable to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, isCheckingAuth, initialProfile]);

  const handleShare = async () => {
    if (!profile) return;
    
    const shareData = {
      title: `${profile.first_name} on RealSingles`,
      text: `Check out ${profile.first_name}'s profile on RealSingles`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show loading while fetching profile
  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main className="flex-1 pt-[var(--header-height)] bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (error || !profile) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main className="flex-1 pt-[var(--header-height)] bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-gray-300" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Available</h1>
          <p className="text-gray-500 mb-6 text-center max-w-xs">
            This profile may have been removed or is no longer available.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 transition-colors"
          >
            Explore RealSingles
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 pt-[var(--header-height)]">
        {/* Hero Section - Full width on mobile */}
        <div className="relative">
          {/* Profile Photo */}
          <div className="relative w-full aspect-[3/4] max-h-[70vh] bg-gradient-to-br from-amber-100 to-orange-100">
            {profile.profile_image_url ? (
              <Image
                src={profile.profile_image_url}
                alt={`${profile.first_name}'s profile`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 600px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-white/50 flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              </div>
            )}
            
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
            
            {/* Share button */}
            <button
              onClick={handleShare}
              className={cn(
                "absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center transition-all",
                shareSuccess 
                  ? "bg-green-500 text-white" 
                  : "bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white"
              )}
              title="Share profile"
            >
              {shareSuccess ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
            </button>

            {/* Profile info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 text-white">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold tracking-tight">
                  {profile.first_name}
                  {profile.age && <span className="font-normal">, {profile.age}</span>}
                </h1>
                {profile.is_verified && (
                  <div className="flex items-center gap-1 bg-blue-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
              
              {profile.location && (
                <div className="flex items-center gap-1.5 text-white/90">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{profile.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Bio Preview */}
          {profile.bio && (
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Blurred Teaser Section */}
          <div className="relative mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 p-4">
            <div className="blur-sm opacity-60">
              <div className="flex gap-2 flex-wrap mb-3">
                {["Travel", "Music", "Cooking", "Hiking"].map((interest) => (
                  <span key={interest} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                    {interest}
                  </span>
                ))}
              </div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <p className="text-sm text-gray-600 font-medium">Sign up to see more</p>
            </div>
          </div>

          {/* Main CTA Card */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 rounded-3xl p-6 text-center shadow-sm border border-amber-100/50">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-200/50">
              <Heart className="w-8 h-8 text-white" fill="white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ready to meet {profile.first_name}?
            </h2>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed max-w-xs mx-auto">
              Join RealSingles to see the full profile, send a message, and make a real connection.
            </p>
            
            <Link
              href={`/login?returnUrl=/search/profile/${userId}`}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-amber-500 text-white rounded-full font-semibold text-lg hover:bg-amber-600 active:scale-[0.98] transition-all shadow-lg shadow-amber-200/50"
            >
              <span>Get Started Free</span>
              <Sparkles className="w-5 h-5" />
            </Link>
            
            <p className="text-xs text-gray-500 mt-4">
              Already have an account?{" "}
              <Link 
                href={`/login?returnUrl=/search/profile/${userId}`}
                className="text-amber-600 font-medium hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <TrustBadge 
              icon={<Shield className="w-5 h-5" />}
              label="Verified Profiles"
            />
            <TrustBadge 
              icon={<Users className="w-5 h-5" />}
              label="Real Singles"
            />
            <TrustBadge 
              icon={<MessageCircle className="w-5 h-5" />}
              label="Real Connections"
            />
          </div>

          {/* App Download Promo */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 mb-3">Also available on</p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="https://apps.apple.com/app/realsingles"
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                App Store
              </Link>
              <Link
                href="https://play.google.com/store/apps/details?id=com.realsingles"
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                </svg>
                Google Play
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
        {icon}
      </div>
      <span className="text-xs text-gray-500 leading-tight">{label}</span>
    </div>
  );
}
