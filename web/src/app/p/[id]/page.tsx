"use client";

/**
 * Public Profile Share Page
 * 
 * Allows sharing a limited profile view with non-authenticated users.
 * - If authenticated: redirects to /search/profile/[id]
 * - If not authenticated: shows limited profile with CTA to sign up/login
 */

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Share2,
  Loader2,
  User,
  CheckCircle,
  ArrowLeft,
  Heart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header, Footer } from "@/components/layout";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PublicProfile {
  id: string;
  first_name: string;
  age: number | null;
  location: string | null;
  bio: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function PublicProfileSharePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User is authenticated - redirect to full profile
        router.replace(`/search/profile/${resolvedParams.id}`);
        return;
      }
      
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, [resolvedParams.id, router]);

  // Fetch public profile data
  useEffect(() => {
    if (isCheckingAuth) return;
    
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/public/profile/${resolvedParams.id}`);
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
  }, [resolvedParams.id, isCheckingAuth]);

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
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  // Show loading while fetching profile
  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main className="flex-1 pt-[var(--header-height)] bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (error || !profile) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main className="flex-1 pt-[var(--header-height)] bg-gray-50 flex flex-col items-center justify-center p-4">
          <User className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">{error || "Profile not found"}</p>
          <Link
            href="/"
            className="px-4 py-2 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 transition-colors"
          >
            Go to Homepage
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1 pt-[var(--header-height)] bg-gray-50">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section with Photo */}
          <div className="relative">
            {/* Profile Image */}
            <div className="relative h-80 sm:h-96 bg-gradient-to-br from-amber-100 to-orange-100">
              {profile.profile_image_url ? (
                <Image
                  src={profile.profile_image_url}
                  alt={profile.first_name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-24 h-24 text-gray-300" />
                </div>
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Back button */}
              <button
                onClick={() => router.back()}
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>

              {/* Share button */}
              <button
                onClick={handleShare}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                title="Share"
              >
                <Share2 className="w-5 h-5 text-gray-700" />
              </button>

              {/* Name and basic info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">
                    {profile.first_name}
                    {profile.age && <span className="font-normal">, {profile.age}</span>}
                  </h1>
                  {profile.is_verified && (
                    <CheckCircle className="w-6 h-6 text-blue-400" />
                  )}
                </div>
                
                {profile.location && (
                  <div className="flex items-center gap-1.5 mt-2 text-white/90">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-4 sm:px-6 py-6">
            {/* Bio Preview */}
            {profile.bio && (
              <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                <h2 className="text-sm font-semibold text-amber-700 mb-2">About</h2>
                <p className="text-gray-700">{profile.bio}</p>
              </div>
            )}

            {/* Sign Up CTA Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 text-center border border-amber-100">
              <div className="w-14 h-14 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-7 h-7 text-amber-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Want to connect with {profile.first_name}?
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Create a free account to see the full profile, photos, and start a conversation.
              </p>
              
              <Link
                href={`/login?returnUrl=/search/profile/${profile.id}`}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-amber-500 text-white rounded-full font-semibold hover:bg-amber-600 transition-colors shadow-sm"
              >
                Sign Up Free
              </Link>
              
              <p className="text-sm text-gray-500 mt-4">
                Already have an account?{" "}
                <Link 
                  href={`/login?returnUrl=/search/profile/${profile.id}`}
                  className="text-amber-600 font-medium hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>

            {/* App promo */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                RealSingles — Where authentic connections happen.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
