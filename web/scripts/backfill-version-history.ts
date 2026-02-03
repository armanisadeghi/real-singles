#!/usr/bin/env tsx
/**
 * Backfill Version History Script
 * 
 * Imports all git commit history into the app_version table.
 * This gives us complete deployment history matching all commits.
 * 
 * Usage:
 *   pnpm backfill:history
 */

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables");
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

interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  date: string;
  linesAdded: number;
  linesDeleted: number;
  filesChanged: number;
}

/**
 * Get all git commits with stats
 */
function getGitHistory(): GitCommit[] {
  try {
    // Get all commits with stats
    const log = execSync(
      'git log --all --reverse --pretty=format:"%H|%h|%s|%aI" --numstat',
      { encoding: "utf-8" }
    );

    const commits: GitCommit[] = [];
    const lines = log.split("\n");
    let currentCommit: GitCommit | null = null;

    for (const line of lines) {
      if (line.includes("|")) {
        const parts = line.split("|");
        if (parts.length === 4) {
          // This is a commit line
          if (currentCommit) {
            commits.push(currentCommit);
          }
          currentCommit = {
            hash: parts[0],
            shortHash: parts[1],
            message: parts[2],
            date: parts[3],
            linesAdded: 0,
            linesDeleted: 0,
            filesChanged: 0,
          };
        }
      } else if (currentCommit && line.trim()) {
        // This is a numstat line
        const [added, deleted] = line.trim().split(/\s+/);
        if (added !== "-" && deleted !== "-") {
          currentCommit.linesAdded += parseInt(added) || 0;
          currentCommit.linesDeleted += parseInt(deleted) || 0;
          currentCommit.filesChanged += 1;
        }
      }
    }

    if (currentCommit) {
      commits.push(currentCommit);
    }

    return commits;
  } catch (error) {
    console.error("Error getting git history:", error);
    return [];
  }
}

/**
 * Generate semantic version based on commit count
 */
function generateVersion(commitNumber: number): string {
  // Start from 1.0.0
  // Every 100 commits = minor version bump
  const major = 1;
  const minor = Math.floor(commitNumber / 100);
  const patch = commitNumber % 100;
  return `${major}.${minor}.${patch}`;
}

/**
 * Main function to backfill version history
 */
async function backfillHistory() {
  console.log("🔄 Backfilling version history from git...\n");

  try {
    // Get git history
    console.log("📚 Reading git history...");
    const commits = getGitHistory();
    console.log(`   Found ${commits.length} commits\n`);

    if (commits.length === 0) {
      console.log("⚠️  No commits found");
      process.exit(0);
    }

    // Check what's already in the database
    const { data: existingVersions } = await supabase
      .from("app_version")
      .select("git_commit")
      .order("build_number", { ascending: true });

    const existingHashes = new Set(
      existingVersions?.map((v) => v.git_commit) || []
    );

    console.log(`📊 Database status:`);
    console.log(`   Existing versions: ${existingVersions?.length || 0}`);
    console.log(`   Commits to import: ${commits.length - existingHashes.size}\n`);

    // Import commits that aren't already in the database
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      const buildNumber = i + 1;

      if (existingHashes.has(commit.shortHash)) {
        skipped++;
        continue;
      }

      const version = generateVersion(buildNumber);

      const { error } = await supabase.from("app_version").insert({
        version,
        build_number: buildNumber,
        git_commit: commit.shortHash,
        commit_message: commit.message,
        lines_added: commit.linesAdded,
        lines_deleted: commit.linesDeleted,
        files_changed: commit.filesChanged,
        deployed_at: commit.date,
        created_at: commit.date,
        updated_at: commit.date,
      });

      if (error) {
        console.error(`   ❌ Failed to import commit ${commit.shortHash}:`, error.message);
      } else {
        imported++;
        if (imported % 50 === 0) {
          console.log(`   ✅ Imported ${imported} commits...`);
        }
      }
    }

    console.log("\n✅ Backfill complete!");
    console.log(`   Imported: ${imported}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total in database: ${imported + (existingVersions?.length || 0)}\n`);

    // Show latest version
    const { data: latest } = await supabase
      .from("app_version")
      .select("*")
      .order("build_number", { ascending: false })
      .limit(1)
      .single();

    if (latest) {
      console.log("📌 Latest version:");
      console.log(`   Version: ${latest.version}`);
      console.log(`   Build: #${latest.build_number}`);
      console.log(`   Commit: ${latest.git_commit}`);
      console.log(`   Message: ${latest.commit_message}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error during backfill:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the script
backfillHistory();
