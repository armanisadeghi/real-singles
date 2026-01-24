**RealSingles**

Master Data Inventory & Requirements

*Industry Best Practices Amalgamation*

Last Updated: January 24, 2026

Version 3.0 - Implementation Decisions Finalized

**Research Sources**

The League • Hinge • Bumble • Raya

---

# **Implementation Decisions (January 24, 2026)**

The following decisions have been finalized for RealSingles:

| Decision | Choice | Notes |
| :---- | :---- | :---- |
| Photo Minimum | **1 photo required** | Primary photo auto-syncs to user avatar across app |
| Life Goals | **APPROVED - Full** | Implement The League model with filtering |
| Voice Prompts | **APPROVED - Core** | Implement infrastructure; "Coming Soon" for incomplete |
| Video Intros | **APPROVED - Core** | Implement infrastructure; "Coming Soon" for incomplete |
| Application Review/Vetting | **DECLINED** | Not implementing - open registration |
| LinkedIn Verification | **DECLINED** | Not implementing |
| Profile Prompts | **APPROVED - Migrate** | Separate table with admin interface for prompt management |

### Completed Fixes (January 24, 2026)
- ✅ Political views bug fixed (was saving to NightAtHome, now saves to Political)
- ✅ Gender/looking_for properly separated in mobile

---

# **Executive Summary**

This document consolidates the current RealSingles data inventory with extensive industry research from leading luxury and serious-dater dating applications. The goal is to create a comprehensive master specification that adopts industry best practices while maintaining unique differentiators.

## **Key Industry Insights**

* **The League:** LinkedIn verification required, 190-char bio, 100+ goals system, 10-20% acceptance rate, education filtering from "no preference" to "highly selective"  
* **Hinge:** 85+ prompts (3 required, 150 chars each), organizes data as Vitals/Virtues/Vices, 6 photos required, voice/video prompt options  
* **Bumble:** 200+ interest badges, 3 optional prompts (160 chars), 300-char bio, comprehensive filters including exercise frequency  
* **Raya:** Photo slideshow with music, Instagram required, committee review, 8% acceptance rate, creative industry focus

## **Implementation Priority Summary**

| Priority | Fields |
| :---- | :---- |
| REQUIRED | Name, Age, Gender, Location, Height, **1 Photo minimum**, Dating Intentions, 3 Prompts, Occupation, Education, Phone Verification |
| STRONGLY RECOMMENDED | Family Plans, Children Status, Religion, Politics, Drinking, Smoking, Marijuana, 5-10 Interest Badges, Bio (250 chars), Marital Status |
| APPROVED FOR IMPLEMENTATION | **Voice Prompts**, **Video Intro**, **Life Goals (full with filtering)**, Zodiac, Languages, Schools |
| DECLINED | ~~LinkedIn Verification~~, ~~Application Review/Vetting~~ |

# **1. Basic Demographics (Required)**

Core identity fields required from all users. Industry standard across all platforms.

| Field | DB Status | API Status | Type | Notes |
| :---- | :---- | :---- | :---- | :---- |
| first_name | **FULL** | **FULL** | TEXT | Required |
| last_name | **FULL** | **FULL** | TEXT | Optional display |
| date_of_birth | **FULL** | **FULL** | DATE | Must be 18+ |
| display_name | **PARTIAL** | **FULL** | TEXT | Missing web edit |
| username | **MISSING** | **MISSING** | TEXT UNIQUE | Add per business logic |

### **1.1 Gender Options (Standardized)**

Options: male, female, non-binary, other, prefer_not_to_say

Current Status: ✅ FIXED - Mobile now has separate Gender and Looking For fields

### **1.2 Looking For (Gender Preference)**

Type: TEXT[] (array for multiple selections)

Options: Same as gender options

Industry Practice: All platforms support multiple selections (e.g., "interested in men and women")

# **2. Professional Information**

Critical for luxury positioning. The League requires LinkedIn verification for all users - consider implementing similar verification for credibility.

| Field | DB Status | API Status | Type | Notes |
| :---- | :---- | :---- | :---- | :---- |
| occupation | **FULL** | **FULL** | TEXT | API: JobTitle |
| company | **MISSING** | **MISSING** | TEXT | Add - mobile has field |
| education | **FULL** | **FULL** | TEXT | Web: change to dropdown |
| schools | **MISSING** | **MISSING** | TEXT[] | Add - array for multiple |

### **2.1 Education Level Options (Per Industry Standard)**

| Value | Display Text |
| :---- | :---- |
| high_school | High School |
| trade_technical | Trade/Technical School |
| some_college | Some College |
| associate | Associate Degree |
| bachelor | Bachelor's Degree |
| graduate | Graduate Degree (Master's) |
| doctorate | Doctorate (PhD/MD/JD) |
| prefer_not_to_say | Prefer not to say |

*Industry Note: The League allows filtering matches by education level with settings from "no preference" to "highly selective" - consider implementing similar tiered filtering.*

# **3. Relationship Preferences**

Critical for serious-dater positioning. Hinge's "designed to be deleted" positioning emphasizes relationship intent.

### **3.1 Dating Intentions (REQUIRED)**

Current Status: Missing from current implementation - must add

| Value | Display Text |
| :---- | :---- |
| life_partner | Life Partner |
| long_term | Long-term Relationship |
| long_term_open | Long-term, Open to Short |
| figuring_out | Figuring Out My Goals |
| prefer_not_to_say | Prefer not to say |

*Recommendation: For a luxury serious-dater app, consider de-emphasizing or removing "casual" options that most platforms include. The options above are aligned with The League's relationship-focused approach.*

### **3.2 Additional Preference Fields**

| Field | Status | Notes |
| :---- | :---- | :---- |
| age_range_min/max | **NEW (RECOMMENDED)** | Preference filter - industry standard |
| distance_preference | **NEW (RECOMMENDED)** | Miles/km radius for matches |
| height_preference_min/max | **NEW (RECOMMENDED)** | Optional height range filter |

# **4. Physical Attributes**

Standard profile fields with important implementation notes.

### **4.1 Height**

Current Status: BUG - Mobile slider saves feet as inches (critical fix needed)

DB Type: INTEGER (total inches)

Validation: 48-96 inches (4ft - 8ft)

**Implementation Fix:**

* Web: Two dropdowns (feet 4-7, inches 0-11)  
* iOS: Two-column wheel picker  
* Android: Two dropdown spinners  
* Conversion: (feet × 12) + inches on save

### **4.2 Body Type Options**

Type: Single select (not multi-select as currently implemented on mobile)

| Value | Display Text |
| :---- | :---- |
| slim | Slim/Slender |
| athletic | Athletic/Fit |
| average | Average |
| muscular | Muscular |
| curvy | Curvy |
| plus_size | A few extra pounds |
| prefer_not_to_say | Prefer not to say |

### **4.3 Ethnicity Options**

Type: TEXT[] (array - allows multi-select for mixed heritage)

API Fix Required: Rename from Ethniticity to Ethnicity

| Value | Display Text |
| :---- | :---- |
| white | White/Caucasian |
| latino | Latino/Hispanic |
| black | Black/African American |
| asian | Asian |
| south_asian | South Asian/East Indian |
| middle_eastern | Middle Eastern |
| native_american | Native American |
| pacific_islander | Pacific Islander |
| mixed | Mixed/Multi-racial |
| other | Other |
| prefer_not_to_say | Prefer not to say |

# **5. Location**

Standard location fields with PostGIS support for distance calculations.

| Field | DB Status | Type | Notes |
| :---- | :---- | :---- | :---- |
| city | **FULL** | TEXT | Consider autocomplete |
| state | **FULL** | TEXT |  |
| country | **PARTIAL** | TEXT | BUG: Mobile sets null |
| zip_code | **MISSING** | TEXT | Add - mobile has field |
| latitude | **FULL** | DECIMAL(10,8) | Auto from location |
| longitude | **FULL** | DECIMAL(11,8) | Auto from location |
| location | **FULL** | GEOGRAPHY | PostGIS POINT |

# **6. Family & Lifestyle**

Critical compatibility fields. Industry standard across all serious-dating platforms.

### **6.1 Marital Status (NEW - Add to DB)**

Current Status: In mobile UI only - missing from database

| Value | Display Text |
| :---- | :---- |
| never_married | Never Married |
| separated | Currently Separated |
| divorced | Divorced |
| widowed | Widow/Widower |
| prefer_not_to_say | Prefer not to say |

### **6.2 Has Children**

Current Status: Change DB from BOOLEAN to TEXT for richer options

| Value | Display Text |
| :---- | :---- |
| no | No |
| yes_live_at_home | Yes, they live at home |
| yes_live_away | Yes, they live away |
| prefer_not_to_say | Prefer not to say |

### **6.3 Wants Children**

| Value | Display Text |
| :---- | :---- |
| definitely | Want children |
| someday | Someday |
| no | Don't want children |
| ok_if_partner_has | Don't want, but OK if partner has |
| not_sure | Not sure yet |
| prefer_not_to_say | Prefer not to say |

### **6.4 Pets**

Type: TEXT[] (array - users can have multiple pet types)

Current Status: Missing from web UI

Options: none, dog, cat, bird, fish, reptile, other

# **7. Values & Beliefs**

Sensitive but important compatibility fields. Industry practice: optional with "prefer not to say" option.

### **7.1 Religion**

Type: Single select (change mobile from multi-select)

| Value | Display Text |
| :---- | :---- |
| agnostic | Agnostic |
| atheist | Atheist |
| buddhist | Buddhist |
| catholic | Catholic |
| christian | Christian |
| hindu | Hindu |
| jewish | Jewish |
| muslim | Muslim/Islam |
| sikh | Sikh |
| spiritual | Spiritual but not religious |
| other | Other |
| prefer_not_to_say | Prefer not to say |

### **7.2 Political Views**

Current Status: ✅ FIXED - Mobile now correctly saves to Political field

| Value | Display Text |
| :---- | :---- |
| liberal | Liberal |
| moderate | Moderate |
| conservative | Conservative |
| libertarian | Libertarian |
| not_political | Not Political |
| other | Other |
| prefer_not_to_say | Prefer not to say |

# **8. Lifestyle Habits (Vices)**

Following Hinge's "Vices" categorization. These are common dealbreakers.

### **8.1 Drinking**

API Field: Drinks (naming inconsistency with DB field 'drinking')

| Value | Display Text |
| :---- | :---- |
| never | Never |
| rarely | Rarely |
| social | Socially |
| moderate | Moderately |
| regular | Regularly |
| prefer_not_to_say | Prefer not to say |

### **8.2 Smoking**

| Value | Display Text |
| :---- | :---- |
| never | Never |
| occasionally | Socially/Occasionally |
| regularly | Regularly |
| trying_to_quit | Trying to quit |
| prefer_not_to_say | Prefer not to say |

### **8.3 Marijuana**

Current Status: Missing from web, API has typo (Marijuna)

Options: never, occasionally, regularly, prefer_not_to_say

### **8.4 Exercise/Fitness**

Current Status: Missing from API - add per Bumble's model

| Value | Display Text |
| :---- | :---- |
| never | Never |
| sometimes | Sometimes |
| regularly | Regularly (3-4x/week) |
| daily | Daily |
| prefer_not_to_say | Prefer not to say |

# **9. Photos & Media**

Photo requirements based on industry best practices from The League and Hinge.

### **9.1 Photo Requirements**

| Requirement | Specification |
| :---- | :---- |
| **Minimum Photos** | **1 required** (RealSingles decision - lower barrier to entry) |
| Maximum Photos | 10 allowed |
| Primary Photo | **Auto-syncs to user avatar** across messages, profiles, etc. |
| Minimum Resolution | 800x800 pixels (higher than Hinge's 640x640) |
| First Photo | Must show clear, unobstructed face |
| Full Body | At least 1 full-body photo recommended |
| Verification Selfie | Required for verification badge |

*Note: Industry standard is 6 photos (League, Hinge), but RealSingles prioritizes lower barrier to entry with 1 photo minimum.*

### **9.2 Media Fields Status**

| Field | Status | Notes |
| :---- | :---- | :---- |
| profile_image_url | **FULL** | Main profile photo - syncs to avatar |
| verification_selfie_url | **FULL** | Photo verification implemented |
| user_gallery | **FULL** | Gallery table for multiple photos/videos |
| voice_prompt_url | **APPROVED** | 30-sec voice intro - core implementation |
| video_intro_url | **APPROVED** | 30-60 sec video - core implementation |

*Voice and video prompts implementing core infrastructure with "Coming Soon" UI for incomplete features.*

# **10. Bio & Profile Prompts**

Hinge pioneered the prompt system - now industry standard. Prompts generate better conversations than open bios.

### **10.1 Bio Specifications**

| Field | Specification |
| :---- | :---- |
| bio (About) | 250 characters max |
| Character Limit Rationale | Between League (190) and Bumble (300) |
| Current Status | FULL - 300 char on mobile, 500 suggested on web |

### **10.2 Prompts (REQUIRED - 3 minimum)**

**Implementation Decision:** Separate `profile_prompts` table with admin-controllable prompt definitions

- Admin interface for managing available prompts (add/edit/disable)
- `prompt_definitions` table for available prompts (admin-managed)
- `user_profile_prompts` table for user responses
- Character Limit: 200 characters per response (higher than Hinge's 150)
- Dev environment sync checking between code and database

### **10.3 Recommended Prompt Categories (50+ options)**

**About Me:**

* A life goal of mine, I'm known for, My simple pleasures, My greatest strength, I geek out on, I won't shut up about, Dating me is like

**What I'm Looking For:**

* I want someone who, My non-negotiables, Green flags I look for, I'll fall for you if, I feel most supported when, My love language is

**Conversation Starters:**

* Let's make sure we're on the same page about, Let's debate this topic, Change my mind about, My controversial opinion, A random fact I love, Do you agree or disagree that

**Life & Experiences:**

* Best travel story, Most spontaneous thing I've done, Biggest risk I've taken, Best spot in town for, Give me travel tips for, My happy place

**Date Ideas:**

* First round is on me if, My ideal first date, After work you can find me, Typical Sunday

### **10.4 Current Mobile Prompts (Need DB Migration)**

| Prompt | Mobile Field | DB Status |
| :---- | :---- | :---- |
| My ideal first date | IdeaDate | **MISSING** |
| My non-negotiables | NonNegotiable | **MISSING** |
| Worst job I ever had | WorstJob | **MISSING** |
| After work, find me... | FindMe | **MISSING** |
| Way to my heart | WayToHeart | **MISSING** |
| Craziest travel story | craziestTravelStory | **MISSING** |
| Weirdest gift received | weiredestGift | **MISSING** |
| Past event to attend | PastEvent | **MISSING** |

# **11. Interests & Badges**

Bumble leads with 200+ interest badges. These improve matching and conversation starters.

### **11.1 Implementation**

Type: TEXT[] (array)

Selection: 5-10 interests (Bumble displays 5)

Current Status: Options differ between platforms - needs standardization

### **11.2 Recommended Interest Categories**

**Sports & Fitness:**

Golf, Tennis, Yoga, Hiking, Running, Skiing, Swimming, CrossFit, Pilates, Cycling, Basketball, Soccer, Climbing

**Food & Drink:**

Wine, Craft Beer, Cooking, Foodie, Coffee, Brunch, Fine Dining, Craft Cocktails, BBQ, Sushi, Vegan, Baking

**Travel & Adventure:**

Beach, Mountains, Road Trips, International Travel, Camping, Sailing, Adventure Sports, Backpacking

**Arts & Culture:**

Museums, Art Galleries, Theater, Live Music, Concerts, Film, Photography, Writing, Reading

**Lifestyle:**

Entrepreneurship, Personal Growth, Philanthropy, Wellness, Meditation, Fashion, Technology, Nature

**Entertainment:**

Netflix, Podcasts, Gaming, Comedy, Sports Watching, Trivia, Board Games

**Values:**

Family-oriented, Ambitious, Environmentally Conscious, Faith-focused, Health-conscious

# **12. Life Goals (The League Model)**

**Status: APPROVED - Full implementation with filtering**

Unique feature from The League - allows filtering by shared ambitions. Differentiator for luxury positioning.

### **12.1 Implementation**

Type: TEXT[] (array)

Selection: Up to 10 goals from 100+ options

Implementation: 
- Add `life_goals TEXT[]` field to profiles table
- Admin-manageable goal definitions in database
- Filtering by shared goals in discovery

### **12.2 Goal Categories**

**Career & Achievement:**

* Start my own company, Get promoted to executive level, Write a book, Get a graduate degree, Become a thought leader, Build a nonprofit

**Adventure & Travel:**

* Visit every continent, Learn a new language, Climb a major mountain, Run a marathon, Go on a safari, Live abroad for a year

**Personal & Lifestyle:**

* Buy a home, Start a family, Achieve financial independence, Learn professional-level cooking, Master an instrument, Build a dream home

# **13. Verification**

Verification features for user trust. 

| Verification Type | Priority | Status |
| :---- | :---- | :---- |
| Photo Verification | REQUIRED | **Implementing** - Selfie match to photos |
| Phone Verification | REQUIRED | **Implementing** - SMS OTP verification |
| Email Verification | RECOMMENDED | **Implementing** - Weighted in trust score |
| ~~LinkedIn Sync~~ | ~~RECOMMENDED~~ | **DECLINED** - Not implementing |
| Instagram Connect | OPTIONAL | Future consideration |
| ~~Application Review~~ | ~~RECOMMENDED~~ | **DECLINED** - Open registration model |
| Member Referrals | OPTIONAL | Future consideration |

### **13.1 Current Verification Fields**

| Field | Status | Notes |
| :---- | :---- | :---- |
| is_verified | **FULL** | Display badge - selfie verification |
| is_photo_verified | **FULL** | Required for matching |
| is_id_verified | **FULL** | Premium tier verification |
| verified_at | **FULL** | Timestamp exposed |
| phone_verified | **FULL** | Via OTP system |
| verification_selfie_url | **FULL** | Implemented on web and mobile |

*RealSingles uses open registration with verification tiers (basic, photo-verified, ID-verified) rather than acceptance rate gatekeeping.*

# **14. Additional Optional Fields**

Nice-to-have fields that enhance profile richness.

| Field | DB Status | Type | Notes |
| :---- | :---- | :---- | :---- |
| zodiac_sign | **PARTIAL** | TEXT | Web edit missing |
| languages | **MISSING** | TEXT[] | Mobile has - add DB |
| hometown | **NEW (RECOMMENDED)** | TEXT | Add for personality |
| pronouns | **NEW (RECOMMENDED)** | TEXT | Modern standard |
| social_link_1 | **MISSING** | TEXT | Instagram, etc. |
| social_link_2 | **MISSING** | TEXT | LinkedIn, etc. |
| looking_for_description | **PARTIAL** | TEXT | Missing from API |

### **14.1 Zodiac Sign Options**

aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces, prefer_not_to_say

### **14.2 Languages (Extensive List)**

Arabic, Armenian, Chinese (Mandarin), Chinese (Cantonese), Dutch, English, French, German, Hebrew, Hindi, Italian, Japanese, Korean, Norwegian, Portuguese, Russian, Spanish, Swedish, Tagalog, Turkish, Urdu, Vietnamese, Other

# **15. Required Database Migration**

Summary of all database changes needed to align with industry best practices.

### **15.1 New Columns for profiles Table**

-- Lifestyle fields

**marital_status TEXT**

**dating_intentions TEXT**

-- Professional fields

company TEXT, schools TEXT[], languages TEXT[]

-- Location

zip_code TEXT

-- Social

social_link_1 TEXT, social_link_2 TEXT

-- Media

photo_urls TEXT[], voice_prompt_url TEXT, video_intro_url TEXT

-- Goals (League model)

life_goals TEXT[]

### **15.2 Profile Prompts Table (New)**

**CREATE TABLE profile_prompts (**

  id UUID PRIMARY KEY,

  user_id UUID REFERENCES users(id),

  prompt_key TEXT NOT NULL,

  response TEXT NOT NULL,

  display_order INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, prompt_key)

);

### **15.3 Column Type Changes**

has_kids: BOOLEAN → TEXT (for richer options)

ethnicity: TEXT → TEXT[] (for mixed heritage)

### **15.4 API Field Name Fixes**

Ethniticity → Ethnicity

Marijuna → Marijuana

Drinks → drinking (consistency)

JobTitle → occupation (consistency)

# **16. Implementation Roadmap**

### **Phase 1: Critical Fixes (COMPLETED)**

1. ✅ Fix height conversion bug on mobile (feet → inches)  
2. ✅ Separate gender and looking_for fields on mobile  
3. ✅ Fix political_views storage (was using NightAtHome)  
4. ✅ Standardize all dropdown options across platforms
5. ✅ Add dating_intentions field
6. ✅ Add marital_status field

### **Phase 2: Current Sprint**

7. Implement 1 photo minimum with primary photo avatar auto-sync
8. Create profile_prompts table with admin interface
9. Create prompt_definitions table (admin-manageable)
10. Add life_goals TEXT[] field and implement full feature with filtering
11. Add voice_prompt_url and video_intro_url fields
12. Implement voice/video prompt core (with "Coming Soon" for incomplete)

### **Declined Features**

- ~~LinkedIn verification~~ - Not implementing
- ~~Application review/vetting process~~ - Open registration model

*— End of Document —*