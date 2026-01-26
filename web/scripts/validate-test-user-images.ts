/**
 * Validate Test User Images Script
 *
 * Checks all test user profile and gallery images for broken/invalid URLs.
 * Reports detailed information about any failures.
 *
 * Usage:
 *   pnpm tsx scripts/validate-test-user-images.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface ImageCheckResult {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  imageType: "profile" | "gallery";
  imageUrl: string;
  displayOrder?: number;
  status: "ok" | "broken" | "error";
  statusCode?: number;
  errorMessage?: string;
}

// Check if an image URL is valid by making a HEAD request
async function checkImageUrl(url: string): Promise<{ ok: boolean; statusCode?: number; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { ok: true, statusCode: response.status };
    } else {
      return { ok: false, statusCode: response.status, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: errorMessage };
  }
}

// Extract photo ID from Unsplash URL for easier identification
function extractPhotoId(url: string): string {
  const match = url.match(/photo-([^?]+)/);
  return match ? match[1] : url;
}

async function validateTestUserImages() {
  console.log("🔍 Starting image validation for test users...\n");

  // Fetch all test users with their profiles
  const { data: users, error: userError } = await supabase
    .from("users")
    .select("id, email")
    .like("email", "%@testuser.realsingles.com");

  if (userError) {
    console.error("Error fetching users:", userError.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log("No test users found.");
    return;
  }

  console.log(`Found ${users.length} test users to validate.\n`);

  // Fetch profiles
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, gender, profile_image_url")
    .in("user_id", users.map((u) => u.id));

  if (profileError) {
    console.error("Error fetching profiles:", profileError.message);
    process.exit(1);
  }

  // Fetch gallery images
  const { data: galleryImages, error: galleryError } = await supabase
    .from("user_gallery")
    .select("user_id, media_url, display_order, is_primary")
    .in("user_id", users.map((u) => u.id))
    .order("display_order");

  if (galleryError) {
    console.error("Error fetching gallery images:", galleryError.message);
    process.exit(1);
  }

  // Create lookup maps
  const userMap = new Map(users.map((u) => [u.id, u]));
  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
  const galleryMap = new Map<string, typeof galleryImages>();
  
  galleryImages?.forEach((img) => {
    const existing = galleryMap.get(img.user_id) || [];
    existing.push(img);
    galleryMap.set(img.user_id, existing);
  });

  const results: ImageCheckResult[] = [];
  const brokenImages: ImageCheckResult[] = [];
  let checkedCount = 0;
  const totalImages = (profiles?.length || 0) + (galleryImages?.length || 0);

  console.log(`Checking ${totalImages} images...\n`);

  // Check profile images
  for (const profile of profiles || []) {
    const user = userMap.get(profile.user_id);
    if (!user || !profile.profile_image_url) continue;

    checkedCount++;
    process.stdout.write(`\rChecking image ${checkedCount}/${totalImages}...`);

    const check = await checkImageUrl(profile.profile_image_url);
    const result: ImageCheckResult = {
      userId: profile.user_id,
      email: user.email,
      firstName: profile.first_name || "",
      lastName: profile.last_name || "",
      gender: profile.gender || "unknown",
      imageType: "profile",
      imageUrl: profile.profile_image_url,
      status: check.ok ? "ok" : "broken",
      statusCode: check.statusCode,
      errorMessage: check.error,
    };

    results.push(result);
    if (!check.ok) {
      brokenImages.push(result);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Check gallery images
  for (const img of galleryImages || []) {
    const user = userMap.get(img.user_id);
    const profile = profileMap.get(img.user_id);
    if (!user) continue;

    checkedCount++;
    process.stdout.write(`\rChecking image ${checkedCount}/${totalImages}...`);

    const check = await checkImageUrl(img.media_url);
    const result: ImageCheckResult = {
      userId: img.user_id,
      email: user.email,
      firstName: profile?.first_name || "",
      lastName: profile?.last_name || "",
      gender: profile?.gender || "unknown",
      imageType: "gallery",
      imageUrl: img.media_url,
      displayOrder: img.display_order,
      status: check.ok ? "ok" : "broken",
      statusCode: check.statusCode,
      errorMessage: check.error,
    };

    results.push(result);
    if (!check.ok) {
      brokenImages.push(result);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n\n" + "=".repeat(80));
  console.log("VALIDATION RESULTS");
  console.log("=".repeat(80));

  const okCount = results.filter((r) => r.status === "ok").length;
  const brokenCount = brokenImages.length;

  console.log(`\n✅ Working images: ${okCount}/${results.length}`);
  console.log(`❌ Broken images: ${brokenCount}/${results.length}\n`);

  if (brokenImages.length > 0) {
    console.log("=".repeat(80));
    console.log("BROKEN IMAGES - DETAILS");
    console.log("=".repeat(80));

    // Group by user for easier fixing
    const brokenByUser = new Map<string, ImageCheckResult[]>();
    brokenImages.forEach((img) => {
      const key = img.userId;
      const existing = brokenByUser.get(key) || [];
      existing.push(img);
      brokenByUser.set(key, existing);
    });

    for (const [userId, images] of brokenByUser) {
      const first = images[0];
      console.log(`\n👤 User: ${first.firstName} ${first.lastName}`);
      console.log(`   ID: ${userId}`);
      console.log(`   Email: ${first.email}`);
      console.log(`   Gender: ${first.gender}`);
      console.log(`   Broken images:`);
      
      for (const img of images) {
        const photoId = extractPhotoId(img.imageUrl);
        console.log(`     - [${img.imageType}${img.displayOrder !== undefined ? ` #${img.displayOrder}` : ""}] Photo ID: ${photoId}`);
        console.log(`       URL: ${img.imageUrl}`);
        console.log(`       Error: ${img.errorMessage || `HTTP ${img.statusCode}`}`);
      }
    }

    // Output SQL/commands for easy fixing
    console.log("\n" + "=".repeat(80));
    console.log("FIX COMMANDS");
    console.log("=".repeat(80));
    console.log("\nTo fix broken profile images, update them in the admin panel or run:");

    for (const [userId, images] of brokenByUser) {
      const profileImages = images.filter((i) => i.imageType === "profile");
      if (profileImages.length > 0) {
        console.log(`\n-- Fix profile image for user ${userId}:`);
        console.log(`UPDATE profiles SET profile_image_url = 'NEW_URL_HERE' WHERE user_id = '${userId}';`);
      }

      const galleryImages = images.filter((i) => i.imageType === "gallery");
      if (galleryImages.length > 0) {
        console.log(`\n-- Fix gallery images for user ${userId}:`);
        for (const img of galleryImages) {
          console.log(`UPDATE user_gallery SET media_url = 'NEW_URL_HERE' WHERE user_id = '${userId}' AND display_order = ${img.displayOrder};`);
        }
      }
    }
  }

  // Summary of gender distribution
  console.log("\n" + "=".repeat(80));
  console.log("GENDER DISTRIBUTION");
  console.log("=".repeat(80));

  const maleUsers = [...profileMap.values()].filter((p) => p.gender === "male");
  const femaleUsers = [...profileMap.values()].filter((p) => p.gender === "female");

  console.log(`\nMale users: ${maleUsers.length}`);
  console.log(`Female users: ${femaleUsers.length}`);

  // List all users with their current primary image for manual review
  console.log("\n" + "=".repeat(80));
  console.log("ALL USERS - FOR MANUAL GENDER VERIFICATION");
  console.log("=".repeat(80));
  console.log("\nReview these in the admin panel at /admin/users\n");

  for (const profile of profiles || []) {
    const user = userMap.get(profile.user_id);
    if (!user) continue;
    const photoId = profile.profile_image_url ? extractPhotoId(profile.profile_image_url) : "none";
    console.log(`${profile.gender?.padEnd(6)} | ${(profile.first_name || "").padEnd(12)} ${(profile.last_name || "").padEnd(12)} | ID: ${profile.user_id} | Photo: ${photoId}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("DONE");
  console.log("=".repeat(80));
}

validateTestUserImages().catch(console.error);
