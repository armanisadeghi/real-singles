import { createClient } from "@/lib/supabase/server";
import { ProfileListItem } from "@/components/search/ProfileListItem";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

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

  // Resolve storage URLs for profile images
  const favoritesWithUrls = await Promise.all(
    (favorites || []).map(async (fav) => {
      const profile = fav.profiles as { profile_image_url?: string } | null;
      if (profile?.profile_image_url) {
        const resolvedUrl = await resolveStorageUrl(supabase, profile.profile_image_url);
        return {
          ...fav,
          profiles: { ...profile, profile_image_url: resolvedUrl },
        };
      }
      return fav;
    })
  );

  return favoritesWithUrls;
}

export default async function FavoritesPage() {
  const favorites = await getFavorites();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Favorites</h1>
      <p className="text-gray-500 mb-6">Matches you've favorited</p>

      {favorites.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-white dark:bg-neutral-900 rounded-xl shadow-sm">
          <div className="text-4xl sm:text-5xl mb-3">⭐</div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1.5">No favorites yet</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-5 px-4">
            Tap the star on any match to add them to your favorites!
          </p>
          <a
            href="/search"
            className="inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-amber-700"
          >
            Search Profiles
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((fav) => {
            const profile = fav.profiles as {
              id?: string;
              first_name?: string;
              last_name?: string;
              date_of_birth?: string;
              profile_image_url?: string;
              city?: string;
              state?: string;
              is_verified?: boolean;
              user?: { display_name?: string };
            };
            return (
              <ProfileListItem
                key={fav.favorite_user_id}
                profile={{
                  id: fav.favorite_user_id || "",
                  user_id: fav.favorite_user_id,
                  first_name: profile?.first_name,
                  last_name: profile?.last_name,
                  date_of_birth: profile?.date_of_birth,
                  city: profile?.city,
                  state: profile?.state,
                  profile_image_url: profile?.profile_image_url,
                  is_verified: profile?.is_verified,
                  user: profile?.user,
                }}
                navigateToFocus={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
