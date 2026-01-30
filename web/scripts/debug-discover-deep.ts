#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugDiscoverDeep(userId: string) {
  console.log(`\n🔍 Deep debug for user: ${userId}\n`);

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  console.log("=".repeat(60));
  console.log("USER PROFILE");
  console.log("=".repeat(60));
  console.log(`Gender: ${profile?.gender}`);
  console.log(`Looking for: ${JSON.stringify(profile?.looking_for)}`);
  console.log(`Location: ${profile?.city}, ${profile?.state}`);
  console.log(`Lat/Long: ${profile?.latitude}, ${profile?.longitude}`);
  console.log(`can_start_matching: ${profile?.can_start_matching}`);
  console.log(`profile_hidden: ${profile?.profile_hidden}`);

  // Check user filters
  const { data: filters } = await supabase
    .from("user_filters")
    .select("*")
    .eq("user_id", userId)
    .single();

  console.log("\n" + "=".repeat(60));
  console.log("USER FILTERS");
  console.log("=".repeat(60));
  if (filters) {
    console.log(`Age range: ${filters.min_age || 'any'} - ${filters.max_age || 'any'}`);
    console.log(`Max distance: ${filters.max_distance_miles || 'any'} miles`);
    console.log(`Body types: ${JSON.stringify(filters.body_types)}`);
    console.log(`Ethnicities: ${JSON.stringify(filters.ethnicities)}`);
    console.log(`Religions: ${JSON.stringify(filters.religions)}`);
  } else {
    console.log("No filters set");
  }

  // Check actions (likes, passes)
  const { data: actions, count: actionsCount } = await supabase
    .from("matches")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .eq("is_unmatched", false);

  console.log("\n" + "=".repeat(60));
  console.log("ACTIONS TAKEN BY USER");
  console.log("=".repeat(60));
  console.log(`Total actions: ${actionsCount}`);
  
  const likes = actions?.filter(a => a.action === 'like') || [];
  const passes = actions?.filter(a => a.action === 'pass') || [];
  const superLikes = actions?.filter(a => a.action === 'super_like') || [];
  
  console.log(`  - Likes: ${likes.length}`);
  console.log(`  - Passes: ${passes.length}`);
  console.log(`  - Super likes: ${superLikes.length}`);

  // Check who has passed on this user
  const { count: passedOnMeCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("target_user_id", userId)
    .eq("action", "pass")
    .eq("is_unmatched", false);

  console.log(`\nUsers who passed on this user: ${passedOnMeCount}`);

  // Check blocks
  const { count: blockedByMeCount } = await supabase
    .from("blocks")
    .select("*", { count: "exact", head: true })
    .eq("blocker_id", userId);

  const { count: blockedMeCount } = await supabase
    .from("blocks")
    .select("*", { count: "exact", head: true })
    .eq("blocked_id", userId);

  console.log(`\nBlocked by user: ${blockedByMeCount}`);
  console.log(`Blocked this user: ${blockedMeCount}`);

  // Check mutual matches
  const { data: myLikes } = await supabase
    .from("matches")
    .select("target_user_id")
    .eq("user_id", userId)
    .in("action", ["like", "super_like"])
    .eq("is_unmatched", false);

  const myLikedIds = myLikes?.map(m => m.target_user_id).filter(Boolean) || [];

  const { data: likedMeBack } = await supabase
    .from("matches")
    .select("user_id")
    .eq("target_user_id", userId)
    .in("user_id", myLikedIds.length > 0 ? myLikedIds : ['no-matches'])
    .in("action", ["like", "super_like"])
    .eq("is_unmatched", false);

  console.log(`\nMutual matches: ${likedMeBack?.length || 0}`);

  // Now let's see what the actual query returns
  console.log("\n" + "=".repeat(60));
  console.log("SIMULATING DISCOVER QUERY");
  console.log("=".repeat(60));

  // Build exclusion list
  const actedOnIds = actions?.map(a => a.target_user_id).filter(Boolean) || [];
  
  const { data: passedOnMe } = await supabase
    .from("matches")
    .select("user_id")
    .eq("target_user_id", userId)
    .eq("action", "pass")
    .eq("is_unmatched", false);
  const passedOnMeIds = passedOnMe?.map(m => m.user_id).filter(Boolean) || [];

  const { data: blockedByMe } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", userId);
  const blockedByMeIds = blockedByMe?.map(b => b.blocked_id).filter(Boolean) || [];

  const { data: blockedMe } = await supabase
    .from("blocks")
    .select("blocker_id")
    .eq("blocked_id", userId);
  const blockedMeIds = blockedMe?.map(b => b.blocker_id).filter(Boolean) || [];

  const allExcludeIds = new Set([
    userId,
    ...actedOnIds,
    ...passedOnMeIds,
    ...blockedByMeIds,
    ...blockedMeIds,
  ]);

  console.log(`\nExclusion set size: ${allExcludeIds.size}`);
  console.log(`  - Self: 1`);
  console.log(`  - Already acted on: ${actedOnIds.length}`);
  console.log(`  - Passed on me: ${passedOnMeIds.length}`);
  console.log(`  - Blocked by me: ${blockedByMeIds.length}`);
  console.log(`  - Blocked me: ${blockedMeIds.length}`);

  // Run the actual query
  let query = supabase
    .from("profiles")
    .select(`*, users!inner(id, display_name, status, email)`, { count: "exact" })
    .eq("can_start_matching", true)
    .eq("profile_hidden", false)
    .not("users.status", "in", '("suspended","deleted")')
    .in("gender", profile?.looking_for || [])
    .contains("looking_for", profile?.gender ? [profile.gender] : []);

  if (allExcludeIds.size > 0) {
    query = query.not("user_id", "in", `(${Array.from(allExcludeIds).join(",")})`);
  }

  // Apply filters if set
  if (filters?.min_age || filters?.max_age) {
    const today = new Date();
    if (filters.max_age) {
      const minDate = new Date(today.getFullYear() - filters.max_age - 1, today.getMonth(), today.getDate());
      query = query.gte("date_of_birth", minDate.toISOString().split("T")[0]);
    }
    if (filters.min_age) {
      const maxDate = new Date(today.getFullYear() - filters.min_age, today.getMonth(), today.getDate());
      query = query.lte("date_of_birth", maxDate.toISOString().split("T")[0]);
    }
  }

  const { data: results, count, error } = await query.limit(50);

  console.log("\n" + "=".repeat(60));
  console.log("QUERY RESULTS");
  console.log("=".repeat(60));
  
  if (error) {
    console.log(`❌ Query error: ${error.message}`);
  } else {
    console.log(`✅ Found ${count} profiles`);
    if (results && results.length > 0) {
      console.log(`\nFirst 5 results:`);
      results.slice(0, 5).forEach((p, i) => {
        const user = Array.isArray(p.users) ? p.users[0] : p.users;
        console.log(`  ${i + 1}. ${p.first_name} (${p.gender}) - ${user?.status}`);
      });
    }
  }

  // Check if filters are too restrictive
  if (count === 0 && filters) {
    console.log("\n" + "=".repeat(60));
    console.log("CHECKING IF FILTERS ARE TOO RESTRICTIVE");
    console.log("=".repeat(60));

    // Try without age filter
    const { count: withoutAgeFilter } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("can_start_matching", true)
      .eq("profile_hidden", false)
      .in("gender", profile?.looking_for || [])
      .contains("looking_for", profile?.gender ? [profile.gender] : [])
      .not("user_id", "in", `(${Array.from(allExcludeIds).join(",")})`);

    console.log(`Without age filter: ${withoutAgeFilter} profiles`);

    if (filters.min_age || filters.max_age) {
      console.log(`\n⚠️  Age filter (${filters.min_age}-${filters.max_age}) may be excluding profiles`);
    }
  }
}

const userId = process.argv[2] || "d69593d2-8091-4742-ae4d-c2fcafa83714";
debugDiscoverDeep(userId).catch(console.error);
