#!/usr/bin/env tsx
/**
 * Cleanup Duplicate Versions Script
 * 
 * This script removes duplicate app_version entries caused by the double-insertion bug.
 * For each git_commit with multiple entries, it keeps the entry with the HIGHER build number
 * and deletes the others.
 * 
 * Usage:
 *   pnpm cleanup:duplicates
 * 
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface VersionRecord {
  id: string;
  version: string;
  build_number: number;
  git_commit: string | null;
  deployed_at: string;
}

/**
 * Main cleanup function
 */
async function cleanupDuplicates() {
  console.log("🔍 Scanning for duplicate version entries...\n");

  try {
    // Find all git commits that have more than one version entry
    const { data: duplicateCommits, error: duplicatesError } = await supabase
      .from("app_version")
      .select("git_commit")
      .not("git_commit", "is", null);

    if (duplicatesError) {
      throw new Error(`Failed to fetch versions: ${duplicatesError.message}`);
    }

    if (!duplicateCommits || duplicateCommits.length === 0) {
      console.log("✅ No versions found in database\n");
      return;
    }

    // Count occurrences of each commit
    const commitCounts = new Map<string, number>();
    duplicateCommits.forEach((record) => {
      if (record.git_commit) {
        commitCounts.set(record.git_commit, (commitCounts.get(record.git_commit) || 0) + 1);
      }
    });

    // Find commits with duplicates
    const duplicateCommitHashes = Array.from(commitCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([hash]) => hash);

    if (duplicateCommitHashes.length === 0) {
      console.log("✅ No duplicate entries found! Database is clean.\n");
      return;
    }

    console.log(`Found ${duplicateCommitHashes.length} commits with duplicate entries:\n`);

    let totalDeleted = 0;
    let totalKept = 0;

    // Process each duplicate commit
    for (const gitCommit of duplicateCommitHashes) {
      // Get all versions for this commit
      const { data: versions, error: versionsError } = await supabase
        .from("app_version")
        .select("id, version, build_number, git_commit, deployed_at")
        .eq("git_commit", gitCommit)
        .order("build_number", { ascending: false });

      if (versionsError || !versions || versions.length === 0) {
        console.warn(`⚠️  Could not fetch versions for commit ${gitCommit}`);
        continue;
      }

      // Keep the version with the highest build number (first after sorting desc)
      const toKeep = versions[0];
      const toDelete = versions.slice(1);

      console.log(`Commit ${gitCommit}:`);
      console.log(`  ✓ Keeping: v${toKeep.version} (build #${toKeep.build_number})`);

      // Delete duplicates
      for (const version of toDelete) {
        console.log(`  ✗ Deleting: v${version.version} (build #${version.build_number})`);

        const { error: deleteError } = await supabase
          .from("app_version")
          .delete()
          .eq("id", version.id);

        if (deleteError) {
          console.error(`    Error deleting ${version.id}:`, deleteError.message);
        } else {
          totalDeleted++;
        }
      }

      totalKept++;
      console.log(); // Empty line for readability
    }

    console.log("\n✅ Cleanup complete!");
    console.log(`   Commits processed: ${duplicateCommitHashes.length}`);
    console.log(`   Entries kept: ${totalKept}`);
    console.log(`   Entries deleted: ${totalDeleted}`);
    console.log();

    // Show final count
    const { count: finalCount } = await supabase
      .from("app_version")
      .select("*", { count: "exact", head: true });

    console.log(`📊 Total versions remaining: ${finalCount || 0}\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error during cleanup:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the cleanup
cleanupDuplicates();
