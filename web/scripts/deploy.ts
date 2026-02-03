#!/usr/bin/env tsx
/**
 * Automated Deployment Script
 * 
 * All-in-one command that:
 * 1. Updates app version in database
 * 2. Stages all changes
 * 3. Creates git commit
 * 4. Pushes to remote
 * 
 * Usage:
 *   pnpm ship "commit message"           # Patch bump (1.3.10 → 1.3.11)
 *   pnpm ship:minor "commit message"     # Minor bump (1.3.10 → 1.4.0)
 *   pnpm ship:major "commit message"     # Major bump (1.3.10 → 2.0.0)
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import * as path from "path";

// Parse arguments
const args = process.argv.slice(2);
const isMajor = args.includes("--major");
const isMinor = args.includes("--minor");
const commitMessage = args.find((arg) => !arg.startsWith("--"));

// Validate commit message
if (!commitMessage) {
  console.error("❌ Error: Commit message is required");
  console.error("\nUsage:");
  console.error('  pnpm ship "Your commit message"');
  console.error('  pnpm ship:minor "Your commit message"');
  console.error('  pnpm ship:major "Your commit message"');
  process.exit(1);
}

// Check if we're in a git repository
try {
  execSync("git rev-parse --git-dir", { stdio: "ignore" });
} catch (error) {
  console.error("❌ Error: Not in a git repository");
  process.exit(1);
}

// Check if there are uncommitted changes
let hasChanges = false;
try {
  const status = execSync("git status --porcelain", { encoding: "utf-8" });
  hasChanges = status.trim().length > 0;
} catch (error) {
  console.error("❌ Error: Failed to check git status");
  process.exit(1);
}

if (!hasChanges) {
  console.log("⚠️  No uncommitted changes detected");
  console.log("   Nothing to deploy!");
  process.exit(0);
}

console.log("🚀 Starting deployment process...\n");

// Step 1: Update version in database
console.log("📦 Step 1/4: Updating version...");
try {
  const versionScript = path.join(__dirname, "update-app-version.ts");
  
  if (!existsSync(versionScript)) {
    throw new Error("update-app-version.ts not found");
  }

  let versionCommand = `tsx "${versionScript}"`;
  if (isMajor) {
    versionCommand += " --major";
  } else if (isMinor) {
    versionCommand += " --minor";
  }

  execSync(versionCommand, { stdio: "inherit" });
} catch (error) {
  console.error("\n❌ Failed to update version");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

// Step 2: Stage all changes
console.log("\n📝 Step 2/4: Staging changes...");
try {
  execSync("git add .", { stdio: "inherit" });
  console.log("✅ Changes staged");
} catch (error) {
  console.error("\n❌ Failed to stage changes");
  process.exit(1);
}

// Step 3: Create commit
console.log("\n💾 Step 3/4: Creating commit...");
try {
  // Escape quotes in commit message
  const escapedMessage = commitMessage.replace(/"/g, '\\"');
  execSync(`git commit -m "${escapedMessage}"`, { stdio: "inherit" });
  console.log("✅ Commit created");
} catch (error) {
  console.error("\n❌ Failed to create commit");
  console.error("   Tip: Make sure you have changes to commit");
  process.exit(1);
}

// Step 4: Push to remote
console.log("\n⬆️  Step 4/4: Pushing to remote...");
try {
  execSync("git push", { stdio: "inherit" });
  console.log("✅ Pushed to remote");
} catch (error) {
  console.error("\n❌ Failed to push to remote");
  console.error("   Your commit was created locally but not pushed");
  console.error("   You can manually push with: git push");
  process.exit(1);
}

console.log("\n✨ Deployment complete!");
console.log(`   Commit: "${commitMessage}"`);
console.log("   Changes have been pushed to remote\n");
