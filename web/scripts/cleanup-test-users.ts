/**
 * Cleanup Test Users Script
 * 
 * Removes all test users created by the seed script.
 * 
 * Usage:
 *   pnpm tsx scripts/cleanup-test-users.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("🧹 Starting test user cleanup...\n");
  
  // Find all test users by email pattern
  const { data: users, error: fetchError } = await supabase
    .from("users")
    .select("id, email")
    .like("email", "%@testuser.realsingles.com");
  
  if (fetchError) {
    console.error("Error fetching test users:", fetchError.message);
    process.exit(1);
  }
  
  if (!users || users.length === 0) {
    console.log("No test users found to delete.");
    return;
  }
  
  console.log(`Found ${users.length} test users to delete.\n`);
  
  let deleted = 0;
  let failed = 0;
  
  for (const user of users) {
    try {
      // Delete auth user (this cascades to users/profiles tables via foreign keys)
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        console.error(`❌ Failed to delete ${user.email}: ${error.message}`);
        failed++;
      } else {
        console.log(`✓ Deleted ${user.email}`);
        deleted++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (err) {
      console.error(`❌ Error deleting ${user.email}:`, err);
      failed++;
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Cleanup complete!`);
  console.log(`   Deleted: ${deleted}`);
  console.log(`   Failed: ${failed}`);
  console.log("=".repeat(50));
}

main().catch(console.error);
