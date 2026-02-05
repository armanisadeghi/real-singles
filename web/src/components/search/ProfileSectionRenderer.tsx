"use client";

/**
 * ProfileSectionRenderer Component (Web)
 * 
 * Smart component that renders profile sections, hiding empty/prefer-not-to-say fields.
 */

import {
  MapPin,
  Briefcase,
  Ruler,
  User,
  Sparkles,
  GraduationCap,
  Heart,
  Globe,
  Users,
  Baby,
  PawPrint,
  Cigarette,
  Wine,
  Leaf,
  CheckCircle,
} from "lucide-react";
import { cn, calculateAge, formatHeight } from "@/lib/utils";

// Values to hide
const HIDDEN_VALUES = [
  null,
  undefined,
  "",
  "prefer_not_to_say",
  "Prefer not to say",
  "prefer not to say",
];

// Helper to check if a value should be displayed
const shouldDisplay = (value: any): boolean => {
  if (HIDDEN_VALUES.includes(value)) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
};

// Helper to capitalize first letter
const capitalize = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Helper to format option values
const formatOptionValue = (value: string | undefined): string | null => {
  if (!value || HIDDEN_VALUES.includes(value)) return null;
  return value
    .split("_")
    .map((word) => capitalize(word))
    .join(" ");
};

// Prompt questions mapping
const PROMPT_LABELS: Record<string, string> = {
  ideal_first_date: "My ideal first date",
  non_negotiables: "My non-negotiables in a partner",
  way_to_heart: "The way to my heart",
  craziest_travel_story: "My craziest travel story",
  worst_job: "Worst job I ever had",
  dream_job: "My dream job would be",
  after_work: "After work you can find me",
  weirdest_gift: "Weirdest gift I've received",
  pet_peeves: "My pet peeves",
  nightclub_or_home: "Friday night: out or staying in?",
  past_event: "If I could attend any event in history",
};

interface Profile {
  id?: string;
  user_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  occupation?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
  is_verified?: boolean | null;
  height_inches?: number | null;
  body_type?: string | null;
  zodiac_sign?: string | null;
  interests?: string[] | null;
  education?: string | null;
  religion?: string | null;
  ethnicity?: string[] | null;
  languages?: string[] | null;
  has_kids?: string | null;
  wants_kids?: string | null;
  pets?: string[] | null;
  smoking?: string | null;
  drinking?: string | null;
  marijuana?: string | null;
  distance_km?: number | null;
  // Prompts
  ideal_first_date?: string | null;
  non_negotiables?: string | null;
  way_to_heart?: string | null;
  craziest_travel_story?: string | null;
  worst_job?: string | null;
  dream_job?: string | null;
  after_work?: string | null;
  weirdest_gift?: string | null;
  pet_peeves?: string | null;
  nightclub_or_home?: string | null;
  past_event?: string | null;
  user?: {
    display_name?: string | null;
  } | null;
}

interface ProfileSectionRendererProps {
  profile: Profile;
  className?: string;
  /** When true, excludes the basic info (name, location, occupation) and about section */
  excludeBasicsAndAbout?: boolean;
}

export function ProfileSectionRenderer({
  profile,
  className,
  excludeBasicsAndAbout = false,
}: ProfileSectionRendererProps) {
  const name = profile.user?.display_name || profile.first_name || "Anonymous";
  const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const height = profile.height_inches ? formatHeight(profile.height_inches) : null;

  // Collect prompts with values
  const prompts: Array<{ label: string; value: string }> = [];
  Object.entries(PROMPT_LABELS).forEach(([key, label]) => {
    const value = (profile as any)?.[key];
    if (shouldDisplay(value)) {
      prompts.push({ label, value });
    }
  });

  // Build detail items
  const lifestyleItems: Array<{ icon: React.ReactNode; label: string; value: string }> = [];
  
  if (height) {
    lifestyleItems.push({ icon: <Ruler className="w-4 h-4" />, label: "Height", value: height });
  }
  if (shouldDisplay(profile.body_type)) {
    lifestyleItems.push({ icon: <User className="w-4 h-4" />, label: "Body Type", value: formatOptionValue(profile.body_type!) || "" });
  }
  if (shouldDisplay(profile.zodiac_sign)) {
    lifestyleItems.push({ icon: <Sparkles className="w-4 h-4" />, label: "Zodiac", value: capitalize(profile.zodiac_sign!) });
  }

  const backgroundItems: Array<{ icon: React.ReactNode; label: string; value: string }> = [];
  
  if (shouldDisplay(profile.education)) {
    backgroundItems.push({ icon: <GraduationCap className="w-4 h-4" />, label: "Education", value: formatOptionValue(profile.education!) || "" });
  }
  if (shouldDisplay(profile.occupation)) {
    backgroundItems.push({ icon: <Briefcase className="w-4 h-4" />, label: "Work", value: profile.occupation! });
  }
  if (shouldDisplay(profile.religion)) {
    backgroundItems.push({ icon: <Heart className="w-4 h-4" />, label: "Religion", value: capitalize(profile.religion!) });
  }
  if (shouldDisplay(profile.ethnicity)) {
    const ethnicity = Array.isArray(profile.ethnicity)
      ? profile.ethnicity.map((e) => capitalize(e)).join(", ")
      : "";
    if (ethnicity) {
      backgroundItems.push({ icon: <Globe className="w-4 h-4" />, label: "Ethnicity", value: ethnicity });
    }
  }

  const familyItems: Array<{ icon: React.ReactNode; label: string; value: string }> = [];
  
  if (shouldDisplay(profile.has_kids) && profile.has_kids !== "no") {
    familyItems.push({ icon: <Users className="w-4 h-4" />, label: "Has Kids", value: formatOptionValue(profile.has_kids!) || "" });
  }
  if (shouldDisplay(profile.wants_kids)) {
    familyItems.push({ icon: <Baby className="w-4 h-4" />, label: "Wants Kids", value: formatOptionValue(profile.wants_kids!) || "" });
  }
  if (shouldDisplay(profile.pets)) {
    const pets = Array.isArray(profile.pets) ? profile.pets.join(", ") : "";
    if (pets) {
      familyItems.push({ icon: <PawPrint className="w-4 h-4" />, label: "Pets", value: pets });
    }
  }

  const habitsItems: Array<{ icon: React.ReactNode; label: string; value: string }> = [];
  
  if (shouldDisplay(profile.smoking)) {
    habitsItems.push({ icon: <Cigarette className="w-4 h-4" />, label: "Smoking", value: formatOptionValue(profile.smoking!) || "" });
  }
  if (shouldDisplay(profile.drinking)) {
    habitsItems.push({ icon: <Wine className="w-4 h-4" />, label: "Drinking", value: formatOptionValue(profile.drinking!) || "" });
  }
  if (shouldDisplay(profile.marijuana)) {
    habitsItems.push({ icon: <Leaf className="w-4 h-4" />, label: "Marijuana", value: formatOptionValue(profile.marijuana!) || "" });
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Basic Info - hidden when excludeBasicsAndAbout is true */}
      {!excludeBasicsAndAbout && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {name}
              {age && <span className="font-normal">, {age}</span>}
            </h1>
            {profile.is_verified && (
              <CheckCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            )}
          </div>

          {location && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
              {profile.distance_km && (
                <span className="text-gray-400 dark:text-gray-500 ml-2">
                  • {profile.distance_km.toFixed(1)} km away
                </span>
              )}
            </div>
          )}

          {shouldDisplay(profile.occupation) && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Briefcase className="w-4 h-4" />
              <span>{profile.occupation}</span>
            </div>
          )}
        </div>
      )}

      {/* About - hidden when excludeBasicsAndAbout is true */}
      {!excludeBasicsAndAbout && shouldDisplay(profile.bio) && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">About Me</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Prompts */}
      {prompts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Get to Know Me</h2>
          <div className="space-y-3">
            {prompts.map((prompt, index) => (
              <div
                key={index}
                className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4 space-y-1"
              >
                <p className="text-xs text-amber-700 dark:text-amber-400 italic">{prompt.label}</p>
                <p className="text-amber-900 dark:text-amber-100">{prompt.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {shouldDisplay(profile.interests) && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {profile.interests!.map((interest, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
              >
                {capitalize(interest)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Lifestyle */}
      {lifestyleItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Lifestyle</h2>
          <div className="grid grid-cols-2 gap-2">
            {lifestyleItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg"
              >
                <div className="text-amber-600 dark:text-amber-400">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium truncate">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Background */}
      {backgroundItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Background</h2>
          <div className="grid grid-cols-2 gap-2">
            {backgroundItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg"
              >
                <div className="text-amber-600 dark:text-amber-400">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium truncate">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Family */}
      {familyItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Family</h2>
          <div className="grid grid-cols-2 gap-2">
            {familyItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg"
              >
                <div className="text-amber-600 dark:text-amber-400">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium truncate">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habits */}
      {habitsItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Habits</h2>
          <div className="grid grid-cols-2 gap-2">
            {habitsItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg"
              >
                <div className="text-amber-600 dark:text-amber-400">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium truncate">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileSectionRenderer;
