import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { NotificationBell } from "@/components/notifications";

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
  
  return {
    id: user.id,
    email: user.email,
    displayName: userData?.display_name || profile?.first_name || user.email?.split("@")[0],
    profileImage: profile?.profile_image_url,
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
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              RealSingles
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
              {/* Points */}
              <Link
                href="/rewards"
                className="hidden sm:flex items-center px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded-full transition-colors"
              >
                <span className="text-yellow-600 font-medium text-sm">
                  ⭐ {user.points} pts
                </span>
              </Link>

              {/* Notifications */}
              <NotificationBell />

              {/* Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-full p-1 pr-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      user.displayName?.charAt(0).toUpperCase()
                    )}
                  </div>
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
