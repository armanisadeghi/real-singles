import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedEvents() {
  console.log("🌱 Seeding events and speed dating sessions...\n");

  // Speed Dating Sessions
  const speedDatingSessions = [
    {
      title: "Friday Night Connections",
      description: "Meet 10 new people in quick 3-minute rounds! Join us for an exciting evening of speed dating where you'll have the chance to connect with like-minded singles.",
      scheduled_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 45,
      round_duration_seconds: 180,
      min_participants: 10,
      max_participants: 20,
      gender_preference: "mixed",
      age_min: 25,
      age_max: 40,
      status: "scheduled",
    },
    {
      title: "Weekend Mingle",
      description: "Casual speed dating for the weekend crowd. Perfect for those who want a relaxed atmosphere to meet new people.",
      scheduled_datetime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 30,
      round_duration_seconds: 180,
      min_participants: 8,
      max_participants: 16,
      gender_preference: "mixed",
      age_min: 30,
      age_max: 50,
      status: "scheduled",
    },
    {
      title: "Young Professionals Night",
      description: "Speed dating for career-focused singles. Connect with ambitious individuals who share your drive for success.",
      scheduled_datetime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 45,
      round_duration_seconds: 180,
      min_participants: 10,
      max_participants: 20,
      gender_preference: "mixed",
      age_min: 22,
      age_max: 35,
      status: "scheduled",
    },
    {
      title: "Valentine Special",
      description: "Find your special someone this Valentine's season! Extended rounds for deeper conversations.",
      scheduled_datetime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 60,
      round_duration_seconds: 240,
      min_participants: 12,
      max_participants: 24,
      gender_preference: "mixed",
      age_min: 25,
      age_max: 45,
      status: "scheduled",
    },
    {
      title: "Over 40s Mixer",
      description: "Mature singles looking for meaningful connections. A relaxed pace for quality conversations.",
      scheduled_datetime: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 45,
      round_duration_seconds: 180,
      min_participants: 8,
      max_participants: 16,
      gender_preference: "mixed",
      age_min: 40,
      age_max: 60,
      status: "scheduled",
    },
  ];

  // Events
  const events = [
    {
      title: "Singles Mixer at The Rooftop",
      description: "Join us for an evening of mingling, drinks, and great conversations at the city's hottest rooftop bar.",
      event_type: "in_person",
      start_datetime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      max_attendees: 50,
      city: "New York",
      state: "NY",
      venue_name: "The Rooftop Bar",
      address: "123 Main Street",
      is_public: true,
      status: "upcoming",
    },
    {
      title: "Virtual Wine Tasting",
      description: "A fun online event where you can taste wines from around the world while meeting new people.",
      event_type: "virtual",
      start_datetime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      max_attendees: 30,
      city: null,
      state: null,
      venue_name: "Online Event",
      address: null,
      is_public: true,
      status: "upcoming",
    },
    {
      title: "Hiking & Coffee",
      description: "Start your weekend with a group hike followed by coffee and conversation. All fitness levels welcome!",
      event_type: "in_person",
      start_datetime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      max_attendees: 20,
      city: "Los Angeles",
      state: "CA",
      venue_name: "Griffith Park",
      address: "Griffith Park Drive",
      is_public: true,
      status: "upcoming",
    },
    {
      title: "Game Night for Singles",
      description: "Board games, video games, and plenty of opportunities to connect. Pizza provided!",
      event_type: "in_person",
      start_datetime: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      max_attendees: 40,
      city: "Chicago",
      state: "IL",
      venue_name: "The Game Room",
      address: "456 Oak Avenue",
      is_public: true,
      status: "upcoming",
    },
  ];

  // Check existing speed dating sessions
  const { count: existingSdCount } = await supabase
    .from("virtual_speed_dating")
    .select("*", { count: "exact", head: true })
    .eq("status", "scheduled");

  if (existingSdCount && existingSdCount > 0) {
    console.log(`ℹ️  Found ${existingSdCount} existing scheduled speed dating sessions`);
  }

  // Insert speed dating sessions
  console.log("Adding speed dating sessions...");
  const { data: sdData, error: sdError } = await supabase
    .from("virtual_speed_dating")
    .insert(speedDatingSessions)
    .select();

  if (sdError) {
    console.error("Error inserting speed dating sessions:", sdError.message);
  } else {
    console.log(`✅ Added ${sdData?.length || 0} speed dating sessions`);
  }

  // Check existing events
  const { count: existingEvCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("status", "upcoming");

  if (existingEvCount && existingEvCount > 0) {
    console.log(`ℹ️  Found ${existingEvCount} existing upcoming events`);
  }

  // Insert events
  console.log("Adding events...");
  const { data: evData, error: evError } = await supabase
    .from("events")
    .insert(events)
    .select();

  if (evError) {
    console.error("Error inserting events:", evError.message);
  } else {
    console.log(`✅ Added ${evData?.length || 0} events`);
  }

  // Show summary
  const { count: sdCount } = await supabase
    .from("virtual_speed_dating")
    .select("*", { count: "exact", head: true })
    .eq("status", "scheduled");

  const { count: evCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("status", "upcoming");

  console.log("\n📊 Summary:");
  console.log(`   Speed Dating Sessions (scheduled): ${sdCount}`);
  console.log(`   Events (upcoming): ${evCount}`);
  console.log("\n✨ Done!");
}

seedEvents().catch(console.error);
