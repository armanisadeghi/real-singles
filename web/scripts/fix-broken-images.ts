/**
 * Fix Broken Images Script
 *
 * Replaces broken Unsplash image URLs with known-working alternatives.
 *
 * Usage:
 *   pnpm tsx scripts/fix-broken-images.ts
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

// Known broken photo IDs and their replacements
// These are verified working Unsplash photo IDs
const BROKEN_TO_WORKING_MAP: Record<string, string> = {
  // Broken male photos -> working male replacements
  "1605406575413-1c5fd98c6b9a": "1507003211169-0a1dd7228f2d",
  "1552058544-f2738f47c233": "1560250097-0b93528c311a",
  "1540569014546-b6bef7a64272": "1568602471122-7832951cc4c5",
  "1557862921-37829c790f19": "1506794778202-cad84cf45f1d",
  "1542909168-82c3e7fdca5c": "1500648767791-00dcc994a43e",
  "1544723795-3fb6469f5b39": "1623366302587-b38b1ddaefd9",
  "1570295999919-56ceb5ecca61": "1618077360395-f3068be8e001",
  "1594672830234-ba4cfe1202dc": "1656338997878-279d71d48f6e", // Omar's teal shirt
  
  // Broken lifestyle photos -> working lifestyle replacements
  "1488161628813-04466f0bd926": "1517836357463-d25dfeac3438",
  "1528892952291-009c663ce843": "1518609878373-06d740f60d8b",
  "1519058082700-08a0b56da9b4": "1571019613454-1cb2f99b2d8b",
  "1502823403499-180fef132f67": "1552374196-c4e7ffc6e126", // Man hiking
  
  // Female broken photos -> working female replacements
  "1590086782957-93c06ef21604": "1494790108377-be9c29b29330",
  "1546961342-ea1f9f95fc5e": "1573496359142-b8d87734a5a2", // Professional woman
};

// Additional verified working male portrait IDs
const VERIFIED_MALE_IDS = [
  "1507003211169-0a1dd7228f2d",
  "1560250097-0b93528c311a",
  "1568602471122-7832951cc4c5",
  "1506794778202-cad84cf45f1d",
  "1500648767791-00dcc994a43e",
  "1623366302587-b38b1ddaefd9",
  "1618077360395-f3068be8e001",
  "1583195763986-0231686dcd43",
  "1522556189639-b150ed9c4330",
  "1615572359976-1fe39507ed7b",
  "1594672830234-ba4cfe1202dc",
  "1656338997878-279d71d48f6e",
  "1635995554625-6c1deba1732e",
  "1567324216289-97cc4134f626",
  "1472099645785-5658abf4ff4e",
  "1519085360753-af0119f7cbe7",
];

// Additional verified working female portrait IDs
const VERIFIED_FEMALE_IDS = [
  "1494790108377-be9c29b29330",
  "1438761681033-6461ffad8d80",
  "1517841905240-472988babdf9",
  "1488426862320-fb2fc92b3b79",
  "1531746020798-e6953c6e8e04",
  "1573496359142-b8d87734a5a2",
  "1580489944761-15a19d654956",
  "1508214751196-bcfd4ca60f91",
  "1544005313-94ddf0286df2",
  "1487412720507-e7ab37603c6f",
  "1529626455594-4ff0802cfb7e",
  "1542596768-5d1d21f1cf98",
  "1546961342-ea1f9f95fc5e",
  "1489424731084-a5d8b219a5bb",
  "1534528741775-53994a69daeb",
  "1524504388940-b1c1722653e1",
];

// Verified working lifestyle IDs
const VERIFIED_LIFESTYLE_IDS = [
  "1552374196-c4e7ffc6e126",
  "1571019613454-1cb2f99b2d8b",
  "1517836357463-d25dfeac3438",
  "1518609878373-06d740f60d8b",
  "1502823403499-180fef132f67",
  "1507679799987-c73779587ccf",
  "1496345875659-11f7dd282d1d",
  "1525134479668-1bee5c7c6845",
  "1518310383802-640c2de311b2",
  "1515886657613-9f3515b0c78f",
  "1502635385003-ee1e6a1a742d",
  "1506152983158-b4a74a01c721",
  "1513258496099-48168024aec0",
  "1491438590914-bc09fcaaf77a",
  "1524502397800-2eeaad7c3fe5",
  "1483721310020-03333e577078",
];

function extractPhotoId(url: string): string | null {
  const match = url.match(/photo-([^?]+)/);
  return match ? match[1] : null;
}

function buildUrl(photoId: string, width = 800, height = 800): string {
  return `https://images.unsplash.com/photo-${photoId}?w=${width}&h=${height}&fit=crop&crop=face&auto=format&q=80`;
}

async function checkImageUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

async function fixBrokenImages() {
  console.log("🔧 Starting broken image fix...\n");

  // Get only test users
  const { data: testUsers } = await supabase
    .from("users")
    .select("id")
    .like("email", "%@testuser.realsingles.com");

  const testUserIds = new Set(testUsers?.map((u) => u.id) || []);
  
  if (testUserIds.size === 0) {
    console.log("No test users found.");
    return;
  }

  // Fetch profiles for test users
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, gender, profile_image_url")
    .in("user_id", Array.from(testUserIds));

  if (profileError) {
    console.error("Error fetching profiles:", profileError.message);
    process.exit(1);
  }

  // Fetch all gallery images for test users
  const { data: galleryImages, error: galleryError } = await supabase
    .from("user_gallery")
    .select("id, user_id, media_url, display_order")
    .in("user_id", Array.from(testUserIds));

  if (galleryError) {
    console.error("Error fetching gallery:", galleryError.message);
    process.exit(1);
  }

  let fixedCount = 0;
  let errorCount = 0;
  const usersFixes: Map<string, { name: string; gender: string; fixes: string[] }> = new Map();

  // Fix profile images
  console.log("Checking profile images...\n");
  for (const profile of profiles || []) {
    if (!testUserIds.has(profile.user_id) || !profile.profile_image_url) continue;

    const photoId = extractPhotoId(profile.profile_image_url);
    if (!photoId) continue;

    const isWorking = await checkImageUrl(profile.profile_image_url);
    if (!isWorking) {
      // Find a replacement
      let newPhotoId = BROKEN_TO_WORKING_MAP[photoId];
      if (!newPhotoId) {
        // Use a verified ID based on gender
        const verifiedIds = profile.gender === "male" ? VERIFIED_MALE_IDS : VERIFIED_FEMALE_IDS;
        newPhotoId = verifiedIds[Math.floor(Math.random() * verifiedIds.length)];
      }

      const newUrl = buildUrl(newPhotoId);

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({ profile_image_url: newUrl })
        .eq("user_id", profile.user_id);

      if (error) {
        console.log(`  ❌ Failed to fix profile for ${profile.first_name}: ${error.message}`);
        errorCount++;
      } else {
        const key = profile.user_id;
        const existing = usersFixes.get(key) ?? { name: `${profile.first_name} ${profile.last_name}`, gender: profile.gender || "unknown", fixes: [] as string[] };
        existing.fixes.push(`Profile: ${photoId} -> ${newPhotoId}`);
        usersFixes.set(key, existing);
        fixedCount++;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  // Fix gallery images
  console.log("\nChecking gallery images...\n");
  for (const img of galleryImages || []) {
    const photoId = extractPhotoId(img.media_url);
    if (!photoId) continue;

    const isWorking = await checkImageUrl(img.media_url);
    if (!isWorking) {
      // Find profile for gender info
      const profile = profiles?.find((p) => p.user_id === img.user_id);
      const gender = profile?.gender || "male";

      // Find a replacement
      let newPhotoId = BROKEN_TO_WORKING_MAP[photoId];
      if (!newPhotoId) {
        // Use display_order to decide: 0-2 are portraits, 3-4 are lifestyle
        if (img.display_order !== undefined && img.display_order >= 3) {
          newPhotoId = VERIFIED_LIFESTYLE_IDS[Math.floor(Math.random() * VERIFIED_LIFESTYLE_IDS.length)];
        } else {
          const verifiedIds = gender === "male" ? VERIFIED_MALE_IDS : VERIFIED_FEMALE_IDS;
          newPhotoId = verifiedIds[Math.floor(Math.random() * verifiedIds.length)];
        }
      }

      const width = img.display_order !== undefined && img.display_order >= 3 ? 1200 : 800;
      const height = img.display_order !== undefined && img.display_order >= 3 ? 800 : 800;
      const newUrl = buildUrl(newPhotoId, width, height);

      // Update gallery
      const { error } = await supabase
        .from("user_gallery")
        .update({ media_url: newUrl })
        .eq("id", img.id);

      if (error) {
        console.log(`  ❌ Failed to fix gallery image: ${error.message}`);
        errorCount++;
      } else {
        const key = img.user_id;
        const existing = usersFixes.get(key) ?? { name: profile?.first_name ? `${profile.first_name} ${profile.last_name}` : "Unknown", gender: gender, fixes: [] as string[] };
        existing.fixes.push(`Gallery #${img.display_order}: ${photoId} -> ${newPhotoId}`);
        usersFixes.set(key, existing);
        fixedCount++;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("FIX RESULTS");
  console.log("=".repeat(60));

  if (usersFixes.size > 0) {
    console.log("\nFixed users:");
    for (const [userId, data] of usersFixes) {
      console.log(`\n👤 ${data.name} (${data.gender})`);
      console.log(`   ID: ${userId}`);
      for (const fix of data.fixes) {
        console.log(`   ✓ ${fix}`);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Fixed: ${fixedCount} images`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log("=".repeat(60));

  if (fixedCount > 0) {
    console.log("\n💡 Run validate-test-user-images.ts again to verify all images are working.");
  }
}

fixBrokenImages().catch(console.error);
