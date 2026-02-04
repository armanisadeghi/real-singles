import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Proxy for handling special routing cases
 * 
 * Currently handles:
 * - /search/profile/[id] → /p/[id] for unauthenticated users
 *   (Shows public profile preview instead of login redirect)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle /search/profile/[id] - redirect to public profile if not authenticated
  if (pathname.startsWith("/search/profile/")) {
    // Extract the user ID from the path
    const userId = pathname.replace("/search/profile/", "");
    
    if (userId) {
      // Check authentication status
      let response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      });

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              );
              response = NextResponse.next({
                request,
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();

      // If not authenticated, redirect to public profile page
      if (!user) {
        const publicProfileUrl = new URL(`/p/${userId}`, request.url);
        return NextResponse.redirect(publicProfileUrl);
      }

      return response;
    }
  }

  return NextResponse.next();
}

// Only run proxy on specific paths for performance
export const config = {
  matcher: [
    // Match /search/profile/[id] paths
    "/search/profile/:path*",
  ],
};
