#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugDiscover(userId: string) {
  console.log(`\n🔍 Debugging discover for user: ${userId}\n`);
  
  const checks: Record<string, { pass: boolean; value: unknown; issue?: string }> = {};

  // Check 1: User record exists
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, status, display_name, created_at")
    .eq("id", userId)
    .single();

  checks.user_exists = {
    pass: !!user && !userError,
    value: user ? { status: user.status, email: user.email } : null,
    issue: userError ? `User not found: ${userError.message}` : undefined,
  };
  console.log(`✓ User exists: ${checks.user_exists.pass ? '✅' : '❌'}`);
  if (user) console.log(`  Email: ${user.email}, Status: ${user.status}`);

  // Check 2: User status is 'active'
  checks.user_status_active = {
    pass: user?.status === "active",
    value: user?.status,
    issue: user?.status !== "active" 
      ? `User status is '${user?.status}' (must be 'active' to see profiles due to RLS)` 
      : undefined,
  };
  console.log(`✓ User status active: ${checks.user_status_active.pass ? '✅' : '❌'} (${user?.status})`);

  // Check 3: Profile exists
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  checks.profile_exists = {
    pass: !!profile && !profileError,
    value: profile ? { 
      gender: profile.gender,
      looking_for: profile.looking_for,
      can_start_matching: profile.can_start_matching,
      profile_hidden: profile.profile_hidden,
    } : null,
    issue: profileError ? `Profile not found: ${profileError.message}` : undefined,
  };
  console.log(`✓ Profile exists: ${checks.profile_exists.pass ? '✅' : '❌'}`);

  // Check 4: Gender is set
  checks.gender_set = {
    pass: !!profile?.gender,
    value: profile?.gender,
    issue: !profile?.gender ? "Gender is not set (required for bidirectional matching)" : undefined,
  };
  console.log(`✓ Gender set: ${checks.gender_set.pass ? '✅' : '❌'} (${profile?.gender || 'NULL'})`);

  // Check 5: Looking for is set
  checks.looking_for_set = {
    pass: !!profile?.looking_for && profile.looking_for.length > 0,
    value: profile?.looking_for,
    issue: !profile?.looking_for || profile.looking_for.length === 0 
      ? "looking_for is empty (required for bidirectional matching)" 
      : undefined,
  };
  console.log(`✓ Looking for set: ${checks.looking_for_set.pass ? '✅' : '❌'} (${JSON.stringify(profile?.looking_for)})`);

  // Check 6: Can start matching
  checks.can_start_matching = {
    pass: profile?.can_start_matching === true,
    value: profile?.can_start_matching,
    issue: profile?.can_start_matching !== true 
      ? "can_start_matching is false (user hasn't completed profile setup)" 
      : undefined,
  };
  console.log(`✓ Can start matching: ${checks.can_start_matching.pass ? '✅' : '❌'} (${profile?.can_start_matching})`);

  // Check 7: Profile not hidden
  checks.profile_not_hidden = {
    pass: profile?.profile_hidden !== true,
    value: profile?.profile_hidden,
    issue: profile?.profile_hidden === true 
      ? "profile_hidden is true (user has paused their profile)" 
      : undefined,
  };
  console.log(`✓ Profile not hidden: ${checks.profile_not_hidden.pass ? '✅' : '❌'} (${profile?.profile_hidden})`);

  // Check 8: Get count of potential matches (without RLS)
  const { count: potentialMatches } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("can_start_matching", true)
    .eq("profile_hidden", false)
    .neq("user_id", userId)
    .in("gender", profile?.looking_for || [])
    .contains("looking_for", profile?.gender ? [profile.gender] : []);

  checks.potential_matches_exist = {
    pass: (potentialMatches || 0) > 0,
    value: potentialMatches,
    issue: potentialMatches === 0 
      ? "No profiles match bidirectional gender criteria" 
      : undefined,
  };
  console.log(`✓ Potential matches: ${potentialMatches || 0}`);

  // Check 9: User filters
  const { data: userFilters } = await supabase
    .from("user_filters")
    .select("*")
    .eq("user_id", userId)
    .single();

  console.log(`\n📋 User Filters: ${userFilters ? 'Set' : 'None'}`);
  if (userFilters) {
    console.log(`  - Age: ${userFilters.min_age || 'any'} - ${userFilters.max_age || 'any'}`);
    console.log(`  - Distance: ${userFilters.max_distance_miles || 'any'} miles`);
  }

  // Summary
  const criticalChecks = [
    checks.user_exists,
    checks.user_status_active,
    checks.profile_exists,
    checks.gender_set,
    checks.looking_for_set,
  ];

  const issues = Object.entries(checks)
    .filter(([, c]) => c.issue)
    .map(([key, c]) => ({ check: key, issue: c.issue }));

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  
  if (issues.length === 0) {
    console.log("✅ No blocking issues found. User should be able to see profiles.");
    console.log("   Check browser console for client-side errors.");
  } else {
    console.log("❌ BLOCKING ISSUES FOUND:\n");
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. [${issue.check}] ${issue.issue}`);
    });
  }
  console.log("");
}

const userId = process.argv[2] || "d69593d2-8091-4742-ae4d-c2fcafa83714";
debugDiscover(userId).catch(console.error);
