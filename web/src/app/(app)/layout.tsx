import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { NotificationBell } from "@/components/notifications";
import { Avatar } from "@/components/ui";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/home" className="-m-1.5 p-1.5">
              <Image
                src="/images/logo.png"
                alt="RealSingles"
                width={140}
                height={45}
                className="h-9 w-auto"
                priority
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/home" className="text-gray-600 hover:text-gray-900 font-medium">
                Home
              </Link>
              <Link href="/discover" className="text-gray-600 hover:text-gray-900 font-medium">
                Discover
              </Link>
              <Link href="/matches" className="text-gray-600 hover:text-gray-900 font-medium">
                Matches
              </Link>
              <Link href="/favorites" className="text-gray-600 hover:text-gray-900 font-medium">
                Favorites
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <NotificationBell />

              {/* Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-full p-1 pr-3">
                  <Avatar
                    src={user.profileImage}
                    name={user.displayName || "User"}
                    size="sm"
                  />
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.displayName}
                  </span>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/profile/edit"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Edit Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </Link>
                  <hr className="my-1" />
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-lg"
                    >
                      Sign Out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />

      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
