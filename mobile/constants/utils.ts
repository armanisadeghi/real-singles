import { images } from "./images";

export const genderOptions = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];

export const petsOptions = [
  { label: "None", value: "none" },
  { label: "Dog", value: "dog" },
  { label: "Cat", value: "cat" },
];


 export const politicalViewsOptions = [
    { label: 'No answer', value: 'no' },
    { label: 'Undecided', value: 'undecided' },
    { label: 'Conservative', value: 'conservative' },
    { label: 'Liberal', value: 'liberal' },
    { label: 'Libertarian', value: 'libertarian' },
    { label: 'Moderate', value: 'moderate' },
  ];

  export const politicalViewOptions = [
  { label: "Liberal", value: "liberal" },
  { label: "Moderate", value: "moderate" },
  { label: "Conservative", value: "conservative" },
  { label: "Undecided", value: "undecided" },
  { label: "No Answer", value: "no" },
  { label: "Libertarian", value: "libertarian" },
  { label: "Prefer not to say", value: "none" },
];

export const languageOptions = [
    { label: "Arabic", value: "arabic" },
    { label: "Armenian", value: "armenian" },
    { label: "Chinese", value: "chinese" },
    { label: "Dutch", value: "dutch" },
    { label: "English", value: "english" },
    { label: "French", value: "french" },
    { label: "Hebrew", value: "hebrew" },
    { label: "Hindi", value: "hindi" },
    { label: "Japanese", value: "japanese" },
    { label: "Korean", value: "korean" },
    { label: "Norwegian", value: "norwegian" },
    { label: "Italian", value: "italian" },
    { label: "German", value: "germ" },
    { label: "Spanish", value: "spanish" },
  ];

  // @deprecated Use ETHNICITY_OPTIONS from @/constants/options instead
  export const ethnicityOptions = [
  { label: "White/Caucasian", value: "White/Caucasian" },
  { label: "Latino/Hispanic", value: "Latino/Hispanic" },
  { label: "Black/African American", value: "Black/African American" },
  { label: "Asian", value: "Asian" },
  { label: "Native American", value: "Native American" },
  { label: "East Indian", value: "East Indian" },
  { label: "Pacific Islander", value: "Pacific Islander" },
  { label: "Middle Eastern", value: "Middle Eastern" },
  { label: "Armenian", value: "Armenian" },
  { label: "Other", value: "Other" },
];
  // Alias for backward compatibility
  export const ethinicityOptions = ethnicityOptions;



export const maritalOptions = [
  {
    label: "Single",
    value: "single",
  },
  {
    label: "Separated",
    value: "seperated",
  },
  {
    label: "Divorced",
    value: "divorced",
  },
  {
    label: "Widow/Widower",
    value: "widow/widower",
  },
];

export const bodyTypeOptions = [
  {
    label: "Slim/slender",
    value: "Slim/slender",
  },
  {
    label: "Athletic/fit",
    value: "Athletic/fit",
  },
  {
    label: "Average",
    value: "Average",
  },
  {
    label: "Muscular",
    value: "Muscular",
  },
  {
    label: "Curvy",
    value: "Curvy",
  },
  {
    label: "A few extra pounds",
    value: "A few extra pounds",
  },
];

export const haveChildrenOptions = [
  {
    label: "No",
    value: "no",
  },
  {
    label: "Yes, and they sometimes live at home",
    value: "Yes, and they sometimes live at home",
  },
  {
    label: "Yes, and they live away from home",
    value: "Yes, and they live away from home",
  },
  {
    label: "Yes, and they live at home",
    value: "Yes, and they live at home",
  },
];

export const marijuanOption = [
  {
    label: "Yes",
    value: "yes",
  },
  {
    label: "Marijuana is not for me",
    value: "no",
  },
];

export const drinkingOption = [
  {
    label: "Never",
    value: "never",
  },
  {
    label: "Social drinker",
    value: "Social drinker",
  },
  {
    label: "Moderately",
    value: "Moderately",
  },
  {
    label: "Regularly",
    value: "Regularly",
  },
];

export const wantChildrenOptions = [
  {
    label: "No",
    value: "no",
  },
  {
    label: "Definitely",
    value: "definitely",
  },
  {
    label: "Someday",
    value: "someday",
  },
  {
    label: "No but it’s ok if my partner has children",
    value: "No but it’s ok if my partner has children",
  },
];

export const religionOptions = [
  { label: "Adventist", value: "adventist" },
  { label: "Agnostic", value: "agnostic" },
  { label: "Buddhist", value: "buddhist" },
  { label: "Christian / Catholic", value: "christian/catholic" },
  { label: "Christian / LDS", value: "christian/lds" },
  { label: "Christian / Protestant", value: "christian/protestant" },
  { label: "Christian / Orthodox", value: "christian/orthodox" },
  { label: "Hindu", value: "hindu" },
  { label: "Jewish", value: "jewish" },
  { label: "Muslim / Islam", value: "muslim/islam" },
  { label: "Spiritual", value: "spiritual" },
  { label: "Other / rather not say", value: "other/rather not say" },
];

export const pastEventData = [
  {
    id: "past1",
    image: images.event1,
    title: "Couples Workshop",
    location: "Sheraton Hotel, Downtown",
    price: "$25",
    time: "Last Saturday at 2:00 PM",
  },
  {
    id: "past2",
    image: images.event1,
    title: "Singles Mixer Night",
    location: "Blue Moon Bar & Lounge",
    price: "$15",
    time: "April 10th at 8:00 PM",
  },
  {
    id: "past3",
    image: images.event1,
    title: "Speed Dating Evening",
    location: "The Grand Hotel",
    price: "$30",
    time: "March 25th at 7:30 PM",
  },
  {
    id: "past4",
    image: images.event1,
    title: "Dating Workshop",
    location: "Community Center",
    price: "Free",
    time: "March 12th at 6:00 PM",
  },
  {
    id: "past5",
    image: images.event1,
    title: "Valentine's Special Event",
    location: "Rosewood Restaurant",
    price: "$50",
    time: "February 14th at 9:00 PM",
  },
];


export const educationOptions = [
  { label: "High School", value: "high school" },
  { label: "Some College", value: "some college" },
  { label: "Associate’s Degree", value: "associate degree" },
  { label: "Bachelor’s Degree", value: "bachelor’s degree" },
  { label: "Master’s Degree", value: "master’s degree" },
  { label: "PHD/post-doctoral", value: "PHD/post-doctoral" },
  { label: "Graduate degree", value: "graduate degree" },
  { label: "Other", value: "other" },
];


export const smokeOptions = [
  { label: "Never", value: "no" },
  { label: "Occasionally", value: "occalsionally" },
  { label: "Regularly", value: "regularly" },
  { label: "Trying to quit", value: "trying to quit" },
];



export const exerciseOptions = [
  { label: "Never", value: "never" },
  { label: "Sometimes", value: "sometimes" },
  { label: "Often", value: "often" },
  { label: "Everyday", value: "everyday" },
];

export const lookingForOptions = [
  { label: "Relationship", value: "relationship" },
  { label: "Something casual", value: "casual" },
  { label: "Marriage", value: "marriage" },
  { label: "Not sure yet", value: "not_sure" },
];

export const interestOptions = [
  { label: "Dining Out", value: "dining out" },
  { label: "Sports", value: "sports" },
  { label: "Museums", value: "museums" },
  { label: "Music", value: "music" },
  { label: "Gardening", value: "gardening" },
  { label: "Basketball", value: "basketball" },
  { label: "Dancing", value: "dancing" },
  { label: "Travel", value: "travel" },
];

// Top 15 Western countries for a luxury dating app (US-focused but international)
export const countryOptions = [
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

export const zodiacOptions = [
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
