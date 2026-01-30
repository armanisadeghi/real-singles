/**
 * Seed Test Users Script
 * 
 * Creates diverse test users for testing the matching algorithm, search, and filters.
 * Images are downloaded from Unsplash and uploaded to Supabase Storage to match
 * the real user upload flow (storage paths, not external URLs).
 * 
 * Usage:
 *   pnpm tsx scripts/seed-test-users.ts
 *   pnpm seed:users
 * 
 * Prerequisites:
 *   - Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - Install tsx: pnpm add -D tsx
 * 
 * Note: This script takes longer than before (~5-10 min) due to image downloads/uploads.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
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
// IMAGE UPLOAD UTILITIES
// ============================================

/**
 * Download an image from Unsplash and return as ArrayBuffer
 */
async function downloadImage(photoId: string, width: number, height: number): Promise<ArrayBuffer | null> {
  const url = `https://images.unsplash.com/photo-${photoId}?w=${width}&h=${height}&fit=crop&crop=face&auto=format&q=80`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`    Failed to download image ${photoId}: ${response.status}`);
      return null;
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error(`    Error downloading image ${photoId}:`, error);
    return null;
  }
}

/**
 * Upload an image to Supabase Storage and return the storage path
 */
async function uploadImageToStorage(
  client: SupabaseClient,
  userId: string,
  imageBuffer: ArrayBuffer,
  index: number
): Promise<string | null> {
  const timestamp = Date.now();
  const storagePath = `${userId}/${timestamp}_photo_${index}.jpg`;
  
  try {
    const { error: uploadError } = await client.storage
      .from("gallery")
      .upload(storagePath, imageBuffer, {
        contentType: "image/jpeg",
        cacheControl: "3600",
      });
    
    if (uploadError) {
      console.error(`    Storage upload error: ${uploadError.message}`);
      return null;
    }
    
    return storagePath;
  } catch (error) {
    console.error(`    Unexpected upload error:`, error);
    return null;
  }
}

/**
 * Download from Unsplash and upload to Supabase Storage
 * Returns the storage path (NOT full URL)
 */
async function downloadAndUploadImage(
  client: SupabaseClient,
  userId: string,
  photoId: string,
  index: number,
  width: number,
  height: number
): Promise<string | null> {
  // Download from Unsplash
  const imageBuffer = await downloadImage(photoId, width, height);
  if (!imageBuffer) {
    return null;
  }
  
  // Small delay to avoid rate limiting
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  // Upload to Supabase Storage
  const storagePath = await uploadImageToStorage(client, userId, imageBuffer, index);
  return storagePath;
}

// ============================================
// TEST DATA CONFIGURATION
// ============================================

// US Cities with coordinates for geographic diversity
const US_LOCATIONS = [
  { city: "New York", state: "NY", lat: 40.7128, lng: -74.006 },
  { city: "Los Angeles", state: "CA", lat: 34.0522, lng: -118.2437 },
  { city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298 },
  { city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698 },
  { city: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.074 },
  { city: "San Francisco", state: "CA", lat: 37.7749, lng: -122.4194 },
  { city: "Seattle", state: "WA", lat: 47.6062, lng: -122.3321 },
  { city: "Miami", state: "FL", lat: 25.7617, lng: -80.1918 },
  { city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903 },
  { city: "Boston", state: "MA", lat: 42.3601, lng: -71.0589 },
  { city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431 },
  { city: "Nashville", state: "TN", lat: 36.1627, lng: -86.7816 },
  { city: "San Diego", state: "CA", lat: 32.7157, lng: -117.1611 },
  { city: "Portland", state: "OR", lat: 45.5152, lng: -122.6784 },
  { city: "Atlanta", state: "GA", lat: 33.749, lng: -84.388 },
  { city: "Las Vegas", state: "NV", lat: 36.1699, lng: -115.1398 },
  { city: "Minneapolis", state: "MN", lat: 44.9778, lng: -93.265 },
  { city: "Philadelphia", state: "PA", lat: 39.9526, lng: -75.1652 },
  { city: "Charlotte", state: "NC", lat: 35.2271, lng: -80.8431 },
  { city: "Dallas", state: "TX", lat: 32.7767, lng: -96.797 },
];

// First names by gender
const MALE_FIRST_NAMES = [
  "James", "Michael", "David", "Robert", "John", "William", "Christopher",
  "Daniel", "Matthew", "Anthony", "Joseph", "Andrew", "Ryan", "Brandon",
  "Joshua", "Kevin", "Brian", "Eric", "Steven", "Mark", "Jason", "Tyler",
  "Justin", "Nathan", "Adam", "Benjamin", "Samuel", "Thomas", "Patrick",
  "Alexander", "Carlos", "Marcus", "Derek", "Victor", "Omar", "Isaiah",
];

const FEMALE_FIRST_NAMES = [
  "Jennifer", "Sarah", "Emily", "Jessica", "Ashley", "Amanda", "Stephanie",
  "Nicole", "Melissa", "Michelle", "Samantha", "Lauren", "Rachel", "Brittany",
  "Elizabeth", "Rebecca", "Christina", "Katherine", "Megan", "Amber",
  "Taylor", "Olivia", "Victoria", "Hannah", "Sophia", "Emma", "Ava",
  "Madison", "Chloe", "Natalie", "Grace", "Kayla", "Jasmine", "Maya",
  "Isabella", "Gabriella",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
  "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
  "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
];

// Options arrays
const BODY_TYPES = ["slim", "athletic", "average", "muscular", "curvy", "plus_size"];
const ETHNICITIES = ["white", "latino", "black", "asian", "mixed", "middle_eastern", "east_indian"];
const RELIGIONS = ["christian", "lds", "protestant", "catholic", "jewish", "muslim", "buddhist", "hindu", "agnostic", "atheist", "spiritual", "adventist", "other"];
const POLITICAL_VIEWS = ["conservative", "liberal", "moderate", "libertarian", "undecided", "not_political"];
const EDUCATION_LEVELS = ["high_school", "trade_school", "some_college", "associate", "bachelor", "graduate", "phd"];
const MARITAL_STATUSES = ["never_married", "divorced", "separated", "widowed"];
const SMOKING_OPTIONS = ["never", "occasionally", "daily", "trying_to_quit"];
const DRINKING_OPTIONS = ["never", "social", "moderate", "regular"];
const MARIJUANA_OPTIONS = ["never", "occasionally", "yes"];
const EXERCISE_OPTIONS = ["never", "sometimes", "regularly", "daily"];
const HAS_KIDS_OPTIONS = ["no", "yes_live_at_home", "yes_live_away", "yes_shared"];
const WANTS_KIDS_OPTIONS = ["no", "no_ok_if_partner_has", "yes", "not_sure"];
const PETS_OPTIONS = ["dog", "cat", "fish", "other", "dont_have_but_love", "pet_free", "allergic"];
const ZODIAC_SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];

// ============================================
// CURATED HIGH-QUALITY UNSPLASH PORTRAITS
// ============================================

// Verified Unsplash photo IDs extracted from search results
// Format: https://images.unsplash.com/photo-{ID}?w=800&h=800&fit=crop&crop=face
//
// IMPORTANT: When adding new IDs, verify the gender matches the array!
// To find timestamp IDs: curl the Unsplash photo page and grep for 'photo-[0-9]*-[a-f0-9]*'
// Example: curl -s "https://unsplash.com/photos/{slug}" | grep -o 'photo-[0-9]*-[a-f0-9]*' | head -1

// MALE PORTRAITS - Verified working IDs from Unsplash search
// Note: All images verified to show males. IDs follow format: timestamp-hash
const MALE_PORTRAIT_IDS = [
  "1560250097-0b93528c311a", // Man standing beside wall (professional)
  "1568602471122-7832951cc4c5", // Man blue button-up
  "1506794778202-cad84cf45f1d", // Man grey shirt
  "1500648767791-00dcc994a43e", // Man wearing Henley top
  "1623366302587-b38b1ddaefd9", // Man in black crew neck
  "1618077360395-f3068be8e001", // Man with glasses denim jacket
  "1583195763986-0231686dcd43", // Man in black hoodie
  "1651684215020-f7a5b6610f23", // Man smiling for camera (replaced: was incorrectly female)
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
  "1557862921-37829c790f19", // Man in t-shirt
  "1542909168-82c3e7fdca5c", // Man professional
  "1492562080023-ab3db95bfbce", // Professional headshot
];

// FEMALE PORTRAITS - Verified working IDs from Unsplash search
const FEMALE_PORTRAIT_IDS = [
  "1494790108377-be9c29b29330", // Woman smiling yellow
  "1438761681033-6461ffad8d80", // Professional woman
  "1517841905240-472988babdf9", // Woman casual portrait
  "1531746020798-e6953c6e8e04", // Woman portrait casual
  "1573496359142-b8d87734a5a2", // Professional woman
  "1580489944761-15a19d654956", // Woman casual
  "1508214751196-bcfd4ca60f91", // Woman portrait
  "1544005313-94ddf0286df2", // Woman looking up
  "1487412720507-e7ab37603c6f", // Casual female portrait
  "1529626455594-4ff0802cfb7e", // Woman smiling
  "1542596768-5d1d21f1cf98", // Young woman portrait
  "1489424731084-a5d8b219a5bb", // Woman portrait clean
  "1534528741775-53994a69daeb", // Woman close up
  "1524504388940-b1c1722653e1", // Woman looking
  "1499887142886-791eca5918cd", // Woman outdoor
  "1509967419530-da38b4704bc6", // Professional headshot
  "1499155286265-79a9dc9c6380", // Woman outdoor casual
  "1569124589354-615739ae007b", // Smiling woman
  "1590086782957-93c06ef21604", // Woman portrait
  "1595152772835-219674b2a8a6", // Woman smiling
  "1531123897727-8f129e1688ce", // Young professional woman
];

// Additional photos for gallery variety (lifestyle shots - less strict on face)
// Note: Some original IDs were removed due to 404 errors
const MALE_LIFESTYLE_IDS = [
  "1552374196-c4e7ffc6e126", // Man hiking outdoors
  "1571019613454-1cb2f99b2d8b", // Man outdoors nature
  "1517836357463-d25dfeac3438", // Man fitness
  "1518609878373-06d740f60d8b", // Man coffee shop
  "1507679799987-c73779587ccf", // Man in suit full body
  "1519058082700-08a0b56da9b4", // Man casual lifestyle
  "1516914943479-89db7d9ae7f2", // Man casual activity
  "1488161628813-04466f0bd926", // Man outdoor adventure
  "1496345875659-11f7dd282d1d", // Man reading
  "1525134479668-1bee5c7c6845", // Man nature
  "1528892952291-009c663ce843", // Man casual
  "1556157382-97eda2d62296", // Man casual outdoors (replacement for broken ID)
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
  "1475503572774-15a45e5d60b9", // Woman adventure
  "1483721310020-03333e577078", // Woman traveling
  "1544005313-94ddf0286df2", // Woman lifestyle (replacement for broken ID)
  "1529626455594-4ff0802cfb7e", // Woman smiling outdoor (replacement for broken ID)
];

const INTERESTS = [
  "dining_out", "sports", "museums_art", "music", "gardening", "basketball",
  "dancing", "travel", "movies", "reading", "fitness", "cooking", "photography",
  "gaming", "hiking", "yoga", "wine", "coffee", "dogs", "cats", "fashion",
  "technology", "nature", "beach", "mountains", "running", "cycling",
  "concerts", "theater", "volunteering",
];

const LANGUAGES = ["english", "spanish", "french", "german", "italian", "portuguese", "chinese", "japanese", "korean"];

const OCCUPATIONS = [
  "Software Engineer", "Marketing Manager", "Nurse", "Teacher", "Financial Analyst",
  "Graphic Designer", "Sales Representative", "Project Manager", "Accountant",
  "Real Estate Agent", "Lawyer", "Doctor", "Dentist", "Architect", "Consultant",
  "Entrepreneur", "Chef", "Photographer", "Writer", "Physical Therapist",
  "Data Scientist", "Product Manager", "HR Manager", "Operations Manager",
  "UX Designer", "Pharmacist", "Veterinarian", "Personal Trainer", "Artist",
];

const COMPANIES = [
  "Google", "Amazon", "Microsoft", "Apple", "Meta", "Tesla", "Netflix",
  "Salesforce", "Adobe", "Oracle", "IBM", "Cisco", "Intel", "NVIDIA",
  "JPMorgan Chase", "Goldman Sachs", "Morgan Stanley", "Bank of America",
  "Deloitte", "McKinsey", "Accenture", "PwC", "EY", "KPMG",
  "Mayo Clinic", "Kaiser Permanente", "UCLA Health", "Self-employed",
  "Freelance", "Startup Founder",
];

const SCHOOLS = [
  "Harvard University", "Stanford University", "MIT", "Yale University",
  "UCLA", "UC Berkeley", "Columbia University", "NYU", "University of Michigan",
  "University of Texas", "USC", "Northwestern University", "Duke University",
  "University of Florida", "Ohio State University", "Penn State",
  "University of Washington", "Arizona State University", "Boston University",
  "Georgia Tech", "University of Chicago", "Carnegie Mellon", "Vanderbilt",
];

// Bio templates
const BIO_TEMPLATES = [
  "Love to travel and explore new places. Always up for an adventure! Currently working in {occupation} and enjoying life in {city}.",
  "Passionate about {interest1} and {interest2}. Looking for someone who shares my love for good conversations and great food.",
  "{occupation} by day, {interest1} enthusiast by night. I believe life is too short for boring dates.",
  "Just moved to {city} and looking to meet new people. I enjoy {interest1}, {interest2}, and trying new restaurants.",
  "Ambitious, kind, and always looking to grow. I value honesty and humor. When I'm not working, you'll find me {interest1}.",
  "Dog dad/mom who loves {interest1} and weekend getaways. Looking for a genuine connection with someone who appreciates the little things.",
  "Coffee addict, book lover, and {interest1} enthusiast. I'm looking for someone who can make me laugh and isn't afraid to be themselves.",
  "Living my best life in {city}! I'm into {interest1}, {interest2}, and making memories. Let's see where this goes!",
  "Work hard, play harder. {occupation} with a passion for {interest1}. Looking for my partner in crime.",
  "Simple person with big dreams. I love {interest1}, good music, and meaningful conversations. Quality time > everything.",
];

const IDEAL_FIRST_DATE_TEMPLATES = [
  "Starts with coffee at a cozy cafe and ends with a walk in the park.",
  "Dinner at a nice restaurant followed by live music or a comedy show.",
  "A hiking adventure followed by a picnic with a stunning view.",
  "Cooking together at home with wine and good conversation.",
  "Exploring a new neighborhood, trying street food, and finding hidden gems.",
  "Museum visit during the day, rooftop drinks at sunset.",
  "Beach day with a bonfire at night.",
  "Wine tasting followed by a scenic drive.",
];

const NON_NEGOTIABLES_TEMPLATES = [
  "Honesty, sense of humor, ambition, kindness, good communication.",
  "Loyalty, respect, emotional intelligence, similar values, chemistry.",
  "Trust, independence, shared life goals, physical attraction, intellectual connection.",
  "Authenticity, consistency, family values, healthy lifestyle, growth mindset.",
  "Mutual respect, adventure spirit, work-life balance, emotional availability, shared interests.",
];

const WAY_TO_HEART_TEMPLATES = [
  "Good food, genuine compliments, and thoughtful gestures.",
  "Deep conversations, spontaneous adventures, and lots of laughter.",
  "Quality time, acts of service, and remembering the little things.",
  "Home-cooked meals, surprise dates, and intellectual discussions.",
  "Consistency, emotional support, and shared experiences.",
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startYear: number, endYear: number): string {
  const year = randomInt(startYear, endYear);
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function addLocationJitter(lat: number, lng: number): { lat: number; lng: number } {
  // Add random offset within ~10 miles (0.15 degrees)
  const jitter = 0.15;
  return {
    lat: lat + (Math.random() - 0.5) * jitter * 2,
    lng: lng + (Math.random() - 0.5) * jitter * 2,
  };
}

// Height ranges by gender (in inches)
function randomHeight(gender: "male" | "female"): number {
  if (gender === "male") {
    return randomInt(66, 78); // 5'6" to 6'6"
  }
  return randomInt(60, 72); // 5'0" to 6'0"
}

// Get gallery image specifications for a user (primary + additional portraits + lifestyle)
// Returns photo IDs and dimensions, not URLs - images will be downloaded and uploaded to storage
interface GalleryImageSpec {
  photoId: string;
  width: number;
  height: number;
  isPrimary: boolean;
  order: number;
}

function getGalleryImageSpecs(gender: "male" | "female", index: number): GalleryImageSpec[] {
  // Explicitly select arrays based on gender
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
    { photoId: primaryId, width: 800, height: 800, isPrimary: true, order: 0 },
    { photoId: portraitIds[portrait2Idx], width: 800, height: 800, isPrimary: false, order: 1 },
    { photoId: portraitIds[portrait3Idx], width: 800, height: 800, isPrimary: false, order: 2 },
    { photoId: lifestyleIds[lifestyle1Idx], width: 1200, height: 800, isPrimary: false, order: 3 },
    { photoId: lifestyleIds[lifestyle2Idx], width: 1200, height: 800, isPrimary: false, order: 4 },
  ];
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const domain = "testuser.realsingles.com";
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${domain}`;
}

function generateBio(occupation: string, city: string, interests: string[]): string {
  const template = randomElement(BIO_TEMPLATES);
  return template
    .replace("{occupation}", occupation)
    .replace("{city}", city)
    .replace("{interest1}", interests[0] || "fitness")
    .replace("{interest2}", interests[1] || "travel");
}

// ============================================
// USER GENERATION
// ============================================

interface TestUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  dateOfBirth: string;
  location: typeof US_LOCATIONS[0];
  profileImageIndex: number;
}

function generateTestUser(gender: "male" | "female", index: number): TestUserData {
  const firstNames = gender === "male" ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;
  const firstName = randomElement(firstNames);
  const lastName = randomElement(LAST_NAMES);
  
  // Age range: 25-55 years old
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - randomInt(25, 55);
  const dateOfBirth = randomDate(birthYear, birthYear);
  
  return {
    email: generateEmail(firstName, lastName, index),
    password: "TestPassword123!", // All test users have the same password
    firstName,
    lastName,
    gender,
    dateOfBirth,
    location: randomElement(US_LOCATIONS),
    profileImageIndex: index,
  };
}

async function createTestUser(userData: TestUserData, userNumber: number, totalUsers: number): Promise<string | null> {
  const progress = `[${userNumber}/${totalUsers}]`;
  
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        display_name: `${userData.firstName} ${userData.lastName}`,
      },
    });

    if (authError) {
      console.error(`${progress} Error creating auth user ${userData.email}:`, authError.message);
      return null;
    }

    const userId = authData.user.id;
    console.log(`${progress} Created auth user: ${userData.email}`);

    // 2. Download and upload gallery images to Supabase Storage
    const imageSpecs = getGalleryImageSpecs(userData.gender, userData.profileImageIndex);
    const galleryEntries: { user_id: string; media_type: string; media_url: string; is_primary: boolean; display_order: number }[] = [];
    let primaryImagePath: string | null = null;
    
    console.log(`${progress}   Uploading ${imageSpecs.length} images to storage...`);
    
    for (let i = 0; i < imageSpecs.length; i++) {
      const spec = imageSpecs[i];
      const storagePath = await downloadAndUploadImage(
        supabase,
        userId,
        spec.photoId,
        i,
        spec.width,
        spec.height
      );
      
      if (storagePath) {
        galleryEntries.push({
          user_id: userId,
          media_type: "image",
          media_url: storagePath, // Storage path, NOT full URL
          is_primary: spec.isPrimary,
          display_order: spec.order,
        });
        
        if (spec.isPrimary) {
          primaryImagePath = storagePath;
        }
        
        console.log(`${progress}   ✓ Image ${i + 1}/${imageSpecs.length} uploaded`);
      } else {
        console.log(`${progress}   ✗ Image ${i + 1}/${imageSpecs.length} failed`);
      }
      
      // Small delay between uploads
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // 3. Create profile with storage path for profile_image_url
    const lookingFor = userData.gender === "male" ? ["female"] : ["male"];
    const { lat, lng } = addLocationJitter(userData.location.lat, userData.location.lng);
    const occupation = randomElement(OCCUPATIONS);
    const selectedInterests = randomElements(INTERESTS, 3, 8);

    const profileData = {
      user_id: userId,
      first_name: userData.firstName,
      last_name: userData.lastName,
      date_of_birth: userData.dateOfBirth,
      gender: userData.gender,
      looking_for: lookingFor,
      height_inches: randomHeight(userData.gender),
      body_type: randomElement(BODY_TYPES),
      ethnicity: randomElements(ETHNICITIES, 1, 2),
      city: userData.location.city,
      state: userData.location.state,
      country: "US",
      latitude: lat,
      longitude: lng,
      marital_status: randomElement(MARITAL_STATUSES),
      religion: randomElement(RELIGIONS),
      political_views: randomElement(POLITICAL_VIEWS),
      education: randomElement(EDUCATION_LEVELS),
      occupation,
      company: Math.random() > 0.3 ? randomElement(COMPANIES) : null,
      schools: randomElements(SCHOOLS, 1, 2),
      languages: ["english", ...randomElements(LANGUAGES.slice(1), 0, 2)],
      smoking: randomElement(SMOKING_OPTIONS),
      drinking: randomElement(DRINKING_OPTIONS),
      marijuana: randomElement(MARIJUANA_OPTIONS),
      exercise: randomElement(EXERCISE_OPTIONS),
      has_kids: randomElement(HAS_KIDS_OPTIONS),
      wants_kids: randomElement(WANTS_KIDS_OPTIONS),
      pets: randomElements(PETS_OPTIONS, 1, 2),
      zodiac_sign: randomElement(ZODIAC_SIGNS),
      interests: selectedInterests,
      bio: generateBio(occupation, userData.location.city, selectedInterests),
      looking_for_description: "Looking for someone genuine who values connection and isn't afraid to be themselves.",
      
      // Profile prompts
      ideal_first_date: randomElement(IDEAL_FIRST_DATE_TEMPLATES),
      non_negotiables: randomElement(NON_NEGOTIABLES_TEMPLATES),
      way_to_heart: randomElement(WAY_TO_HEART_TEMPLATES),
      
      // Verification
      is_verified: Math.random() > 0.3, // 70% verified
      is_photo_verified: Math.random() > 0.5, // 50% photo verified
      
      // Profile completion
      profile_completion_step: 10,
      profile_completed_at: new Date().toISOString(),
      
      // Profile image - use storage path (NOT full URL)
      profile_image_url: primaryImagePath,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profileData);

    if (profileError) {
      console.error(`${progress}   Error creating profile:`, profileError.message);
    } else {
      console.log(`${progress}   ✓ Profile created`);
    }

    // 4. Create user_filters with varied preferences
    const ageRange = {
      min: Math.max(18, randomInt(22, 35)),
      max: randomInt(40, 60),
    };
    
    const filterData = {
      user_id: userId,
      min_age: ageRange.min,
      max_age: ageRange.max,
      max_distance_miles: randomElement([25, 50, 100, 150, 200]),
      min_height: Math.random() > 0.5 ? randomInt(60, 66) : null,
      max_height: Math.random() > 0.5 ? randomInt(72, 84) : null,
      gender: lookingFor,
      body_types: Math.random() > 0.6 ? randomElements(BODY_TYPES, 2, 4) : null,
      ethnicities: Math.random() > 0.7 ? randomElements(ETHNICITIES, 2, 4) : null,
      religions: Math.random() > 0.7 ? randomElements(RELIGIONS, 2, 4) : null,
      education_levels: Math.random() > 0.6 ? randomElements(EDUCATION_LEVELS, 2, 4) : null,
      has_kids: randomElement(["any", "yes", "no"]),
      wants_kids: randomElement(["any", "yes", "no", "maybe"]),
      smoking: Math.random() > 0.5 ? randomElement(["any", "never", "occasionally"]) : "any",
    };

    const { error: filterError } = await supabase
      .from("user_filters")
      .upsert(filterData);

    if (filterError) {
      console.error(`${progress}   Error creating filters:`, filterError.message);
    } else {
      console.log(`${progress}   ✓ Filters created`);
    }

    // 5. Insert gallery entries (with storage paths)
    if (galleryEntries.length > 0) {
      const { error: galleryError } = await supabase
        .from("user_gallery")
        .insert(galleryEntries);

      if (galleryError) {
        console.error(`${progress}   Error creating gallery:`, galleryError.message);
      } else {
        console.log(`${progress}   ✓ Gallery created with ${galleryEntries.length} images`);
      }
    } else {
      console.log(`${progress}   ⚠ No gallery images uploaded`);
    }

    return userId;
  } catch (error) {
    console.error(`${progress} Unexpected error creating user ${userData.email}:`, error);
    return null;
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log("🌱 Starting test user seed script...\n");
  console.log("Note: This script downloads images from Unsplash and uploads to Supabase Storage.");
  console.log("Expected runtime: 5-10 minutes for 48 users.\n");
  
  const totalUsers = 48; // 24 male, 24 female
  const usersPerGender = totalUsers / 2;
  
  const createdUsers: string[] = [];
  let userNumber = 0;
  
  console.log(`Creating ${totalUsers} test users (${usersPerGender} male, ${usersPerGender} female)...\n`);
  
  const startTime = Date.now();
  
  // Create male users
  console.log("👨 Creating male users...\n");
  for (let i = 0; i < usersPerGender; i++) {
    userNumber++;
    const userData = generateTestUser("male", i);
    const userId = await createTestUser(userData, userNumber, totalUsers);
    if (userId) {
      createdUsers.push(userId);
    }
    console.log(""); // Empty line between users
  }
  
  // Create female users
  console.log("👩 Creating female users...\n");
  for (let i = 0; i < usersPerGender; i++) {
    userNumber++;
    const userData = generateTestUser("female", i);
    const userId = await createTestUser(userData, userNumber, totalUsers);
    if (userId) {
      createdUsers.push(userId);
    }
    console.log(""); // Empty line between users
  }
  
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  console.log("=".repeat(50));
  console.log(`✅ Seed complete!`);
  console.log(`   Total users created: ${createdUsers.length}/${totalUsers}`);
  console.log(`   Images uploaded: ${createdUsers.length * 5} to Supabase Storage`);
  console.log(`   Time elapsed: ${minutes}m ${seconds}s`);
  console.log(`   Test user password: TestPassword123!`);
  console.log(`   Email format: firstname.lastnameN@testuser.realsingles.com`);
  console.log("=".repeat(50));
}

main().catch(console.error);
