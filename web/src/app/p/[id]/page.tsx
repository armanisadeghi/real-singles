import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicProfileClient } from "./PublicProfileClient";

/**
 * Public Profile Share Page
 * 
 * A minimal, safe profile view designed for sharing.
 * - Generates proper OG metadata for social sharing
 * - If authenticated: redirects to /search/profile/[id]
 * - If not authenticated: shows limited profile with CTA to sign up/login
 * 
 * Privacy: Only exposes minimal, safe information:
 * - First name only (no last name)
 * - Age (not exact DOB)
 * - City, State (no exact address)
 * - Primary photo only
 * - Verification badge
 * - Truncated bio
 */

// ============================================================================
// METADATA GENERATION (Server-side for SEO/Social Sharing)
// ============================================================================

interface PublicProfileData {
  first_name: string;
  age: number | null;
  location: string | null;
  bio: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
}

async function getPublicProfile(userId: string): Promise<PublicProfileData | null> {
  const supabase = createAdminClient();

  // Check if user exists and is active
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, status")
    .eq("id", userId)
    .single();

  if (userError || !userData) return null;
  if (userData.status === "suspended" || userData.status === "deleted") return null;

  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      first_name,
      date_of_birth,
      city,
      state,
      bio,
      profile_image_url,
      is_verified,
      profile_hidden
    `)
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) return null;
  if (profile.profile_hidden) return null;

  // Calculate age
  let age: number | null = null;
  if (profile.date_of_birth) {
    const birthDate = new Date(profile.date_of_birth);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  // Resolve profile image URL
  let profileImageUrl: string | null = null;
  if (profile.profile_image_url) {
    if (profile.profile_image_url.startsWith("http")) {
      profileImageUrl = profile.profile_image_url;
    } else {
      const bucket = profile.profile_image_url.includes("/avatar") ? "avatars" : "gallery";
      const { data: signedData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(profile.profile_image_url, 86400); // 24 hour expiry for OG
      profileImageUrl = signedData?.signedUrl || null;
    }
  }

  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const truncatedBio = profile.bio 
    ? profile.bio.length > 150 
      ? profile.bio.substring(0, 150) + "..."
      : profile.bio
    : null;

  return {
    first_name: profile.first_name || "Someone",
    age,
    location: location || null,
    bio: truncatedBio,
    profile_image_url: profileImageUrl,
    is_verified: profile.is_verified || false,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: userId } = await params;
  const profile = await getPublicProfile(userId);

  if (!profile) {
    return {
      title: "Profile Not Found | RealSingles",
      description: "This profile is not available.",
    };
  }

  const title = profile.age
    ? `${profile.first_name}, ${profile.age} on RealSingles`
    : `${profile.first_name} on RealSingles`;
  
  const description = profile.location
    ? `Check out ${profile.first_name}'s profile from ${profile.location}. Join RealSingles to connect with authentic singles.`
    : `Check out ${profile.first_name}'s profile on RealSingles - a dating app for people who want something real.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: profile.profile_image_url
        ? [
            {
              url: profile.profile_image_url,
              width: 800,
              height: 800,
              alt: `${profile.first_name}'s profile photo`,
            },
          ]
        : ["/images/logo.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: profile.profile_image_url ? [profile.profile_image_url] : ["/images/logo.png"],
    },
  };
}

// ============================================================================
// PAGE COMPONENT (Server Component wrapper)
// ============================================================================

export default async function PublicProfileSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await params;
  
  // Pre-fetch profile data for initial render
  const profile = await getPublicProfile(userId);

  return (
    <PublicProfileClient 
      userId={userId} 
      initialProfile={profile}
    />
  );
}
