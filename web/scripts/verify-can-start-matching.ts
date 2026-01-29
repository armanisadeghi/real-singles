#!/usr/bin/env tsx
/**
 * Verification script for can_start_matching field
 * 
 * This script checks if all profiles have the can_start_matching field properly set
 * and optionally re-runs the calculation for any that might be incorrect.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCanStartMatching() {
  console.log("🔍 Checking can_start_matching field status...\n");

  // Get summary statistics
  const { data: stats, error: statsError } = await supabase.rpc("execute_sql", {
    query: `
      SELECT 
        COUNT(*) as total_profiles,
        COUNT(CASE WHEN can_start_matching = true THEN 1 END) as can_match,
        COUNT(CASE WHEN can_start_matching = false THEN 1 END) as cannot_match,
        COUNT(CASE WHEN can_start_matching IS NULL THEN 1 END) as null_values
      FROM profiles;
    `,
  });

  if (statsError) {
    console.error("❌ Error fetching stats:", statsError.message);
    // Try direct query instead
    const { count: totalCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: canMatchCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("can_start_matching", true);

    const { count: cannotMatchCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("can_start_matching", false);

    const { count: nullCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .is("can_start_matching", null);

    console.log("📊 Profile Statistics:");
    console.log(`   Total profiles: ${totalCount}`);
    console.log(`   Can match: ${canMatchCount}`);
    console.log(`   Cannot match: ${cannotMatchCount}`);
    console.log(`   NULL values: ${nullCount}`);
  } else {
    console.log("📊 Profile Statistics:");
    console.log(`   Total profiles: ${stats[0].total_profiles}`);
    console.log(`   Can match: ${stats[0].can_match}`);
    console.log(`   Cannot match: ${stats[0].cannot_match}`);
    console.log(`   NULL values: ${stats[0].null_values}`);
  }

  // Get sample profiles that can match
  const { data: canMatchProfiles, error: canMatchError } = await supabase
    .from("profiles")
    .select("user_id, first_name, can_start_matching")
    .eq("can_start_matching", true)
    .limit(5);

  if (!canMatchError && canMatchProfiles && canMatchProfiles.length > 0) {
    console.log("\n✅ Sample profiles that CAN match:");
    canMatchProfiles.forEach((p) => {
      console.log(`   - ${p.first_name || "No name"} (${p.user_id.substring(0, 8)}...)`);
    });
  }

  // Get sample profiles that cannot match
  const { data: cannotMatchProfiles, error: cannotMatchError } = await supabase
    .from("profiles")
    .select("user_id, first_name, can_start_matching, first_name, date_of_birth, gender, looking_for, profile_image_url")
    .eq("can_start_matching", false)
    .limit(5);

  if (!cannotMatchError && cannotMatchProfiles && cannotMatchProfiles.length > 0) {
    console.log("\n⚠️  Sample profiles that CANNOT match:");
    cannotMatchProfiles.forEach((p) => {
      const missing = [];
      if (!p.first_name) missing.push("first_name");
      if (!p.date_of_birth) missing.push("date_of_birth");
      if (!p.gender) missing.push("gender");
      if (!p.looking_for || p.looking_for.length === 0) missing.push("looking_for");
      if (!p.profile_image_url) missing.push("profile_image_url");
      
      console.log(`   - ${p.first_name || "No name"} (${p.user_id.substring(0, 8)}...) - Missing: ${missing.join(", ")}`);
    });
  }

  console.log("\n✅ Verification complete!");
  console.log("\nℹ️  The field is automatically updated by database triggers when:");
  console.log("   - Profile fields change (first_name, date_of_birth, gender, looking_for, profile_image_url)");
  console.log("   - Gallery images are added/removed");
}

async function recalculateAll() {
  console.log("\n🔄 Recalculating can_start_matching for all profiles...");

  const { error } = await supabase.rpc("execute_sql", {
    query: "UPDATE profiles SET can_start_matching = calculate_can_start_matching(profiles.*);",
  });

  if (error) {
    console.error("❌ Error recalculating:", error.message);
    console.log("\nℹ️  You can manually run this SQL in Supabase dashboard:");
    console.log("   UPDATE profiles SET can_start_matching = calculate_can_start_matching(profiles.*);");
    return;
  }

  console.log("✅ Recalculation complete!");
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const shouldRecalculate = args.includes("--recalculate") || args.includes("-r");

  await verifyCanStartMatching();

  if (shouldRecalculate) {
    await recalculateAll();
    console.log("\n🔍 Verifying after recalculation...\n");
    await verifyCanStartMatching();
  } else {
    console.log("\n💡 To recalculate all profiles, run:");
    console.log("   pnpm tsx scripts/verify-can-start-matching.ts --recalculate");
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
