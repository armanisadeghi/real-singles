/**
 * Standardized Options for Mobile App
 * 
 * IMPORTANT: These options MUST match the database constraints and web options.
 * All values use lowercase with underscores to match the database schema.
 * 
 * When updating options, also update:
 * - web/src/types/index.ts
 * - web/supabase/migrations (if adding new values)
 */

// Gender options
export const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Non-Binary", value: "non-binary" },
  { label: "Other", value: "other" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

// Body type options - matches database CHECK constraint
export const BODY_TYPE_OPTIONS = [
  { label: "Slim/Slender", value: "slim" },
  { label: "Athletic/Fit", value: "athletic" },
  { label: "Average", value: "average" },
  { label: "Muscular", value: "muscular" },
  { label: "Curvy", value: "curvy" },
  { label: "A few extra pounds", value: "plus_size" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

// Marital status options - matches database CHECK constraint
export const MARITAL_STATUS_OPTIONS = [
  { label: "Never Married", value: "never_married" },
  { label: "Currently Separated", value: "separated" },
  { label: "Divorced", value: "divorced" },
  { label: "Widow/Widower", value: "widowed" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

// Has kids options - matches database CHECK constraint
export const HAS_KIDS_OPTIONS = [
  { label: "No", value: "no" },
  { label: "Yes (Live at home)", value: "yes_live_at_home" },
  { label: "Yes (Live away)", value: "yes_live_away" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

// Wants kids options - matches database CHECK constraint
export const WANTS_KIDS_OPTIONS = [
  { label: "No", value: "no" },
  { label: "Definitely", value: "definitely" },
  { label: "Someday", value: "someday" },
  { label: "No (but OK if partner has)", value: "ok_if_partner_has" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

// Smoking options - matches database CHECK constraint
export const SMOKING_OPTIONS = [
  { label: "No", value: "no" },
  { label: "Yes (Occasionally)", value: "occasionally" },
  { label: "Yes (Daily)", value: "daily" },
  { label: "Trying to quit", value: "trying_to_quit" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

// Drinking options - matches database CHECK constraint
export const DRINKING_OPTIONS = [
  { label: "Never", value: "never" },
  { label: "Social", value: "social" },
  { label: "Moderately", value: "moderate" },
  { label: "Regular", value: "regular" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

// Marijuana options - matches database CHECK constraint
export const MARIJUANA_OPTIONS = [
  { label: "No", value: "no" },
  { label: "Occasionally", value: "occasionally" },
  { label: "Yes", value: "yes" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

// Exercise options - matches database CHECK constraint
export const EXERCISE_OPTIONS = [
  { label: "Never", value: "never" },
  { label: "Sometimes", value: "sometimes" },
  { label: "Regularly", value: "regularly" },
  { label: "Daily", value: "daily" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

// Education options
export const EDUCATION_OPTIONS = [
  { label: "High School", value: "high_school" },
  { label: "Some College", value: "some_college" },
  { label: "Associate Degree", value: "associate" },
  { label: "Bachelor's Degree", value: "bachelor" },
  { label: "Graduate Degree", value: "graduate" },
  { label: "PhD/Post-doctoral", value: "phd" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

// Ethnicity options (multi-select allowed)
export const ETHNICITY_OPTIONS = [
  { label: "White/Caucasian", value: "white" },
  { label: "Latino/Hispanic", value: "latino" },
  { label: "Black/African American", value: "black" },
  { label: "Asian", value: "asian" },
  { label: "Native American", value: "native_american" },
  { label: "East Indian", value: "east_indian" },
  { label: "Pacific Islander", value: "pacific_islander" },
  { label: "Middle Eastern", value: "middle_eastern" },
  { label: "Armenian", value: "armenian" },
  { label: "Mixed/Multi-racial", value: "mixed" },
  { label: "Other", value: "other" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

// Religion options
export const RELIGION_OPTIONS = [
  { label: "Adventist", value: "adventist" },
  { label: "Agnostic", value: "agnostic" },
  { label: "Atheist", value: "atheist" },
  { label: "Buddhist", value: "buddhist" },
  { label: "Catholic", value: "catholic" },
  { label: "Christian/LDS/Protestant", value: "christian" },
  { label: "Hindu", value: "hindu" },
  { label: "Jewish", value: "jewish" },
  { label: "Muslim/Islam", value: "muslim" },
  { label: "Spiritual but not religious", value: "spiritual" },
  { label: "Other", value: "other" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

// Political views options
export const POLITICAL_OPTIONS = [
  { label: "No answer", value: "no_answer" },
  { label: "Undecided", value: "undecided" },
  { label: "Conservative", value: "conservative" },
  { label: "Liberal", value: "liberal" },
  { label: "Libertarian", value: "libertarian" },
  { label: "Moderate", value: "moderate" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

// Zodiac sign options
export const ZODIAC_OPTIONS = [
  { label: "Aries", value: "aries" },
  { label: "Taurus", value: "taurus" },
  { label: "Gemini", value: "gemini" },
  { label: "Cancer", value: "cancer" },
  { label: "Leo", value: "leo" },
  { label: "Virgo", value: "virgo" },
  { label: "Libra", value: "libra" },
  { label: "Scorpio", value: "scorpio" },
  { label: "Sagittarius", value: "sagittarius" },
  { label: "Capricorn", value: "capricorn" },
  { label: "Aquarius", value: "aquarius" },
  { label: "Pisces", value: "pisces" },
];

// Pets options (multi-select allowed)
export const PETS_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Dog", value: "dog" },
  { label: "Cat", value: "cat" },
  { label: "Other", value: "other" },
];

// Language options (multi-select allowed)
export const LANGUAGE_OPTIONS = [
  { label: "English", value: "english" },
  { label: "Spanish", value: "spanish" },
  { label: "French", value: "french" },
  { label: "German", value: "german" },
  { label: "Italian", value: "italian" },
  { label: "Portuguese", value: "portuguese" },
  { label: "Chinese", value: "chinese" },
  { label: "Japanese", value: "japanese" },
  { label: "Korean", value: "korean" },
  { label: "Arabic", value: "arabic" },
  { label: "Armenian", value: "armenian" },
  { label: "Dutch", value: "dutch" },
  { label: "Hebrew", value: "hebrew" },
  { label: "Hindi", value: "hindi" },
  { label: "Norwegian", value: "norwegian" },
  { label: "Russian", value: "russian" },
  { label: "Swedish", value: "swedish" },
  { label: "Tagalog", value: "tagalog" },
  { label: "Turkish", value: "turkish" },
  { label: "Urdu", value: "urdu" },
  { label: "Other", value: "other" },
];

// Interests options (multi-select allowed)
export const INTEREST_OPTIONS = [
  // From business logic
  { label: "Dining out", value: "dining_out" },
  { label: "Sports", value: "sports" },
  { label: "Museums/Art", value: "museums_art" },
  { label: "Music", value: "music" },
  { label: "Gardening", value: "gardening" },
  { label: "Basketball", value: "basketball" },
  { label: "Dancing", value: "dancing" },
  { label: "Travel", value: "travel" },
  // Additional common interests
  { label: "Movies", value: "movies" },
  { label: "Reading", value: "reading" },
  { label: "Fitness", value: "fitness" },
  { label: "Cooking", value: "cooking" },
  { label: "Photography", value: "photography" },
  { label: "Gaming", value: "gaming" },
  { label: "Hiking", value: "hiking" },
  { label: "Yoga", value: "yoga" },
  { label: "Wine", value: "wine" },
  { label: "Coffee", value: "coffee" },
  { label: "Dogs", value: "dogs" },
  { label: "Cats", value: "cats" },
  { label: "Fashion", value: "fashion" },
  { label: "Technology", value: "technology" },
  { label: "Nature", value: "nature" },
  { label: "Beach", value: "beach" },
  { label: "Mountains", value: "mountains" },
  { label: "Running", value: "running" },
  { label: "Cycling", value: "cycling" },
  { label: "Concerts", value: "concerts" },
  { label: "Theater", value: "theater" },
  { label: "Volunteering", value: "volunteering" },
];

// Height options for feet (4-7)
export const HEIGHT_FEET_OPTIONS = [
  { label: "4'", value: 4 },
  { label: "5'", value: 5 },
  { label: "6'", value: 6 },
  { label: "7'", value: 7 },
];

// Height options for inches (0-11)
export const HEIGHT_INCHES_OPTIONS = [
  { label: '0"', value: 0 },
  { label: '1"', value: 1 },
  { label: '2"', value: 2 },
  { label: '3"', value: 3 },
  { label: '4"', value: 4 },
  { label: '5"', value: 5 },
  { label: '6"', value: 6 },
  { label: '7"', value: 7 },
  { label: '8"', value: 8 },
  { label: '9"', value: 9 },
  { label: '10"', value: 10 },
  { label: '11"', value: 11 },
];

// Helper functions for height conversion
export const heightToFeetAndInches = (totalInches: number | null | undefined): { feet: number; inches: number } => {
  if (!totalInches || totalInches <= 0) return { feet: 5, inches: 6 }; // Default 5'6"
  return {
    feet: Math.floor(totalInches / 12),
    inches: totalInches % 12,
  };
};

export const feetAndInchesToHeight = (feet: number, inches: number): number => {
  return (feet * 12) + inches;
};

// Format height for display (e.g., "5' 8\"")
export const formatHeight = (totalInches: number | null | undefined): string => {
  if (!totalInches) return "";
  const { feet, inches } = heightToFeetAndInches(totalInches);
  return `${feet}' ${inches}"`;
};

// Top 15 Western countries for a luxury dating app (US-focused but international)
export const COUNTRY_OPTIONS = [
  { label: "United States", value: "US" },
  { label: "Canada", value: "CA" },
  { label: "United Kingdom", value: "GB" },
  { label: "Australia", value: "AU" },
  { label: "Germany", value: "DE" },
  { label: "France", value: "FR" },
  { label: "Italy", value: "IT" },
  { label: "Spain", value: "ES" },
  { label: "Netherlands", value: "NL" },
  { label: "Switzerland", value: "CH" },
  { label: "Sweden", value: "SE" },
  { label: "Norway", value: "NO" },
  { label: "Denmark", value: "DK" },
  { label: "Ireland", value: "IE" },
  { label: "New Zealand", value: "NZ" },
];

// Looking for / relationship type options
export const LOOKING_FOR_OPTIONS = [
  { label: "Relationship", value: "relationship" },
  { label: "Something casual", value: "casual" },
  { label: "Marriage", value: "marriage" },
  { label: "Not sure yet", value: "not_sure" },
];

// Dating intentions - critical for serious-dater positioning (The League, Hinge model)
export const DATING_INTENTIONS_OPTIONS = [
  { label: "Life Partner", value: "life_partner" },
  { label: "Long-term Relationship", value: "long_term" },
  { label: "Long-term, Open to Short", value: "long_term_open" },
  { label: "Figuring Out My Goals", value: "figuring_out" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

// Event type options - matches database CHECK constraint
export const EVENT_TYPE_OPTIONS = [
  { label: "In Person", value: "in_person" },
  { label: "Virtual", value: "virtual" },
  { label: "Speed Dating", value: "speed_dating" },
];

// Event status options - matches database CHECK constraint
export const EVENT_STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

// Event attendee status options - matches database CHECK constraint
export const EVENT_ATTENDEE_STATUS_OPTIONS = [
  { label: "Interested", value: "interested" },
  { label: "Registered", value: "registered" },
  { label: "Attended", value: "attended" },
  { label: "Cancelled", value: "cancelled" },
];

/**
 * Calculate zodiac sign from a date of birth
 * @param dateString - Date string in MM/DD/YYYY or YYYY-MM-DD format
 * @returns Lowercase zodiac sign string or null if invalid date
 */
export function getZodiacFromDate(dateString: string): string | null {
  if (!dateString) return null;
  
  let month: number;
  let day: number;
  
  // Handle MM/DD/YYYY format
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    month = parseInt(parts[0], 10);
    day = parseInt(parts[1], 10);
  } else {
    // Handle YYYY-MM-DD format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    month = date.getMonth() + 1;
    day = date.getDate();
  }
  
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  
  // Zodiac date ranges
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "aquarius";
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "pisces";
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "sagittarius";
  
  return null;
}
