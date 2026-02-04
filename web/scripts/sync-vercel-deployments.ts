#!/usr/bin/env tsx
/**
 * Sync Vercel Deployment Status Script
 * 
 * This script fetches deployment status from Vercel API and updates
 * the app_version table to match the actual deployment status.
 * 
 * Usage:
 *   pnpm vercel:sync              # Sync all pending deployments
 *   pnpm vercel:sync --all        # Sync all deployments (last 100)
 * 
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - VERCEL_ACCESS_TOKEN (create at https://vercel.com/account/tokens)
 *   - VERCEL_TEAM_ID (optional, for team projects)
 *   - VERCEL_PROJECT_ID (your project ID)
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// Parse command line arguments
const args = process.argv.slice(2);
const syncAll = args.includes("--all");

// Validate environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VERCEL_ACCESS_TOKEN",
  "VERCEL_PROJECT_ID",
];

const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingVars.forEach((v) => console.error(`   - ${v}`));
  console.error("\nTo set up VERCEL_ACCESS_TOKEN:");
  console.error("   1. Go to https://vercel.com/account/tokens");
  console.error("   2. Create a new token with appropriate scope");
  console.error("   3. Add it to your .env.local file");
  console.error("\nTo find VERCEL_PROJECT_ID:");
  console.error("   1. Go to your project settings in Vercel");
  console.error("   2. Find the Project ID in General settings");
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface VercelDeployment {
  uid: string;
  id: string;
  name: string;
  url: string;
  created: number;
  state: "BUILDING" | "ERROR" | "INITIALIZING" | "QUEUED" | "READY" | "CANCELED";
  target: string | null;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
  };
}

interface VercelResponse {
  deployments: VercelDeployment[];
  pagination?: {
    count: number;
    next?: number;
    prev?: number;
  };
}

/**
 * Fetch deployments from Vercel API
 */
async function fetchVercelDeployments(limit = 100): Promise<VercelDeployment[]> {
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const accessToken = process.env.VERCEL_ACCESS_TOKEN;

  let url = `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=${limit}`;
  if (teamId) {
    url += `&teamId=${teamId}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel API error: ${response.status} - ${error}`);
  }

  const data: VercelResponse = await response.json();
  return data.deployments;
}

/**
 * Map Vercel state to our deployment_status
 */
function mapVercelState(state: VercelDeployment["state"]): string {
  switch (state) {
    case "READY":
      return "ready";
    case "ERROR":
      return "error";
    case "BUILDING":
    case "INITIALIZING":
    case "QUEUED":
      return "building";
    case "CANCELED":
      return "canceled";
    default:
      return "pending";
  }
}

/**
 * Main sync function
 */
async function syncDeployments() {
  console.log("🔄 Syncing Vercel deployment status...\n");

  try {
    // Fetch deployments from Vercel
    console.log("📡 Fetching deployments from Vercel...");
    const vercelDeployments = await fetchVercelDeployments(syncAll ? 100 : 50);
    console.log(`   Found ${vercelDeployments.length} deployments\n`);

    // Create a map of git commit (short) to deployment
    const deploymentMap = new Map<string, VercelDeployment>();
    for (const deployment of vercelDeployments) {
      const commitSha = deployment.meta?.githubCommitSha;
      if (commitSha) {
        const shortSha = commitSha.substring(0, 7);
        // Only keep the most recent deployment for each commit
        if (!deploymentMap.has(shortSha)) {
          deploymentMap.set(shortSha, deployment);
        }
      }
    }

    // Get app versions from database
    console.log("📊 Fetching app versions from database...");
    const query = supabase
      .from("app_version")
      .select("id, version, build_number, git_commit, deployment_status, vercel_deployment_id")
      .order("build_number", { ascending: false });

    if (!syncAll) {
      query.eq("deployment_status", "pending");
    }

    const { data: versions, error } = await query.limit(100);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!versions || versions.length === 0) {
      console.log("   No versions to sync\n");
      console.log("✅ Sync complete!\n");
      return;
    }

    console.log(`   Found ${versions.length} versions to check\n`);

    // Update each version
    let updated = 0;
    let skipped = 0;
    let notFound = 0;

    for (const version of versions) {
      const shortCommit = version.git_commit;
      if (!shortCommit) {
        skipped++;
        continue;
      }

      const deployment = deploymentMap.get(shortCommit);
      if (!deployment) {
        notFound++;
        continue;
      }

      const newStatus = mapVercelState(deployment.state);
      
      // Skip if status hasn't changed (unless it was pending)
      if (version.deployment_status === newStatus && version.deployment_status !== "pending") {
        skipped++;
        continue;
      }

      // Update the version record
      const { error: updateError } = await supabase
        .from("app_version")
        .update({
          deployment_status: newStatus,
          vercel_deployment_id: deployment.uid,
          vercel_deployment_url: `https://${deployment.url}`,
        })
        .eq("id", version.id);

      if (updateError) {
        console.error(`   ❌ Failed to update v${version.version}: ${updateError.message}`);
      } else {
        console.log(`   ✓ v${version.version} (#${version.build_number}): ${version.deployment_status} → ${newStatus}`);
        updated++;
      }
    }

    console.log("\n📈 Sync Summary:");
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped (no change): ${skipped}`);
    console.log(`   Not found in Vercel: ${notFound}`);
    console.log("\n✅ Sync complete!\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error syncing deployments:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the script
syncDeployments();
