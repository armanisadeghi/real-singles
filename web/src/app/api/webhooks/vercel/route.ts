import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/webhooks/vercel
 * Receives Vercel deployment webhooks and updates app_version table
 * 
 * Webhook events:
 * - deployment.created → status: 'building'
 * - deployment.succeeded → status: 'ready'
 * - deployment.error → status: 'error'
 * - deployment.canceled → status: 'canceled'
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const payload = JSON.parse(body);

    // Verify webhook signature (Vercel uses x-vercel-signature header)
    const signature = request.headers.get("x-vercel-signature");
    const webhookSecret = process.env.VERCEL_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha1", webhookSecret)
        .update(body)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const { type, payload: eventPayload } = payload;
    const { deployment } = eventPayload || {};

    if (!deployment) {
      return NextResponse.json(
        { error: "No deployment data in payload" },
        { status: 400 }
      );
    }

    // Extract relevant data from Vercel deployment
    const deploymentId = deployment.id;
    const deploymentUrl = deployment.url;
    
    // Get git commit SHA from deployment meta
    const gitCommit = deployment.meta?.githubCommitSha?.substring(0, 7) || null;

    // Determine deployment status based on webhook type
    let deploymentStatus: string;
    let deploymentError: string | null = null;

    switch (type) {
      case "deployment.created":
        deploymentStatus = "building";
        break;
      case "deployment.succeeded":
        deploymentStatus = "ready";
        break;
      case "deployment.error":
        deploymentStatus = "error";
        deploymentError = deployment.errorMessage || "Deployment failed";
        break;
      case "deployment.canceled":
        deploymentStatus = "canceled";
        break;
      default:
        // Unknown event type, ignore
        return NextResponse.json({ message: "Event type ignored" });
    }

    const supabaseAdmin = createAdminClient();

    // Find the app_version record by git commit or by closest timestamp
    let versionId: string | null = null;

    if (gitCommit) {
      // Try to find by git commit (most reliable)
      const { data: versionByCommit } = await supabaseAdmin
        .from("app_version")
        .select("id")
        .eq("git_commit", gitCommit)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      versionId = versionByCommit?.id || null;
    }

    // If not found by commit, find the most recent pending version (within last 10 minutes)
    if (!versionId) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recentVersion } = await supabaseAdmin
        .from("app_version")
        .select("id")
        .gte("created_at", tenMinutesAgo)
        .eq("deployment_status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      versionId = recentVersion?.id || null;
    }

    if (!versionId) {
      console.warn("Could not find matching app_version record", {
        gitCommit,
        deploymentId,
        type,
      });
      return NextResponse.json(
        { message: "No matching version found, webhook ignored" },
        { status: 200 }
      );
    }

    // Update the app_version record
    const updateData: Record<string, any> = {
      deployment_status: deploymentStatus,
      vercel_deployment_id: deploymentId,
      vercel_deployment_url: `https://${deploymentUrl}`,
    };

    if (deploymentError) {
      updateData.deployment_error = deploymentError;
    }

    const { error: updateError } = await supabaseAdmin
      .from("app_version")
      .update(updateData)
      .eq("id", versionId);

    if (updateError) {
      console.error("Error updating app_version:", updateError);
      return NextResponse.json(
        { error: "Failed to update version" },
        { status: 500 }
      );
    }

    console.log("✅ Updated deployment status:", {
      versionId,
      status: deploymentStatus,
      deploymentId,
      gitCommit,
    });

    return NextResponse.json({
      message: "Webhook processed successfully",
      versionId,
      status: deploymentStatus,
    });
  } catch (error) {
    console.error("Error processing Vercel webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
