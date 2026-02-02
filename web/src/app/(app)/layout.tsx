import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNavigation } from "@/components/navigation";
import { AppHeader } from "@/components/layout";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, profile_image_url")
    .eq("user_id", user.id)
    .single();
    
  const { data: userData } = await supabase
    .from("users")
    .select("display_name, points_balance")
    .eq("id", user.id)
    .single();
  
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

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header - Hidden on home page (matches mobile app behavior) */}
      <AppHeader 
        user={{
          displayName: user.displayName || "User",
          profileImage: user.profileImage,
        }}
        signOutAction={signOut}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />

      {/* Main Content */}
      <main id="main-content" className="pb-20 md:pb-0" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
