import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

/**
 * Create a Supabase client for server-side use with cookie-based auth.
 * Use this for web app routes where auth is via cookies.
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // The `delete` method was called from a Server Component.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client for API routes that support both:
 * - Cookie-based auth (web app)
 * - Bearer token auth (mobile app)
 * 
 * This checks for Authorization header first, then falls back to cookies.
 */
export async function createApiClient(): Promise<SupabaseClient> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  // Check for Bearer token (mobile app)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    
    // Create a client with the access token
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    return supabase;
  }
  
  // Fall back to cookie-based auth (web app)
  return createClient();
}
