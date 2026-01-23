import { createClient } from "@/lib/supabase/server";

async function getFavorites() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data: favorites } = await supabase
    .from("favorites")
    .select(`
      favorite_user_id,
      created_at,
      profiles:favorite_user_id(*, user:user_id(display_name))
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return favorites || [];
}

export default async function FavoritesPage() {
  const favorites = await getFavorites();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Favorites</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="text-6xl mb-4">⭐</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h2>
          <p className="text-gray-600 mb-6">
            Save profiles you like to your favorites!
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700"
          >
            Discover Profiles
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((fav) => {
            const profile = fav.profiles as {
              first_name?: string;
              profile_image_url?: string;
              city?: string;
              user?: { display_name?: string };
            };
            return (
              <a
                key={fav.favorite_user_id}
                href={`/profile/${fav.favorite_user_id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 relative">
                  {profile?.profile_image_url ? (
                    <img
                      src={profile.profile_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">👤</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 text-2xl">⭐</div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900">
                    {profile?.first_name || profile?.user?.display_name || "Someone"}
                  </h3>
                  {profile?.city && (
                    <p className="text-sm text-gray-500">📍 {profile.city}</p>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
