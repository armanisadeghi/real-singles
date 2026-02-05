import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vercel Deployment Sync Service
 *
 * Fetches actual deployment statuses from the Vercel API and persists them
 * to the `app_version` table.  Only non-terminal records ("pending" or
 * "building") are synced — once a deployment reaches "ready", "error", or
 * "canceled" it is never re-checked.
 *
 * The sync runs automatically when the admin version page is loaded so that
 * data is always consistent and accurate regardless of webhook reliability.
 */

// ── Types ────────────────────────────────────────────────────────────

interface VercelDeployment {
  uid: string;
  url: string;
  state:
    | "BUILDING"
    | "ERROR"
    | "INITIALIZING"
    | "QUEUED"
    | "READY"
    | "CANCELED";
  meta?: {
    githubCommitSha?: string;
  };
}

interface VercelListResponse {
  deployments: VercelDeployment[];
}

type DeploymentStatus = "pending" | "building" | "ready" | "error" | "canceled";

interface AppVersionRecord {
  id: string;
  git_commit: string | null;
  deployment_status: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Map a Vercel API state string to our internal status. */
function mapVercelState(state: VercelDeployment["state"]): DeploymentStatus {
  switch (state) {
    case "READY":
      return "ready";
    case "ERROR":
      return "error";
    case "CANCELED":
      return "canceled";
    case "BUILDING":
    case "INITIALIZING":
    case "QUEUED":
      return "building";
    default:
      return "pending";
  }
}

/** Returns true when the env vars required for Vercel API calls exist. */
function hasVercelCredentials(): boolean {
  return Boolean(
    process.env.VERCEL_ACCESS_TOKEN && process.env.VERCEL_PROJECT_ID,
  );
}

/**
 * Fetch recent deployments from the Vercel API (up to `limit`).
 * Returns a Map keyed by the short (7-char) git commit SHA.
 */
async function fetchVercelDeploymentMap(
  limit = 100,
): Promise<Map<string, VercelDeployment>> {
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const accessToken = process.env.VERCEL_ACCESS_TOKEN;

  let url = `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=${limit}`;
  if (teamId) {
    url += `&teamId=${teamId}`;
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vercel API ${response.status}: ${text}`);
  }

  const data: VercelListResponse = await response.json();

  const map = new Map<string, VercelDeployment>();
  for (const deployment of data.deployments) {
    const sha = deployment.meta?.githubCommitSha;
    if (sha) {
      const short = sha.substring(0, 7);
      // Keep only the most recent deployment per commit
      if (!map.has(short)) {
        map.set(short, deployment);
      }
    }
  }

  return map;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Sync all `app_version` rows that are still in a non-terminal state
 * ("pending" or "building") with the actual Vercel deployment status.
 *
 * Terminal states — "ready", "error", "canceled" — are never
 * re-checked because they cannot change.
 *
 * Safe to call on every page load: it short-circuits immediately when
 * there are no rows to sync or when Vercel credentials are missing.
 *
 * @returns The number of records that were updated.
 */
export async function syncPendingDeployments(): Promise<number> {
  if (!hasVercelCredentials()) {
    return 0;
  }

  const supabase = createAdminClient();

  // 1. Find all records that haven't reached a terminal state
  const { data: pendingVersions, error: fetchError } = await supabase
    .from("app_version")
    .select("id, git_commit, deployment_status")
    .in("deployment_status", ["pending", "building"])
    .order("build_number", { ascending: false })
    .limit(100);

  if (fetchError) {
    console.error("[vercel-sync] Error fetching pending versions:", fetchError);
    return 0;
  }

  if (!pendingVersions || pendingVersions.length === 0) {
    return 0;
  }

  // 2. Fetch deployments from Vercel
  let deploymentMap: Map<string, VercelDeployment>;
  try {
    deploymentMap = await fetchVercelDeploymentMap();
  } catch (err) {
    console.error("[vercel-sync] Error fetching from Vercel:", err);
    return 0;
  }

  // 3. Update each record whose Vercel status differs from what we stored
  let updated = 0;

  for (const version of pendingVersions as AppVersionRecord[]) {
    if (!version.git_commit) continue;

    const deployment = deploymentMap.get(version.git_commit);
    if (!deployment) continue;

    const newStatus = mapVercelState(deployment.state);

    // Skip if the status hasn't actually changed
    if (newStatus === version.deployment_status) continue;

    const updatePayload: Record<string, string> = {
      deployment_status: newStatus,
      vercel_deployment_id: deployment.uid,
      vercel_deployment_url: `https://${deployment.url}`,
    };

    const { error: updateError } = await supabase
      .from("app_version")
      .update(updatePayload)
      .eq("id", version.id);

    if (updateError) {
      console.error(
        `[vercel-sync] Failed to update ${version.id}:`,
        updateError,
      );
    } else {
      updated++;
    }
  }

  if (updated > 0) {
    console.log(`[vercel-sync] Updated ${updated} deployment statuses`);
  }

  return updated;
}
