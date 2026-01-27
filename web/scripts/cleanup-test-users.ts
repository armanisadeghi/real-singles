/**
 * Cleanup Test Users Script
 * 
 * Removes all test users created by the seed script, including:
 * - Storage files in the gallery bucket
 * - Auth users (cascades to users/profiles/gallery tables)
 * 
 * Usage:
 *   pnpm tsx scripts/cleanup-test-users.ts
 *   pnpm seed:cleanup
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

/**
 * Delete all storage files for a user from the gallery bucket
 */
async function deleteUserStorageFiles(userId: string): Promise<{ deleted: number; errors: number }> {
  let deleted = 0;
  let errors = 0;

  try {
    // List all files in the user's gallery folder
    const { data: files, error: listError } = await supabase.storage
      .from("gallery")
      .list(userId);

    if (listError) {
      console.error(`    Storage list error for ${userId}: ${listError.message}`);
      return { deleted: 0, errors: 1 };
    }

    if (!files || files.length === 0) {
      return { deleted: 0, errors: 0 };
    }

    // Build full paths for deletion
    const filePaths = files.map((file) => `${userId}/${file.name}`);

    // Delete all files in one call
    const { error: deleteError } = await supabase.storage
      .from("gallery")
      .remove(filePaths);

    if (deleteError) {
      console.error(`    Storage delete error for ${userId}: ${deleteError.message}`);
      errors = filePaths.length;
    } else {
      deleted = filePaths.length;
    }
  } catch (err) {
    console.error(`    Unexpected storage error for ${userId}:`, err);
    errors = 1;
  }

  return { deleted, errors };
}

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
  
  let deletedUsers = 0;
  let failedUsers = 0;
  let deletedFiles = 0;
  let failedFiles = 0;
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const progress = `[${i + 1}/${users.length}]`;
    
    try {
      // 1. Delete storage files first (before user deletion cascades DB records)
      const storageResult = await deleteUserStorageFiles(user.id);
      deletedFiles += storageResult.deleted;
      failedFiles += storageResult.errors;
      
      if (storageResult.deleted > 0) {
        console.log(`${progress} Deleted ${storageResult.deleted} storage files for ${user.email}`);
      }
      
      // 2. Delete auth user (cascades to users/profiles/gallery tables)
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        console.error(`${progress} ❌ Failed to delete ${user.email}: ${error.message}`);
        failedUsers++;
      } else {
        console.log(`${progress} ✓ Deleted ${user.email}`);
        deletedUsers++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (err) {
      console.error(`${progress} ❌ Error deleting ${user.email}:`, err);
      failedUsers++;
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Cleanup complete!`);
  console.log(`   Users deleted: ${deletedUsers}`);
  console.log(`   Users failed: ${failedUsers}`);
  console.log(`   Storage files deleted: ${deletedFiles}`);
  console.log(`   Storage files failed: ${failedFiles}`);
  console.log("=".repeat(50));
}

main().catch(console.error);
