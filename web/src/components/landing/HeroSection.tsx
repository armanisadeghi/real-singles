"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star, ArrowRight, Sparkles, Compass, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  firstName: string | null;
  profileImageUrl: string | null;
}

export function HeroSection() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      const supabase = createClient();
      
      // Check auth state
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setIsAuthenticated(true);
        
        // Fetch user profile for avatar
        try {
          const response = await fetch("/api/users/me");
          if (response.ok) {
            const data = await response.json();
            setUserProfile({
              firstName: data.profile?.first_name || null,
              profileImageUrl: data.profile?.profile_image_url || null,
            });
          }
        } catch {
          // Profile fetch failed, still show authenticated state
        }
      }
      
      setIsLoading(false);
    };

    checkAuthAndFetchProfile();

    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        // Refetch profile on auth change
        try {
          const response = await fetch("/api/users/me");
          if (response.ok) {
            const data = await response.json();
            setUserProfile({
              firstName: data.profile?.first_name || null,
              profileImageUrl: data.profile?.profile_image_url || null,
            });
          }
        } catch {
          // Silent fail
        }
      } else {
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-[#F6EDE1] to-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('/images/hero/homepage-hero.jpg')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#F6EDE1] via-[#F6EDE1]/90 to-transparent" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
        <div className="max-w-2xl">
          {/* Show authenticated content when confirmed, otherwise show guest content */}
          {isAuthenticated && !isLoading ? (
            <>
              {/* Authenticated user hero */}
              <div className="flex items-center gap-4 mb-6">
                {/* User avatar */}
                {userProfile?.profileImageUrl ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                    <Image
                      src={userProfile.profileImageUrl}
                      alt=""
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center ring-4 ring-white shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="inline-flex items-center gap-2 bg-brand-primary/10 rounded-full px-4 py-2">
                  <Sparkles className="w-4 h-4 text-brand-primary" />
                  <span className="text-sm text-brand-primary font-medium">
                    Welcome back{userProfile?.firstName ? `, ${userProfile.firstName}` : ""}!
                  </span>
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
                Ready to Find Your{" "}
                <span className="text-brand-primary">Match</span>?
              </h1>
              
              <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-lg">
                Your next meaningful connection could be just a click away. Jump back in to discover new profiles, check your matches, or browse upcoming events.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/discover"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-brand-primary-dark transition-all hover:scale-105"
                >
                  <Compass className="w-5 h-5" />
                  Enter App
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand-primary px-8 py-4 text-lg font-semibold text-brand-primary hover:bg-brand-primary/5 transition-colors"
                >
                  <User className="w-5 h-5" />
                  View Profile
                </Link>
              </div>
              
              <p className="mt-6 text-sm text-muted-foreground">
                Or keep scrolling to learn more about Real Singles
              </p>
            </>
          ) : (
            <>
              {/* Guest hero (also shown during loading for fast initial render) */}
              <div className="inline-flex items-center gap-2 bg-brand-primary/10 rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4 text-brand-primary" />
                <span className="text-sm text-brand-primary font-medium">
                  Real People. Real Connections.
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
                Find Your{" "}
                <span className="text-brand-primary">Real</span>{" "}
                Connection
              </h1>
              
              <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-lg">
                Join the dating community that prioritizes authenticity. With verified profiles, video introductions, and curated events, find someone who&apos;s genuinely looking for what you are.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-brand-primary-dark transition-all hover:scale-105"
                >
                  <Heart className="w-5 h-5" />
                  Start Your Journey
                </Link>
                <Link
                  href="/membership"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-secondary px-8 py-4 text-lg font-semibold text-white hover:bg-brand-secondary-dark transition-colors"
                >
                  Learn More
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              
              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-brand-primary to-brand-secondary"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Trusted by 50,000+ singles
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
