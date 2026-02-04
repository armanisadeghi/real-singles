#!/usr/bin/env tsx
/**
 * Create Test Matchmakers Script
 * 
 * Creates sample matchmaker accounts with test data for testing the matchmakers feature.
 * 
 * Usage:
 *   cd web
 *   pnpm tsx scripts/create-test-matchmakers.ts
 * 
 * Creates 3 matchmakers:
 *   1. sophia.matchmaker@testuser.realsingles.com - Professional matchmaker (5 years exp)
 *   2. marcus.matchmaker@testuser.realsingles.com - LGBTQ+ specialist (8 years exp)
 *   3. elena.matchmaker@testuser.realsingles.com - Faith-based matchmaker (3 years exp)
 * 
 * All use password: MyCustomPass123!
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const password = "MyCustomPass123!";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const matchmakers = [
  {
    email: "sophia.matchmaker@testuser.realsingles.com",
    display_name: "Sophia Chen",
    first_name: "Sophia",
    last_name: "Chen",
    date_of_birth: "1985-03-15",
    gender: "female",
    city: "San Francisco",
    state: "CA",
    profile_image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    bio: "Professional matchmaker with 5 years of experience helping career-focused individuals find lasting love. I specialize in understanding what makes professional relationships thrive.",
    specialties: ["professionals", "career_focused"],
    years_experience: 5,
    certifications: ["ICF Certified Coach", "Matchmaking Institute Graduate"],
  },
  {
    email: "marcus.matchmaker@testuser.realsingles.com",
    display_name: "Marcus Rivera",
    first_name: "Marcus",
    last_name: "Rivera",
    date_of_birth: "1982-07-22",
    gender: "male",
    city: "Los Angeles",
    state: "CA",
    profile_image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    bio: "LGBTQ+ matchmaking specialist with 8 years of experience creating meaningful connections in the queer community. Understanding, inclusive, and dedicated to finding your perfect match.",
    specialties: ["lgbtq", "diverse_backgrounds"],
    years_experience: 8,
    certifications: ["LGBTQ+ Cultural Competency", "Certified Professional Matchmaker"],
  },
  {
    email: "elena.matchmaker@testuser.realsingles.com",
    display_name: "Elena Rodriguez",
    first_name: "Elena",
    last_name: "Rodriguez",
    date_of_birth: "1990-11-08",
    gender: "female",
    city: "Austin",
    state: "TX",
    profile_image_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    bio: "Faith-based matchmaker helping individuals find partners who share their values and beliefs. 3 years of experience creating connections rooted in shared faith and life goals.",
    specialties: ["faith_based", "traditional_values"],
    years_experience: 3,
    certifications: ["Certified Relationship Coach"],
  },
];

async function createMatchmaker(data: typeof matchmakers[0]) {
  console.log(`\n🔄 Creating matchmaker: ${data.email}`);

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", data.email)
    .single();

  if (existingUser) {
    console.log(`   ℹ️  User already exists, updating...`);
    
    // Update password
    await supabase.auth.admin.updateUserById(existingUser.id, { password });
    console.log(`   ✅ Password updated`);
    
    // Update profile with photo and hidden flag
    await supabase
      .from("profiles")
      .update({
        profile_hidden: true,
        profile_image_url: data.profile_image_url,
        bio: data.bio,
        first_name: data.first_name,
        last_name: data.last_name,
      })
      .eq("user_id", existingUser.id);
    
    console.log(`   ✅ Profile updated (hidden from discovery, photo added)`);
    
    return createMatchmakerProfile(existingUser.id, data);
  }

  // 1. Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: data.display_name,
    },
  });

  if (authError) {
    console.error(`   ❌ Auth error:`, authError.message);
    return;
  }

  if (!authUser.user) {
    console.error(`   ❌ No user returned`);
    return;
  }

  console.log(`   ✅ Auth user created`);

  // 2. Create user record
  const { error: userError } = await supabase.from("users").insert({
    id: authUser.user.id,
    email: data.email,
    display_name: data.display_name,
    role: "user",
  });

  if (userError && !userError.message.includes("duplicate key")) {
    console.error(`   ❌ User record error:`, userError.message);
    return;
  }

  console.log(`   ✅ User record created`);

  // 3. Create profile (hidden from discovery)
  const { error: profileError } = await supabase.from("profiles").insert({
    user_id: authUser.user.id,
    first_name: data.first_name,
    last_name: data.last_name,
    date_of_birth: data.date_of_birth,
    gender: data.gender,
    city: data.city,
    state: data.state,
    bio: data.bio,
    profile_image_url: data.profile_image_url,
    profile_hidden: true, // Hide from normal discovery
  });

  if (profileError && !profileError.message.includes("duplicate key")) {
    console.error(`   ❌ Profile error:`, profileError.message);
    return;
  }

  console.log(`   ✅ Profile created`);

  return createMatchmakerProfile(authUser.user.id, data);
}

async function createMatchmakerProfile(userId: string, data: typeof matchmakers[0]) {
  // Update profile to ensure hidden and has photo
  await supabase
    .from("profiles")
    .update({
      profile_hidden: true,
      profile_image_url: data.profile_image_url,
      bio: data.bio,
    })
    .eq("user_id", userId);

  // 4. Create matchmaker record
  const { data: matchmaker, error: matchmakerError } = await supabase
    .from("matchmakers")
    .insert({
      user_id: userId,
      status: "approved",
      bio: data.bio,
      specialties: data.specialties,
      years_experience: data.years_experience,
      certifications: data.certifications,
      approved_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (matchmakerError) {
    if (matchmakerError.message.includes("duplicate key")) {
      console.log(`   ℹ️  Matchmaker profile already exists`);
      
      // Update to ensure approved status and hidden profile
      await supabase
        .from("matchmakers")
        .update({
          status: "approved",
          bio: data.bio,
          specialties: data.specialties,
          years_experience: data.years_experience,
          certifications: data.certifications,
        })
        .eq("user_id", userId);
      
      console.log(`   ✅ Matchmaker profile updated`);
      return;
    }
    console.error(`   ❌ Matchmaker error:`, matchmakerError.message);
    return;
  }

  console.log(`   ✅ Matchmaker profile created (${matchmaker.id})`);

  // 5. Add some sample reviews
  const reviews = [
    { rating: 5, text: "Absolutely amazing! Found my perfect match in just 3 months. Sophia really understood what I was looking for." },
    { rating: 5, text: "Professional, thoughtful, and truly cares about finding compatible matches. Highly recommend!" },
    { rating: 4, text: "Great experience overall. The introductions were well-thought-out and matched my preferences." },
  ];

  for (const review of reviews) {
    // Create a fake reviewer (use existing test users)
    const { data: randomUser } = await supabase
      .from("users")
      .select("id")
      .like("email", "%@testuser.realsingles.com")
      .neq("id", userId)
      .limit(1)
      .single();

    if (randomUser) {
      await supabase.from("matchmaker_reviews").insert({
        matchmaker_id: matchmaker.id,
        reviewer_user_id: randomUser.id,
        rating: review.rating,
        review_text: review.text,
        is_verified_client: true,
      });
    }
  }

  console.log(`   ✅ Sample reviews added`);
}

async function main() {
  console.log("🎯 Creating Test Matchmakers\n");
  console.log("Password for all accounts: MyCustomPass123!\n");

  for (const matchmaker of matchmakers) {
    await createMatchmaker(matchmaker);
  }

  console.log("\n✨ Done! Test matchmakers created.\n");
  console.log("You can now log in as:");
  matchmakers.forEach((m) => {
    console.log(`  - ${m.email}`);
  });
  console.log("\nPassword: MyCustomPass123!");
}

main().catch(console.error);
