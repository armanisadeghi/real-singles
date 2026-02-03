import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassBottomNav } from "@/components/glass";
import { AppHeader } from "@/components/layout";
import { AppProviders } from "@/components/providers/AppProviders";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Parallelize independent queries - ~3x faster than sequential
  const [profileResult, userResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, profile_image_url")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("users")
      .select("display_name, points_balance")
      .eq("id", user.id)
      .single(),
  ]);
  
  const profile = profileResult.data;
  const userData = userResult.data;
  
  // Convert storage path to signed URL if needed
  let profileImageUrl = "";
  if (profile?.profile_image_url) {
    if (profile.profile_image_url.startsWith("http")) {
      // Already a full URL
      profileImageUrl = profile.profile_image_url;
    } else {
      // It's a storage path - generate a signed URL
      const bucket = profile.profile_image_url.includes("/avatar") ? "avatars" : "gallery";
      const { data: signedData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(profile.profile_image_url, 3600); // 1 hour expiry
      profileImageUrl = signedData?.signedUrl || "";
    }
  }
  
  return {
    id: user.id,
    email: user.email,
    displayName: userData?.display_name || profile?.first_name || user.email?.split("@")[0],
    profileImage: profileImageUrl,
    points: userData?.points_balance || 0,
  };
}

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Discovery profiles are now fetched lazily on the discover page
  // This dramatically improves layout load time for all other routes
  return (
    <AppProviders
      currentUser={{
        id: user.id,
        displayName: user.displayName || "User",
        profileImage: user.profileImage,
        points: user.points,
      }}
      lazyLoadDiscover={true}
    >
      <div className="min-h-dvh bg-gray-50 dark:bg-neutral-950">
        {/* Header - Hidden on home page (matches mobile app behavior) */}
        <AppHeader 
          user={{
            displayName: user.displayName || "User",
            profileImage: user.profileImage,
          }}
          signOutAction={signOut}
        />

        {/* Mobile Bottom Navigation - Floating Glass Dock */}
        <GlassBottomNav />

        {/* Main Content - Extra padding for floating nav */}
        <main id="main-content" className="pb-24 md:pb-0" tabIndex={-1}>
          {children}
        </main>
      </div>
    </AppProviders>
  );
}
