# **RealSingles: Comprehensive Technical & Business Logic Requirements**

This document outlines the core functional requirements, business logic, and interface structures for the RealSingles platform, derived from the original technical specifications.

NOTE: The client updated their requirements multiple times so some of these things have been expanded upon. If the app does less than this, then it must be updated to do this, but for anything where the app already does more, then we will update the business logic to show all that we do. We don't want to lose features, items, options, etc.

## **1. Authentication & Onboarding**

### **The Entrance**

* **Splash Screen:** Mandatory short branding display upon application launch. (Must only display while loading happens in the background) - The key is to replace a spinner, but it should not cause actual delays and should not waste any time so it loads slower.
* **Login/Signup Methods:** Email/Phone Number + Password, Facebook Login, Google Login, Apple Login.  
* **Security Features:** Forgot Password (code-based email recovery), "Remember Me" session persistence.

### **Initial Intent Selection**

* "I am a man looking for women"  
* "I am a woman looking for men"  
* *Note: Final settings should allow for broader search preferences (Both/Inclusive).*

## **2. Core User Profile Attributes**

Profile creation is a high-friction, high-data process to ensure quality matching.

### **Basic Identity**

* **Account:** Username, Display Name, Email, Password.  
* **Verification:** First & Last Name (Internal), Birthday, Phone Number, Zip Code.  
* **Astrology:** Horoscope Sign (Calculated automatically or manually selected).

### **Personal Status & Lifestyle**

* **Marital Status:** Never Married, Currently Separated, Divorced, Widow/Widower.  
* **Children:** * Current: No, Yes (Live at home), Yes (Live away).  
  * Future Intent: No, Definitely, Someday, No (but OK if partner has).  
* **Physical:** * Height (Slider-based bar).  
  * Body Type: Slim/Slender, Athletic/Fit, Average, Muscular, Curvy, A few extra pounds.  
* **Habits:**  
  * Exercise: (Frequency/Type).  
  * Marijuana: Yes, Marijuana is not for me.  
  * Smoking: No, Yes (Occasionally), Yes (Daily), Trying to quit.  
  * Drinking: Never, Social, Moderately, Regular.  
* **Pets:** None, Cat, Dog.

### **Background & Identity**

* **Education:** High School, Some College, Associate, Bachelor, Graduate, PHP/Post-doctoral.  
* **School Info:** Ability to list multiple schools and graduation details.  
* **Professional:** Job Title, Company Name.  
* **Ethnicity:** White/Caucasian, Latino/Hispanic, Black/African American, Asian, Native American, East India, Pacific Islander, Middle Eastern, Armenian, Other.  
* **Religion:** Adventist, Agnostic, Buddhist, Christian/LDS/Protestant, Hindu, Jewish, Muslim/Islam, Spiritual, Other.  
* **Languages:** Extensive list (Arabic, Armenian, Chinese, Dutch, English, French, German, Hebrew, Hindi, Italian, Japanese, Korean, Norwegian, Portuguese, Russian, Swedish, Tagalog, Turkish, Urdu, etc.).  
* **Political Views:** No answer, Undecided, Conservative, Liberal, Libertarian, Moderate.

## **3. Creative Profile Elements (Prompts & Media)**

### **User Prompts & Interests**

* **Bio:** "About Yourself" open text.  
* **Interests:** Dining out, Sports, Museums/Art, Music, Gardening, Basketball, Dancing, Travel.  
* **Structured Storytelling:**  
  * "My ideal first date starts with... and ends with..."  
  * "My top 5 non-negotiables"  
  * "The worst job I ever had"  
  * "The job I'd do for no money"  
  * "Nightclub or night at home?"  
  * "My pet peeves"  
  * "After work, you can find me..."  
  * "The way to my heart is through..."  
  * "Craziest travel story"  
  * "Weirdest gift I have received"

### **Verification & Media**

* **Media:** Standard Profile Picture + Mandatory "Live" picture.  
* **ID Verification:** Secure portal for Government ID proof uploads.  
* **Gamification:** Earned Reward Points visible on the public profile.  
* **Congratulations Screen:** A "Success" state after completing profile milestones.

## **4. Main App Features & Screens**

### **Home Screen & Navigation**

* **Modules:** * Top Matches (Grid view).  
  * Featured Videos (Integrated video player/circle).  
  * Notification Center.  
  * Virtual Speed Dating shortcut.  
* **Interaction:** View distance, view quick details, or click for the full profile.

### **Search & Discovery Filters**

Comprehensive filtering logic across all profile attributes:

* Gender, Age (Slider), Height (Slider), Distance, Marital Status.  
* Body type, Ethnicity, Religion, Education.  
* Lifestyle (Exercise, Marijuana, Smoking, Drinking, Kids, Pets, Zodiac).

### **Interaction & Feedback**

* **Match Requests:** Accept/Reject incoming requests.  
* **Social Proof:** Ability to write reviews and rate other users post-interaction.  
* **Profile Sharing Logic:** Users can share another user's profile with a match. If the recipient accepts the match, the "sharer" is credited with Reward Points.

### **Geolocation Features**

* **Nearby Friends:** Map view with pin icons indicating friend locations (Privacy-toggle required).  
* **Nearby Events:** Map view showing event pins and directions.

## **5. Specialized Business Modules**

### **Communication Hub**

* **Direct Messaging:** Chat history, typing indicators, online status.  
* **Media Calling:** Integrated Video and Voice calling.  
* **Group Chat:** Create/edit groups, invite members via direct links, or sync/refresh from phone contacts.

### **Events Module**

* **Listings:** Current vs. Past events.  
* **Event Cards:** Banner image, Title, Location (Map/Directions), Free/Paid status, Date/Time, Interest count.  
* **Engagement:** "Interested" button to track intent.

### **Virtual Speed Dating**

* **Slot-Based:** Register for specific time-slots.  
* **Real-time Stats:** View count of registered members per slot.  
* **Management:** Ability to cancel registration before the event starts.

### **Reward System & Store**

* **Earning:** Points for sharing profiles, successful referrals, and inviting friends via email/social media.  
* **Store Interface:** View "Featured Products" and "New Arrivals" with point requirements.  
* **Gifting Logic:** "Redeem for You" or "Redeem for a Friend" (includes adding friend's shipping address: Building, Floor, Street, City, State, Postal Code).

## **6. Admin Web Interface (Back-Office)**

### **Dashboard & Analytics**

* **High-level KPIs:** Total users, total points distributed.  
* **Visualization:** Graphical representation of user growth and redemption trends.  
* **Reporting:** Date-range filtering (Calendar) and Export to CSV/Excel.

### **Management Tools**

* **User Management:** Activate/Suspend accounts; audit profile info, reward balances, and redemption history.  
* **Offer Management:** CRUD interface for reward store products/offers.  
* **Enquiry Management:** Inbox for "Contact Us" submissions (Name, Email, Subject, Message).  
* **Notifications:** Real-time triggers for new registrations, point redemptions, and support enquiries.

## **7. Key Business Logic Summaries**

* **Incentivized Ecosystem:** The core differentiator is the point system that rewards users for being active community members (sharing, matching others, inviting).  
* **Trust Architecture:** Built-in ID verification and a review/rating system for dating profiles.  
* **Event-Centric:** Focuses on converting digital matches into physical/virtual event interactions.  
* **Accountability:** Admin capability to suspend users ensures community quality.