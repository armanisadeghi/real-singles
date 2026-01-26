/**
 * Update Test User Images Script
 *
 * Replaces low-quality randomuser.me images (128x128) with high-quality
 * Unsplash portraits and adds multiple gallery images per user.
 *
 * Usage:
 *   pnpm tsx scripts/update-test-user-images.ts
 *
 * Prerequisites:
 *   - Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
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

// ============================================
// CURATED HIGH-QUALITY UNSPLASH PORTRAITS
// ============================================

// Verified Unsplash photo IDs extracted from search results
// Format: https://images.unsplash.com/photo-{ID}?w=800&h=800&fit=crop&crop=face

// MALE PORTRAITS - Verified working IDs from Unsplash search
const MALE_PORTRAIT_IDS = [
  "1560250097-0b93528c311a", // Man standing beside wall (professional)
  "1568602471122-7832951cc4c5", // Man blue button-up
  "1506794778202-cad84cf45f1d", // Man grey shirt
  "1500648767791-00dcc994a43e", // Man wearing Henley top
  "1623366302587-b38b1ddaefd9", // Man in black crew neck
  "1618077360395-f3068be8e001", // Man with glasses denim jacket
  "1583195763986-0231686dcd43", // Man in black hoodie
  "1522556189639-b150ed9c4330", // Person blue top smiling
  "1615572359976-1fe39507ed7b", // Man gray shirt near bridge
  "1594672830234-ba4cfe1202dc", // Man teal shirt glasses
  "1656338997878-279d71d48f6e", // Man with beard
  "1635995554625-6c1deba1732e", // Man beard yellow wall
  "1567324216289-97cc4134f626", // Man arms crossed b&w
  "1472099645785-5658abf4ff4e", // Man smiling headshot
  "1507003211169-0a1dd7228f2d", // Professional man portrait
  "1519085360753-af0119f7cbe7", // Man in suit
  "1570295999919-56ceb5ecca61", // Young professional man
  "1544723795-3fb6469f5b39", // Man casual portrait
  "1552058544-f2738f47c233", // Man outdoor casual
  "1557862921-37829c790f19", // Man in t-shirt
  "1542909168-82c3e7fdca5c", // Man professional
  "1540569014546-b6bef7a64272", // Man casual outdoor
  "1492562080023-ab3db95bfbce", // Professional headshot
  "1605406575413-1c5fd98c6b9a", // Man smiling casual
];

// FEMALE PORTRAITS - Verified working IDs from Unsplash search
const FEMALE_PORTRAIT_IDS = [
  "1494790108377-be9c29b29330", // Woman smiling yellow
  "1438761681033-6461ffad8d80", // Professional woman
  "1517841905240-472988babdf9", // Woman casual portrait
  "1488426862320-fb2fc92b3b79", // Woman smiling natural
  "1531746020798-e6953c6e8e04", // Woman portrait casual
  "1573496359142-b8d87734a5a2", // Professional woman
  "1580489944761-15a19d654956", // Woman casual
  "1508214751196-bcfd4ca60f91", // Woman portrait
  "1544005313-94ddf0286df2", // Woman looking up
  "1487412720507-e7ab37603c6f", // Casual female portrait
  "1529626455594-4ff0802cfb7e", // Woman smiling
  "1542596768-5d1d21f1cf98", // Young woman portrait
  "1546961342-ea1f9f95fc5e", // Professional woman
  "1489424731084-a5d8b219a5bb", // Woman portrait clean
  "1534528741775-53994a69daeb", // Woman close up
  "1524504388940-b1c1722653e1", // Woman looking
  "1508243529287-e21febc83aca", // Professional woman
  "1499887142886-791eca5918cd", // Woman outdoor
  "1509967419530-da38b4704bc6", // Professional headshot
  "1499155286265-79a9dc9c6380", // Woman outdoor casual
  "1569124589354-615739ae007b", // Smiling woman
  "1590086782957-93c06ef21604", // Woman portrait
  "1595152772835-219674b2a8a6", // Woman smiling
  "1531123897727-8f129e1688ce", // Young professional woman
];

// Additional photos for gallery variety (lifestyle shots - less strict on face)
const MALE_LIFESTYLE_IDS = [
  "1552374196-c4e7ffc6e126", // Man hiking outdoors
  "1571019613454-1cb2f99b2d8b", // Man outdoors nature
  "1517836357463-d25dfeac3438", // Man fitness
  "1518609878373-06d740f60d8b", // Man coffee shop
  "1502823403499-180fef132f67", // Man city walking
  "1507679799987-c73779587ccf", // Man in suit full body
  "1519058082700-08a0b56da9b4", // Man casual lifestyle
  "1516914943479-89db7d9ae7f2", // Man casual activity
  "1488161628813-04466f0bd926", // Man outdoor adventure
  "1496345875659-11f7dd282d1d", // Man reading
  "1525134479668-1bee5c7c6845", // Man nature
  "1528892952291-009c663ce843", // Man casual
];

const FEMALE_LIFESTYLE_IDS = [
  "1518310383802-640c2de311b2", // Woman yoga
  "1515886657613-9f3515b0c78f", // Woman running fitness
  "1502635385003-ee1e6a1a742d", // Woman coffee
  "1506152983158-b4a74a01c721", // Woman beach
  "1513258496099-48168024aec0", // Woman reading
  "1491438590914-bc09fcaaf77a", // Woman social friends
  "1518459031867-a89b944bffe4", // Woman fitness
  "1524502397800-2eeaad7c3fe5", // Woman hiking
  "1445384763658-0400939a13f9", // Woman lifestyle
  "1475503572774-15a45e5d60b9", // Woman adventure
  "1486403704522-4edfe7b4e6e2", // Woman city
  "1483721310020-03333e577078", // Woman traveling
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getUnsplashUrl(photoId: string, width = 800, height = 800): string {
  return `https://images.unsplash.com/photo-${photoId}?w=${width}&h=${height}&fit=crop&crop=face&auto=format&q=80`;
}

// Get gallery images for a user - deterministic selection based on index
function getGalleryImages(gender: "male" | "female", index: number): { url: string; isPrimary: boolean; order: number }[] {
  // Explicitly select arrays based on gender to prevent mix-ups
  const portraitIds = gender === "male" ? MALE_PORTRAIT_IDS : FEMALE_PORTRAIT_IDS;
  const lifestyleIds = gender === "male" ? MALE_LIFESTYLE_IDS : FEMALE_LIFESTYLE_IDS;
  
  // Primary portrait - use index to cycle through
  const primaryIdx = index % portraitIds.length;
  const primaryId = portraitIds[primaryIdx];
  
  // Get 2 additional portraits (different indices from primary)
  const portrait2Idx = (primaryIdx + 1) % portraitIds.length;
  const portrait3Idx = (primaryIdx + 2) % portraitIds.length;
  
  // Get 2 lifestyle photos (use index for deterministic selection)
  const lifestyle1Idx = index % lifestyleIds.length;
  const lifestyle2Idx = (index + 1) % lifestyleIds.length;
  
  return [
    { url: getUnsplashUrl(primaryId), isPrimary: true, order: 0 },
    { url: getUnsplashUrl(portraitIds[portrait2Idx]), isPrimary: false, order: 1 },
    { url: getUnsplashUrl(portraitIds[portrait3Idx]), isPrimary: false, order: 2 },
    { url: getUnsplashUrl(lifestyleIds[lifestyle1Idx], 1200, 800), isPrimary: false, order: 3 },
    { url: getUnsplashUrl(lifestyleIds[lifestyle2Idx], 1200, 800), isPrimary: false, order: 4 },
  ];
}

// ============================================
// MAIN UPDATE FUNCTION
// ============================================

async function updateTestUserImages() {
  console.log("🖼️  Starting test user image update...\n");

  // Fetch all test users
  const { data: testUsers, error: fetchError } = await supabase
    .from("users")
    .select("id, email")
    .like("email", "%@testuser.realsingles.com");

  if (fetchError) {
    console.error("Error fetching test users:", fetchError.message);
    process.exit(1);
  }

  if (!testUsers || testUsers.length === 0) {
    console.log("No test users found. Run seed-test-users.ts first.");
    process.exit(0);
  }

  console.log(`Found ${testUsers.length} test users to update.\n`);

  // Fetch profiles to determine gender
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, gender, first_name")
    .in(
      "user_id",
      testUsers.map((u) => u.id)
    );

  if (profileError) {
    console.error("Error fetching profiles:", profileError.message);
    process.exit(1);
  }

  // Create a map for quick lookup
  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

  let maleIndex = 0;
  let femaleIndex = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const user of testUsers) {
    const profile = profileMap.get(user.id);
    if (!profile) {
      console.log(`  ⚠️  No profile found for user ${user.email}`);
      errorCount++;
      continue;
    }

    const isMale = profile.gender === "male";
    const currentIndex = isMale ? maleIndex++ : femaleIndex++;

    // Get gallery images using gender-specific deterministic selection
    const galleryImages = getGalleryImages(profile.gender as "male" | "female", currentIndex);
    const primaryImageUrl = galleryImages[0].url;

    console.log(`Updating ${profile.first_name} (${profile.gender})...`);

    // 1. Update profile image URL
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ profile_image_url: primaryImageUrl })
      .eq("user_id", user.id);

    if (profileUpdateError) {
      console.error(
        `  ❌ Error updating profile for ${user.email}:`,
        profileUpdateError.message
      );
      errorCount++;
      continue;
    }

    // 2. Delete existing gallery entries for this user
    const { error: deleteError } = await supabase
      .from("user_gallery")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error(
        `  ⚠️  Error deleting old gallery for ${user.email}:`,
        deleteError.message
      );
    }

    // 3. Insert new gallery entries
    const galleryEntries = galleryImages.map((img) => ({
      user_id: user.id,
      media_type: "image",
      media_url: img.url,
      is_primary: img.isPrimary,
      display_order: img.order,
    }));

    const { error: galleryError } = await supabase
      .from("user_gallery")
      .insert(galleryEntries);

    if (galleryError) {
      console.error(
        `  ❌ Error inserting gallery for ${user.email}:`,
        galleryError.message
      );
      errorCount++;
      continue;
    }

    console.log(`  ✓ Updated with ${galleryEntries.length} HD images`);
    successCount++;

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Image update complete!");
  console.log(`   Successfully updated: ${successCount}/${testUsers.length}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Each user now has 5 high-quality images`);
  console.log("=".repeat(50));
}

// Run the update
updateTestUserImages().catch(console.error);
