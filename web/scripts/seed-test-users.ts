/**
 * Seed Test Users Script
 * 
 * Creates diverse test users for testing the matching algorithm, search, and filters.
 * 
 * Usage:
 *   pnpm tsx scripts/seed-test-users.ts
 * 
 * Prerequisites:
 *   - Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - Install tsx: pnpm add -D tsx
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
const RELIGIONS = ["christian", "catholic", "jewish", "muslim", "buddhist", "hindu", "agnostic", "atheist", "spiritual"];
const POLITICAL_VIEWS = ["conservative", "liberal", "moderate", "libertarian", "no_answer"];
const EDUCATION_LEVELS = ["high_school", "some_college", "associate", "bachelor", "graduate", "phd"];
const MARITAL_STATUSES = ["never_married", "divorced", "separated", "widowed"];
const SMOKING_OPTIONS = ["no", "occasionally", "daily", "trying_to_quit"];
const DRINKING_OPTIONS = ["never", "social", "moderate", "regular"];
const MARIJUANA_OPTIONS = ["no", "occasionally", "yes"];
const EXERCISE_OPTIONS = ["never", "sometimes", "regularly", "daily"];
const HAS_KIDS_OPTIONS = ["no", "yes_live_at_home", "yes_live_away"];
const WANTS_KIDS_OPTIONS = ["no", "definitely", "someday", "ok_if_partner_has"];
const PETS_OPTIONS = ["none", "dog", "cat", "other"];
const ZODIAC_SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];

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

// Profile image URL from randomuser.me
function getProfileImageUrl(gender: "male" | "female", index: number): string {
  const genderPath = gender === "male" ? "men" : "women";
  // randomuser.me has portraits numbered 0-99
  const imageNum = index % 100;
  return `https://randomuser.me/api/portraits/${genderPath}/${imageNum}.jpg`;
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

async function createTestUser(userData: TestUserData): Promise<string | null> {
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
      console.error(`Error creating auth user ${userData.email}:`, authError.message);
      return null;
    }

    const userId = authData.user.id;
    console.log(`Created auth user: ${userData.email} (${userId})`);

    // 2. Create profile
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
      
      // Profile image
      profile_image_url: getProfileImageUrl(userData.gender, userData.profileImageIndex),
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profileData);

    if (profileError) {
      console.error(`Error creating profile for ${userData.email}:`, profileError.message);
    } else {
      console.log(`  ✓ Profile created for ${userData.firstName} ${userData.lastName}`);
    }

    // 3. Create user_filters with varied preferences
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
      console.error(`Error creating filters for ${userData.email}:`, filterError.message);
    } else {
      console.log(`  ✓ Filters created`);
    }

    // 4. Create gallery entry for profile image
    const { error: galleryError } = await supabase
      .from("user_gallery")
      .insert({
        user_id: userId,
        media_type: "image",
        media_url: getProfileImageUrl(userData.gender, userData.profileImageIndex),
        is_primary: true,
        display_order: 0,
      });

    if (galleryError) {
      console.error(`Error creating gallery for ${userData.email}:`, galleryError.message);
    } else {
      console.log(`  ✓ Gallery created`);
    }

    return userId;
  } catch (error) {
    console.error(`Unexpected error creating user ${userData.email}:`, error);
    return null;
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log("🌱 Starting test user seed script...\n");
  
  const totalUsers = 48; // 24 male, 24 female
  const usersPerGender = totalUsers / 2;
  
  const createdUsers: string[] = [];
  
  console.log(`Creating ${totalUsers} test users (${usersPerGender} male, ${usersPerGender} female)...\n`);
  
  // Create male users
  console.log("👨 Creating male users...\n");
  for (let i = 0; i < usersPerGender; i++) {
    const userData = generateTestUser("male", i);
    const userId = await createTestUser(userData);
    if (userId) {
      createdUsers.push(userId);
    }
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  
  // Create female users
  console.log("\n👩 Creating female users...\n");
  for (let i = 0; i < usersPerGender; i++) {
    const userData = generateTestUser("female", i);
    const userId = await createTestUser(userData);
    if (userId) {
      createdUsers.push(userId);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Seed complete!`);
  console.log(`   Total users created: ${createdUsers.length}/${totalUsers}`);
  console.log(`   Test user password: TestPassword123!`);
  console.log(`   Email format: firstname.lastnameN@testuser.realsingles.com`);
  console.log("=".repeat(50));
}

main().catch(console.error);
