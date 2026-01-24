import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { TypedSupabaseClient } from "@/types/db";

// Admin client for server-side operations that need elevated privileges
// Uses the service role key - NEVER expose this to the client
export function createAdminClient(): TypedSupabaseClient {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
