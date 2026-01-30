#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function checkDistances() {
  const userId = "d69593d2-8091-4742-ae4d-c2fcafa83714";
  
  // Get user's location
  const { data: user } = await supabase
    .from("profiles")
    .select("first_name, latitude, longitude, city, state, looking_for, gender")
    .eq("user_id", userId)
    .single();

  console.log(`\n📍 User: ${user?.first_name} (${user?.city}, ${user?.state})`);
  console.log(`   Location: ${user?.latitude}, ${user?.longitude}`);
  console.log(`   Looking for: ${JSON.stringify(user?.looking_for)}`);

  // Get all male profiles that match criteria
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, city, state, latitude, longitude, date_of_birth, body_type, can_start_matching")
    .eq("gender", "male")
    .contains("looking_for", ["female"])
    .eq("can_start_matching", true)
    .eq("profile_hidden", false)
    .neq("user_id", userId);

  console.log(`\n📊 Found ${profiles?.length} potential male matches:\n`);
  
  const distances = profiles?.map(p => {
    let distanceKm = null;
    let distanceMiles = null;
    if (user?.latitude && user?.longitude && p.latitude && p.longitude) {
      distanceKm = calculateDistanceKm(user.latitude, user.longitude, p.latitude, p.longitude);
      distanceMiles = distanceKm / 1.60934;
    }
    return {
      name: p.first_name,
      city: p.city,
      state: p.state,
      distanceMiles: distanceMiles ? Math.round(distanceMiles) : 'N/A',
      canMatch: p.can_start_matching,
      hasLocation: !!(p.latitude && p.longitude),
    };
  }).sort((a, b) => {
    if (a.distanceMiles === 'N/A') return 1;
    if (b.distanceMiles === 'N/A') return -1;
    return (a.distanceMiles as number) - (b.distanceMiles as number);
  });

  distances?.forEach((d, i) => {
    const within150 = d.distanceMiles !== 'N/A' && (d.distanceMiles as number) <= 150;
    console.log(`  ${i + 1}. ${d.name} (${d.city}, ${d.state}) - ${d.distanceMiles} miles ${within150 ? '✅' : '❌'}`);
  });

  const within150Count = distances?.filter(d => d.distanceMiles !== 'N/A' && (d.distanceMiles as number) <= 150).length;
  console.log(`\n✅ Profiles within 150 miles: ${within150Count}`);
  console.log(`❌ Profiles outside 150 miles or no location: ${(profiles?.length || 0) - (within150Count || 0)}`);
}

checkDistances();
