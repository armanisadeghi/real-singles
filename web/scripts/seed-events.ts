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

  // Speed Dating Sessions with images
  const speedDatingSessions = [
    {
      title: "Friday Night Connections",
      description: "Meet 10 new people in quick 3-minute rounds! Join us for an exciting evening of speed dating where you'll have the chance to connect with like-minded singles.",
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop", // People at party
      scheduled_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 45,
      round_duration_seconds: 180,
      min_participants: 10,
      max_participants: 20,
      gender_preference: "mixed",
      age_min: 25,
      age_max: 40,
      status: "scheduled",
      agora_channel_prefix: `speed-dating-friday-${Date.now()}`,
    },
    {
      title: "Weekend Mingle",
      description: "Casual speed dating for the weekend crowd. Perfect for those who want a relaxed atmosphere to meet new people.",
      image_url: "https://images.unsplash.com/photo-1529543544277-750e0632e992?w=800&h=600&fit=crop", // Cocktails
      scheduled_datetime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 30,
      round_duration_seconds: 180,
      min_participants: 8,
      max_participants: 16,
      gender_preference: "mixed",
      age_min: 30,
      age_max: 50,
      status: "scheduled",
      agora_channel_prefix: `speed-dating-weekend-${Date.now()}`,
    },
    {
      title: "Young Professionals Night",
      description: "Speed dating for career-focused singles. Connect with ambitious individuals who share your drive for success.",
      image_url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=600&fit=crop", // Professional networking
      scheduled_datetime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 45,
      round_duration_seconds: 180,
      min_participants: 10,
      max_participants: 20,
      gender_preference: "mixed",
      age_min: 22,
      age_max: 35,
      status: "scheduled",
      agora_channel_prefix: `speed-dating-yp-${Date.now()}`,
    },
    {
      title: "Valentine Special",
      description: "Find your special someone this Valentine's season! Extended rounds for deeper conversations.",
      image_url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&h=600&fit=crop", // Hearts/romantic
      scheduled_datetime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 60,
      round_duration_seconds: 240,
      min_participants: 12,
      max_participants: 24,
      gender_preference: "mixed",
      age_min: 25,
      age_max: 45,
      status: "scheduled",
      agora_channel_prefix: `speed-dating-valentine-${Date.now()}`,
    },
    {
      title: "Over 40s Mixer",
      description: "Mature singles looking for meaningful connections. A relaxed pace for quality conversations.",
      image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop", // Elegant dinner setting
      scheduled_datetime: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 45,
      round_duration_seconds: 180,
      min_participants: 8,
      max_participants: 16,
      gender_preference: "mixed",
      age_min: 40,
      age_max: 60,
      status: "scheduled",
      agora_channel_prefix: `speed-dating-40s-${Date.now()}`,
    },
  ];

  // Events with images and complete data
  const events = [
    {
      title: "Singles Mixer at The Rooftop",
      description: "Join us for an evening of mingling, drinks, and great conversations at the city's hottest rooftop bar.",
      image_url: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=600&fit=crop", // Rooftop bar
      event_type: "in_person",
      start_datetime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      max_attendees: 50,
      current_attendees: 0,
      city: "New York",
      state: "NY",
      venue_name: "The Rooftop Bar",
      address: "123 Main Street",
      latitude: 40.7128,
      longitude: -74.0060,
      timezone: "America/New_York",
      is_public: true,
      requires_approval: false,
      status: "upcoming",
    },
    {
      title: "Virtual Wine Tasting",
      description: "A fun online event where you can taste wines from around the world while meeting new people. Wine kit included with registration!",
      image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop", // Wine glasses
      event_type: "virtual",
      start_datetime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      max_attendees: 30,
      current_attendees: 0,
      city: null,
      state: null,
      venue_name: "Online via Zoom",
      address: null,
      latitude: null,
      longitude: null,
      timezone: "America/New_York",
      is_public: true,
      requires_approval: false,
      status: "upcoming",
    },
    {
      title: "Hiking & Coffee",
      description: "Start your weekend with a group hike followed by coffee and conversation. All fitness levels welcome! We'll meet at the trailhead at 9am.",
      image_url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop", // Hiking
      event_type: "in_person",
      start_datetime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      max_attendees: 20,
      current_attendees: 0,
      city: "Los Angeles",
      state: "CA",
      venue_name: "Griffith Park",
      address: "4730 Crystal Springs Dr",
      latitude: 34.1341,
      longitude: -118.2943,
      timezone: "America/Los_Angeles",
      is_public: true,
      requires_approval: false,
      status: "upcoming",
    },
    {
      title: "Game Night for Singles",
      description: "Board games, video games, and plenty of opportunities to connect. Pizza and drinks provided! Whether you're a casual player or a strategy expert, there's something for everyone.",
      image_url: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&h=600&fit=crop", // Board games
      event_type: "in_person",
      start_datetime: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      max_attendees: 40,
      current_attendees: 0,
      city: "Chicago",
      state: "IL",
      venue_name: "The Game Room",
      address: "456 Oak Avenue",
      latitude: 41.8781,
      longitude: -87.6298,
      timezone: "America/Chicago",
      is_public: true,
      requires_approval: false,
      status: "upcoming",
    },
    {
      title: "Cooking Class: Italian Date Night",
      description: "Learn to make authentic Italian pasta from scratch while meeting fellow food lovers. Couples and singles welcome!",
      image_url: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop", // Cooking
      event_type: "in_person",
      start_datetime: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      max_attendees: 16,
      current_attendees: 0,
      city: "San Francisco",
      state: "CA",
      venue_name: "Sur La Table",
      address: "77 Maiden Lane",
      latitude: 37.7879,
      longitude: -122.4074,
      timezone: "America/Los_Angeles",
      is_public: true,
      requires_approval: false,
      status: "upcoming",
    },
    {
      title: "Sunset Beach Bonfire",
      description: "Watch the sunset and enjoy a cozy bonfire on the beach. S'mores, music, and great company included!",
      image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop", // Beach sunset
      event_type: "in_person",
      start_datetime: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      max_attendees: 30,
      current_attendees: 0,
      city: "Santa Monica",
      state: "CA",
      venue_name: "Santa Monica Beach",
      address: "Ocean Ave & Colorado Ave",
      latitude: 34.0094,
      longitude: -118.4974,
      timezone: "America/Los_Angeles",
      is_public: true,
      requires_approval: false,
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
