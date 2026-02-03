#!/usr/bin/env tsx
/**
 * Update App Version Script
 * 
 * This script updates the app_version table in Supabase with the current build information.
 * It should be run during the build/deployment process.
 * 
 * Usage:
 *   pnpm update:version                    # Auto-increment patch version
 *   pnpm update:version --major            # Increment major version (x.0.0)
 *   pnpm update:version --minor            # Increment minor version (0.x.0)
 *   pnpm update:version --version 2.0.0    # Set specific version
 * 
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// Parse command line arguments
const args = process.argv.slice(2);
const isMajor = args.includes("--major");
const isMinor = args.includes("--minor");
const customVersion = args.find((arg) => arg.startsWith("--version="))?.split("=")[1];

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

/**
 * Get the current git commit hash (short)
 */
function getGitCommit(): string | null {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch (error) {
    console.warn("⚠️  Could not get git commit hash:", error);
    return null;
  }
}

/**
 * Get the last commit message
 */
function getCommitMessage(): string | null {
  try {
    return execSync("git log -1 --pretty=%B").toString().trim();
  } catch (error) {
    console.warn("⚠️  Could not get commit message:", error);
    return null;
  }
}

/**
 * Get code change stats for the last commit
 */
function getCodeStats(): { linesAdded: number; linesDeleted: number; filesChanged: number } {
  try {
    const stats = execSync("git diff --numstat HEAD~1 HEAD").toString().trim();
    let linesAdded = 0;
    let linesDeleted = 0;
    let filesChanged = 0;

    if (stats) {
      const lines = stats.split("\n");
      for (const line of lines) {
        const [added, deleted] = line.trim().split(/\s+/);
        if (added !== "-" && deleted !== "-") {
          linesAdded += parseInt(added) || 0;
          linesDeleted += parseInt(deleted) || 0;
          filesChanged += 1;
        }
      }
    }

    return { linesAdded, linesDeleted, filesChanged };
  } catch (error) {
    console.warn("⚠️  Could not get code stats:", error);
    return { linesAdded: 0, linesDeleted: 0, filesChanged: 0 };
  }
}

/**
 * Parse a semantic version string
 */
function parseVersion(version: string): [number, number, number] {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

/**
 * Increment a semantic version
 */
function incrementVersion(
  version: string,
  type: "major" | "minor" | "patch"
): string {
  const [major, minor, patch] = parseVersion(version);

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * Main function to update the app version
 */
async function updateAppVersion() {
  console.log("🔄 Updating app version...\n");

  try {
    // Get current version from database (order by build_number to ensure we get the highest)
    const { data: currentData, error: fetchError } = await supabase
      .from("app_version")
      .select("version, build_number")
      .order("build_number", { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(`Failed to fetch current version: ${fetchError.message}`);
    }

    const currentVersion = currentData?.version || "1.0.0";
    const currentBuildNumber = currentData?.build_number || 0;

    // Determine new version
    let newVersion: string;
    if (customVersion) {
      // Validate custom version format
      parseVersion(customVersion);
      newVersion = customVersion;
      console.log(`📌 Setting custom version: ${newVersion}`);
    } else if (isMajor) {
      newVersion = incrementVersion(currentVersion, "major");
      console.log(`⬆️  Major version bump: ${currentVersion} → ${newVersion}`);
    } else if (isMinor) {
      newVersion = incrementVersion(currentVersion, "minor");
      console.log(`⬆️  Minor version bump: ${currentVersion} → ${newVersion}`);
    } else {
      newVersion = incrementVersion(currentVersion, "patch");
      console.log(`⬆️  Patch version bump: ${currentVersion} → ${newVersion}`);
    }

    const newBuildNumber = currentBuildNumber + 1;
    const gitCommit = getGitCommit();
    const commitMessage = getCommitMessage();
    const codeStats = getCodeStats();

    // Insert new version record
    const { error: insertError } = await supabase.from("app_version").insert({
      version: newVersion,
      build_number: newBuildNumber,
      git_commit: gitCommit,
      commit_message: commitMessage,
      lines_added: codeStats.linesAdded,
      lines_deleted: codeStats.linesDeleted,
      files_changed: codeStats.filesChanged,
      deployed_at: new Date().toISOString(),
    });

    if (insertError) {
      throw new Error(`Failed to insert new version: ${insertError.message}`);
    }

    console.log("\n✅ App version updated successfully!");
    console.log(`   Version: ${newVersion}`);
    console.log(`   Build: #${newBuildNumber}`);
    if (gitCommit) {
      console.log(`   Commit: ${gitCommit}`);
    }
    if (commitMessage) {
      console.log(`   Message: ${commitMessage}`);
    }
    if (codeStats.filesChanged > 0) {
      console.log(`   Changes: ${codeStats.filesChanged} files, +${codeStats.linesAdded}/-${codeStats.linesDeleted} lines`);
    }
    console.log(`   Deployed: ${new Date().toISOString()}\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error updating app version:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the script
updateAppVersion();
