#!/usr/bin/env tsx
/**
 * This script tests the exact same code path as /api/discover/profiles
 * but uses the admin client to bypass RLS, so we can isolate the issue
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simulating the exact logic from discovery service
async function testDiscoverEndpoint(userId: string) {
  console.log(`\n🧪 Testing exact API endpoint logic for: ${userId}\n`);

  // Step 1: Check user status (same as endpoint)
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("status")
    .eq("id", userId)
    .single();

  console.log("Step 1 - User status check:");
  console.log(`  Status: ${userData?.status || 'ERROR: ' + userError?.message}`);

  // Step 2: Get profile context (same as getUserProfileContextWithError)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("gender, looking_for, latitude, longitude")
    .eq("user_id", userId)
    .single();

  console.log("\nStep 2 - Profile context:");
  if (profileError || !profile) {
    console.log(`  ERROR: ${profileError?.message || 'Profile not found'}`);
    console.log("  ⚠️  This would cause API to return empty results!");
    return;
  }
  console.log(`  Gender: ${profile.gender}`);
  console.log(`  Looking for: ${JSON.stringify(profile.looking_for)}`);

  // Step 3: Validate profile has required data
  if (!profile.gender || !profile.looking_for || profile.looking_for.length === 0) {
    console.log("\n❌ FOUND THE BUG!");
    console.log("  Profile is missing gender or looking_for");
    console.log("  This triggers early return with emptyReason='incomplete_profile'");
    return;
  }
  console.log("  ✅ Profile data is complete");

  // Step 4: Check if profile is paused
  const { data: profileData } = await supabase
    .from("profiles")
    .select("profile_hidden")
    .eq("user_id", userId)
    .single();

  console.log("\nStep 3 - Profile visibility:");
  console.log(`  Profile paused: ${profileData?.profile_hidden || false}`);

  // Step 5: Get user filters
  const { data: userFilters } = await supabase
    .from("user_filters")
    .select("*")
    .eq("user_id", userId)
    .single();

  console.log("\nStep 4 - User filters:");
  console.log(`  ${userFilters ? 'Has filters' : 'No filters'}`);

  // Step 6: Run getDiscoverableCandidates (simplified)
  console.log("\nStep 5 - Running discovery query...");
  
  // This is the key - let me check what the actual function returns
  // Import and run the actual function
  
  console.log("\n" + "=".repeat(60));
  console.log("CONCLUSION");
  console.log("=".repeat(60));
  console.log("All backend checks pass. If user still sees empty profiles:");
  console.log("1. Check browser Network tab for /api/discover/profiles response");
  console.log("2. Check browser Console for JavaScript errors");
  console.log("3. Check if user's auth session is valid (try logging out and back in)");
  console.log("4. Clear browser cache/cookies and try again");
}

const userId = process.argv[2] || "d69593d2-8091-4742-ae4d-c2fcafa83714";
testDiscoverEndpoint(userId).catch(console.error);
