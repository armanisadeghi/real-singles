"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  GENDER_OPTIONS,
  BODY_TYPE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  HAS_KIDS_OPTIONS,
  WANTS_KIDS_OPTIONS,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
  MARIJUANA_OPTIONS,
  EXERCISE_OPTIONS,
  EDUCATION_OPTIONS,
  ETHNICITY_OPTIONS,
  RELIGION_OPTIONS,
  POLITICAL_OPTIONS,
  ZODIAC_OPTIONS,
  PETS_OPTIONS,
  LANGUAGE_OPTIONS,
  INTEREST_OPTIONS,
  COUNTRY_OPTIONS,
  DATING_INTENTIONS_OPTIONS,
  getZodiacFromDate,
} from "@/types";

const AUTOSAVE_MIN_INTERVAL = 30000; // 30 seconds minimum between autosaves
const IDLE_SAVE_DELAY = 10000; // 10 seconds of inactivity before considering a save

type ProfileState = {
  // Basic Info
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  looking_for: string[];
  zodiac_sign: string;
  bio: string;
  looking_for_description: string;
  dating_intentions: string;
  
  // Physical
  height_feet: number;
  height_inches: number;
  body_type: string;
  ethnicity: string[];
  
  // Location
  city: string;
  state: string;
  country: string;
  zip_code: string;
  
  // Lifestyle
  marital_status: string;
  religion: string;
  political_views: string;
  education: string;
  occupation: string;
  company: string;
  smoking: string;
  drinking: string;
  marijuana: string;
  exercise: string;
  languages: string[];
  
  // Family
  has_kids: string;
  wants_kids: string;
  pets: string[];
  
  // Interests
  interests: string[];
  
  // Life Goals (The League model)
  life_goals: string[];
  
  // Profile Prompts
  ideal_first_date: string;
  non_negotiables: string;
  worst_job: string;
  dream_job: string;
  nightclub_or_home: string;
  pet_peeves: string;
  after_work: string;
  way_to_heart: string;
  craziest_travel_story: string;
  weirdest_gift: string;
  
  // Social
  social_link_1: string;
  social_link_2: string;
};

type SaveStatus = "saved" | "saving" | "unsaved" | "error" | "idle";

// Helper to convert total inches to feet and inches
const inchesToFeetAndInches = (totalInches: number | null): { feet: number; inches: number } => {
  if (!totalInches) return { feet: 5, inches: 6 }; // Default 5'6"
  return {
    feet: Math.floor(totalInches / 12),
    inches: totalInches % 12,
  };
};

// Helper to convert feet and inches to total inches
const feetAndInchesToInches = (feet: number, inches: number): number => {
  return (feet * 12) + inches;
};

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lifeGoalOptions, setLifeGoalOptions] = useState<{key: string; label: string; category: string; description?: string}[]>([]);

  // Refs for autosave
  const lastSavedProfileRef = useRef<string>("");
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const lastAutosaveTimeRef = useRef<number>(0);
  const pendingChangesRef = useRef(false);
  const isSavingRef = useRef(false); // Track if a save is in progress to prevent overlapping

  // Form state
  const [profile, setProfile] = useState<ProfileState>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    looking_for: [],
    zodiac_sign: "",
    bio: "",
    looking_for_description: "",
    dating_intentions: "",
    height_feet: 5,
    height_inches: 6,
    body_type: "",
    ethnicity: [],
    city: "",
    state: "",
    country: "",
    zip_code: "",
    marital_status: "",
    religion: "",
    political_views: "",
    education: "",
    occupation: "",
    company: "",
    smoking: "",
    drinking: "",
    marijuana: "",
    exercise: "",
    languages: [],
    has_kids: "",
    wants_kids: "",
    pets: [],
    interests: [],
    life_goals: [],
    ideal_first_date: "",
    non_negotiables: "",
    worst_job: "",
    dream_job: "",
    nightclub_or_home: "",
    pet_peeves: "",
    after_work: "",
    way_to_heart: "",
    craziest_travel_story: "",
    weirdest_gift: "",
    social_link_1: "",
    social_link_2: "",
  });

  // Check if profile has changed from last saved state
  const hasChanges = useCallback(() => {
    const currentJson = JSON.stringify(profile);
    return currentJson !== lastSavedProfileRef.current;
  }, [profile]);

  // Save function - isAutosave=true means silent background save with no UI disruption
  const performSave = useCallback(async (isAutosave = false) => {
    if (!hasChanges()) {
      return true;
    }

    // Prevent overlapping saves
    if (isSavingRef.current) {
      return false;
    }

    isSavingRef.current = true;

    // Only update UI for manual saves - autosave is completely silent
    if (!isAutosave) {
      setSaving(true);
      setSaveStatus("saving");
      setError("");
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      isSavingRef.current = false;
      router.push("/login");
      return false;
    }

    // Convert height from feet+inches to total inches
    const totalHeightInches = feetAndInchesToInches(profile.height_feet, profile.height_inches);

    const profileData = {
      user_id: user.id,
      // Basic Info
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      date_of_birth: profile.date_of_birth || null,
      gender: profile.gender || null,
      looking_for: profile.looking_for.length > 0 ? profile.looking_for : null,
      zodiac_sign: profile.zodiac_sign || null,
      bio: profile.bio || null,
      looking_for_description: profile.looking_for_description || null,
      dating_intentions: profile.dating_intentions || null,
      // Physical
      height_inches: totalHeightInches || null,
      body_type: profile.body_type || null,
      ethnicity: profile.ethnicity.length > 0 ? profile.ethnicity : null,
      // Location
      city: profile.city || null,
      state: profile.state || null,
      country: profile.country || null,
      zip_code: profile.zip_code || null,
      // Lifestyle
      marital_status: profile.marital_status || null,
      religion: profile.religion || null,
      political_views: profile.political_views || null,
      education: profile.education || null,
      occupation: profile.occupation || null,
      company: profile.company || null,
      smoking: profile.smoking || null,
      drinking: profile.drinking || null,
      marijuana: profile.marijuana || null,
      exercise: profile.exercise || null,
      languages: profile.languages.length > 0 ? profile.languages : null,
      // Family
      has_kids: profile.has_kids || null,
      wants_kids: profile.wants_kids || null,
      pets: profile.pets.length > 0 ? profile.pets : null,
      // Interests
      interests: profile.interests.length > 0 ? profile.interests : null,
      // Life Goals
      life_goals: profile.life_goals.length > 0 ? profile.life_goals : null,
      // Prompts
      ideal_first_date: profile.ideal_first_date || null,
      non_negotiables: profile.non_negotiables || null,
      worst_job: profile.worst_job || null,
      dream_job: profile.dream_job || null,
      nightclub_or_home: profile.nightclub_or_home || null,
      pet_peeves: profile.pet_peeves || null,
      after_work: profile.after_work || null,
      way_to_heart: profile.way_to_heart || null,
      craziest_travel_story: profile.craziest_travel_story || null,
      weirdest_gift: profile.weirdest_gift || null,
      // Social
      social_link_1: profile.social_link_1 || null,
      social_link_2: profile.social_link_2 || null,
    };

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "user_id" });

    isSavingRef.current = false;

    if (upsertError) {
      // Only show error for manual saves
      if (!isAutosave) {
        setError(upsertError.message);
        setSaveStatus("error");
        setSaving(false);
      }
      return false;
    }

    // Update tracking refs
    lastSavedProfileRef.current = JSON.stringify(profile);
    lastAutosaveTimeRef.current = Date.now();
    pendingChangesRef.current = false;
    
    // Only update UI for manual saves
    if (!isAutosave) {
      setLastSaved(new Date());
      setSaveStatus("saved");
      setSuccess("Profile saved successfully!");
      setSaving(false);
      // Redirect to profile view page after manual save
      setTimeout(() => {
        router.push("/profile");
      }, 1000);
    }

    return true;
  }, [profile, hasChanges, router]);

  // Manual save handler - cancels any pending autosave and performs a full save with UI feedback
  const handleSave = useCallback(async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    pendingChangesRef.current = false;
    await performSave(false);
  }, [performSave]);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load life goal options
  useEffect(() => {
    const fetchLifeGoals = async () => {
      try {
        const response = await fetch("/api/life-goals");
        const data = await response.json();
        if (data.success && data.data?.goals) {
          setLifeGoalOptions(data.data.goals.map((g: {key: string; label: string; category: string; description?: string}) => ({
            key: g.key,
            label: g.label,
            category: g.category,
            description: g.description,
          })));
        }
      } catch (error) {
        console.error("Error fetching life goals:", error);
      }
    };
    fetchLifeGoals();
  }, []);

  // Auto-calculate zodiac sign when date of birth changes
  useEffect(() => {
    if (profile.date_of_birth) {
      const calculatedZodiac = getZodiacFromDate(profile.date_of_birth);
      if (calculatedZodiac && calculatedZodiac !== profile.zodiac_sign) {
        setProfile(prev => ({ ...prev, zodiac_sign: calculatedZodiac }));
      }
    }
  }, [profile.date_of_birth]);

  const loadProfile = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingProfile) {
      const { feet, inches } = inchesToFeetAndInches(existingProfile.height_inches);
      
      const loadedProfile: ProfileState = {
        first_name: existingProfile.first_name || "",
        last_name: existingProfile.last_name || "",
        date_of_birth: existingProfile.date_of_birth || "",
        gender: existingProfile.gender || "",
        looking_for: existingProfile.looking_for || [],
        zodiac_sign: existingProfile.zodiac_sign || "",
        bio: existingProfile.bio || "",
        looking_for_description: existingProfile.looking_for_description || "",
        dating_intentions: existingProfile.dating_intentions || "",
        height_feet: feet,
        height_inches: inches,
        body_type: existingProfile.body_type || "",
        ethnicity: existingProfile.ethnicity || [],
        city: existingProfile.city || "",
        state: existingProfile.state || "",
        country: existingProfile.country || "",
        zip_code: existingProfile.zip_code || "",
        marital_status: existingProfile.marital_status || "",
        religion: existingProfile.religion || "",
        political_views: existingProfile.political_views || "",
        education: existingProfile.education || "",
        occupation: existingProfile.occupation || "",
        company: existingProfile.company || "",
        smoking: existingProfile.smoking || "",
        drinking: existingProfile.drinking || "",
        marijuana: existingProfile.marijuana || "",
        exercise: existingProfile.exercise || "",
        languages: existingProfile.languages || [],
        has_kids: existingProfile.has_kids || "",
        wants_kids: existingProfile.wants_kids || "",
        pets: existingProfile.pets || [],
        interests: existingProfile.interests || [],
        life_goals: existingProfile.life_goals || [],
        ideal_first_date: existingProfile.ideal_first_date || "",
        non_negotiables: existingProfile.non_negotiables || "",
        worst_job: existingProfile.worst_job || "",
        dream_job: existingProfile.dream_job || "",
        nightclub_or_home: existingProfile.nightclub_or_home || "",
        pet_peeves: existingProfile.pet_peeves || "",
        after_work: existingProfile.after_work || "",
        way_to_heart: existingProfile.way_to_heart || "",
        craziest_travel_story: existingProfile.craziest_travel_story || "",
        weirdest_gift: existingProfile.weirdest_gift || "",
        social_link_1: existingProfile.social_link_1 || "",
        social_link_2: existingProfile.social_link_2 || "",
      };
      setProfile(loadedProfile);
      lastSavedProfileRef.current = JSON.stringify(loadedProfile);
    } else {
      lastSavedProfileRef.current = JSON.stringify(profile);
    }

    setLoading(false);
    isInitialLoadRef.current = false;
  };

  // Silent autosave function - respects minimum interval, completely non-intrusive
  const attemptSilentAutosave = useCallback(() => {
    if (isInitialLoadRef.current || loading || isSavingRef.current) {
      return;
    }

    if (!hasChanges()) {
      return;
    }

    const now = Date.now();
    const timeSinceLastSave = now - lastAutosaveTimeRef.current;

    // Only autosave if minimum interval has passed
    if (timeSinceLastSave >= AUTOSAVE_MIN_INTERVAL) {
      performSave(true);
    } else {
      // Schedule save for when interval allows
      pendingChangesRef.current = true;
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      const timeUntilAllowed = AUTOSAVE_MIN_INTERVAL - timeSinceLastSave;
      autosaveTimerRef.current = setTimeout(() => {
        if (pendingChangesRef.current && hasChanges()) {
          performSave(true);
        }
      }, timeUntilAllowed);
    }
  }, [loading, hasChanges, performSave]);

  // Track changes for status indicator only (no auto-triggering saves)
  useEffect(() => {
    if (isInitialLoadRef.current || loading) {
      return;
    }

    if (hasChanges()) {
      setSaveStatus("unsaved");
      pendingChangesRef.current = true;
    }
  }, [profile, loading, hasChanges]);

  // Autosave on blur (when user leaves a field) - but only after idle period
  useEffect(() => {
    if (isInitialLoadRef.current || loading) {
      return;
    }

    const handleBlur = (e: FocusEvent) => {
      // Only trigger if the user is moving away from an input/select/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        // Schedule save after idle delay (user has stopped interacting)
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
        }
        autosaveTimerRef.current = setTimeout(() => {
          attemptSilentAutosave();
        }, IDLE_SAVE_DELAY);
      }
    };

    document.addEventListener('focusout', handleBlur);
    return () => document.removeEventListener('focusout', handleBlur);
  }, [loading, attemptSilentAutosave]);

  // Autosave when page visibility changes (tab switching, minimizing)
  useEffect(() => {
    if (isInitialLoadRef.current || loading) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasChanges()) {
        // Save immediately when user leaves the tab
        performSave(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loading, hasChanges, performSave]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges()) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  // Toggle handlers for multi-select fields
  const toggleArrayField = (field: keyof ProfileState, value: string) => {
    setProfile(prev => {
      const currentArray = prev[field] as string[];
      return {
        ...prev,
        [field]: currentArray.includes(value)
          ? currentArray.filter(i => i !== value)
          : [...currentArray, value],
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const getRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const SaveStatusIndicator = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <div className="flex items-center text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving...
          </div>
        );
      case "saved":
        return (
          <div className="flex items-center text-sm text-green-600">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved {lastSaved ? getRelativeTime(lastSaved) : ""}
          </div>
        );
      case "unsaved":
        return (
          <div className="flex items-center text-sm text-amber-600">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Unsaved changes
          </div>
        );
      case "error":
        return (
          <div className="flex items-center text-sm text-red-600">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Save failed
          </div>
        );
      default:
        return null;
    }
  };

  // Reusable select component
  const SelectField = ({ 
    label, 
    value, 
    onChange, 
    options 
  }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void; 
    options: readonly { value: string; label: string }[];
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  // Reusable multi-select chips component
  const MultiSelectChips = ({ 
    label, 
    selected, 
    options, 
    onToggle 
  }: { 
    label: string; 
    selected: string[]; 
    options: readonly { value: string; label: string }[];
    onToggle: (value: string) => void;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selected.includes(opt.value)
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <div className="mt-1">
            <SaveStatusIndicator />
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href="/profile/gallery"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
          >
            Manage Gallery
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || saveStatus === "saving"}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving || saveStatus === "saving" ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={profile.first_name}
                onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={profile.last_name}
                onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={profile.date_of_birth}
                onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <SelectField
              label="Gender"
              value={profile.gender}
              onChange={(value) => setProfile(prev => ({ ...prev, gender: value }))}
              options={GENDER_OPTIONS}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zodiac Sign <span className="text-xs text-gray-400">(auto-calculated from DOB)</span>
              </label>
              <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                {profile.zodiac_sign 
                  ? ZODIAC_OPTIONS.find(z => z.value === profile.zodiac_sign)?.label || profile.zodiac_sign
                  : 'Enter date of birth to calculate'}
              </div>
            </div>
            <SelectField
              label="Marital Status"
              value={profile.marital_status}
              onChange={(value) => setProfile(prev => ({ ...prev, marital_status: value }))}
              options={MARITAL_STATUS_OPTIONS}
            />
            <SelectField
              label="Dating Intentions"
              value={profile.dating_intentions}
              onChange={(value) => setProfile(prev => ({ ...prev, dating_intentions: value }))}
              options={DATING_INTENTIONS_OPTIONS}
            />
          </div>

          <div className="mt-4">
            <MultiSelectChips
              label="Looking For"
              selected={profile.looking_for}
              options={GENDER_OPTIONS}
              onToggle={(value) => toggleArrayField("looking_for", value)}
            />
          </div>
        </section>

        {/* Physical */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Physical</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Height with separate feet and inches dropdowns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
              <div className="flex gap-2">
                <select
                  value={profile.height_feet}
                  onChange={(e) => setProfile(prev => ({ ...prev, height_feet: parseInt(e.target.value) }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {[4, 5, 6, 7].map(f => (
                    <option key={f} value={f}>{f}&apos;</option>
                  ))}
                </select>
                <select
                  value={profile.height_inches}
                  onChange={(e) => setProfile(prev => ({ ...prev, height_inches: parseInt(e.target.value) }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => (
                    <option key={i} value={i}>{i}&quot;</option>
                  ))}
                </select>
              </div>
            </div>
            <SelectField
              label="Body Type"
              value={profile.body_type}
              onChange={(value) => setProfile(prev => ({ ...prev, body_type: value }))}
              options={BODY_TYPE_OPTIONS}
            />
          </div>
          
          <div className="mt-4">
            <MultiSelectChips
              label="Ethnicity"
              selected={profile.ethnicity}
              options={ETHNICITY_OPTIONS}
              onToggle={(value) => toggleArrayField("ethnicity", value)}
            />
          </div>
        </section>

        {/* Location */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={profile.state}
                onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <SelectField
              label="Country"
              value={profile.country}
              onChange={(value) => setProfile(prev => ({ ...prev, country: value }))}
              options={COUNTRY_OPTIONS}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
              <input
                type="text"
                value={profile.zip_code}
                onChange={(e) => setProfile(prev => ({ ...prev, zip_code: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </section>

        {/* Lifestyle */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lifestyle</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
              <input
                type="text"
                value={profile.occupation}
                onChange={(e) => setProfile(prev => ({ ...prev, occupation: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <SelectField
              label="Education"
              value={profile.education}
              onChange={(value) => setProfile(prev => ({ ...prev, education: value }))}
              options={EDUCATION_OPTIONS}
            />
            <SelectField
              label="Religion"
              value={profile.religion}
              onChange={(value) => setProfile(prev => ({ ...prev, religion: value }))}
              options={RELIGION_OPTIONS}
            />
            <SelectField
              label="Political Views"
              value={profile.political_views}
              onChange={(value) => setProfile(prev => ({ ...prev, political_views: value }))}
              options={POLITICAL_OPTIONS}
            />
            <SelectField
              label="Exercise"
              value={profile.exercise}
              onChange={(value) => setProfile(prev => ({ ...prev, exercise: value }))}
              options={EXERCISE_OPTIONS}
            />
          </div>

          <div className="mt-4">
            <MultiSelectChips
              label="Languages"
              selected={profile.languages}
              options={LANGUAGE_OPTIONS}
              onToggle={(value) => toggleArrayField("languages", value)}
            />
          </div>
        </section>

        {/* Habits */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Habits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField
              label="Smoking"
              value={profile.smoking}
              onChange={(value) => setProfile(prev => ({ ...prev, smoking: value }))}
              options={SMOKING_OPTIONS}
            />
            <SelectField
              label="Drinking"
              value={profile.drinking}
              onChange={(value) => setProfile(prev => ({ ...prev, drinking: value }))}
              options={DRINKING_OPTIONS}
            />
            <SelectField
              label="Marijuana"
              value={profile.marijuana}
              onChange={(value) => setProfile(prev => ({ ...prev, marijuana: value }))}
              options={MARIJUANA_OPTIONS}
            />
          </div>
        </section>

        {/* Family */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Family</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Do you have kids?"
              value={profile.has_kids}
              onChange={(value) => setProfile(prev => ({ ...prev, has_kids: value }))}
              options={HAS_KIDS_OPTIONS}
            />
            <SelectField
              label="Do you want kids?"
              value={profile.wants_kids}
              onChange={(value) => setProfile(prev => ({ ...prev, wants_kids: value }))}
              options={WANTS_KIDS_OPTIONS}
            />
          </div>
          
          <div className="mt-4">
            <MultiSelectChips
              label="Pets"
              selected={profile.pets}
              options={PETS_OPTIONS}
              onToggle={(value) => toggleArrayField("pets", value)}
            />
          </div>
        </section>

        {/* Interests */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Interests</h2>
          <MultiSelectChips
            label="Select your interests"
            selected={profile.interests}
            options={INTEREST_OPTIONS}
            onToggle={(value) => toggleArrayField("interests", value)}
          />
        </section>

        {/* Life Goals */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Life Goals</h2>
          <p className="text-sm text-gray-500 mb-4">
            Select up to 10 life goals to help find matches with shared ambitions.
          </p>
          {lifeGoalOptions.length > 0 ? (
            <>
              {/* Group by category */}
              {["career", "adventure", "personal", "impact"].map((category) => {
                const categoryGoals = lifeGoalOptions.filter((g) => g.category === category);
                if (categoryGoals.length === 0) return null;
                const categoryLabels: Record<string, string> = {
                  career: "Career & Achievement",
                  adventure: "Adventure & Travel",
                  personal: "Personal & Lifestyle",
                  impact: "Impact & Legacy",
                };
                return (
                  <div key={category} className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">{categoryLabels[category]}</h3>
                    <div className="flex flex-wrap gap-2">
                      {categoryGoals.map((goal) => {
                        const isSelected = profile.life_goals.includes(goal.key);
                        const canSelect = profile.life_goals.length < 10 || isSelected;
                        return (
                          <button
                            key={goal.key}
                            type="button"
                            onClick={() => {
                              if (!canSelect && !isSelected) return;
                              toggleArrayField("life_goals", goal.key);
                            }}
                            disabled={!canSelect && !isSelected}
                            title={goal.description}
                            className={`px-3 py-2 text-sm rounded-full border transition-colors ${
                              isSelected
                                ? "bg-indigo-100 border-indigo-500 text-indigo-700"
                                : canSelect
                                ? "border-gray-300 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                                : "border-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {goal.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-gray-400 mt-2">
                {profile.life_goals.length}/10 selected
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Loading life goals...</p>
          )}
        </section>

        {/* Voice & Video Prompts - Coming Soon */}
        <section className="bg-white rounded-xl shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3 bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">
            Coming Soon
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Voice & Video Prompts</h2>
          <p className="text-sm text-gray-500 mb-4">
            Add a personal touch to your profile with voice and video introductions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60 pointer-events-none">
            {/* Voice Prompt Placeholder */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-pink-100 to-indigo-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Voice Prompt</h3>
              <p className="text-xs text-gray-500 mb-3">Record a 30-second voice intro</p>
              <button className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm cursor-not-allowed">
                Record Voice
              </button>
            </div>
            
            {/* Video Intro Placeholder */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-pink-100 to-indigo-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Video Introduction</h3>
              <p className="text-xs text-gray-500 mb-3">Upload a 30-60 second video</p>
              <button className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm cursor-not-allowed">
                Upload Video
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Voice and video prompts help you stand out and make better connections.
            {/* TODO: Implement voice recording with Web Audio API */}
            {/* TODO: Implement video upload with duration validation (max 60 seconds) */}
          </p>
        </section>

        {/* About Me */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About Me</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What I&apos;m Looking For</label>
              <textarea
                value={profile.looking_for_description}
                onChange={(e) => setProfile(prev => ({ ...prev, looking_for_description: e.target.value }))}
                rows={3}
                placeholder="Describe your ideal match..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </section>

        {/* Profile Prompts */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Get to Know Me</h2>
          <p className="text-sm text-gray-500 mb-4">Answer these prompts to help others learn more about you.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">My ideal first date starts with... and ends with...</label>
              <textarea
                value={profile.ideal_first_date}
                onChange={(e) => setProfile(prev => ({ ...prev, ideal_first_date: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">My top non-negotiables</label>
              <textarea
                value={profile.non_negotiables}
                onChange={(e) => setProfile(prev => ({ ...prev, non_negotiables: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">The way to my heart is through...</label>
              <textarea
                value={profile.way_to_heart}
                onChange={(e) => setProfile(prev => ({ ...prev, way_to_heart: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">After work, you can find me...</label>
              <textarea
                value={profile.after_work}
                onChange={(e) => setProfile(prev => ({ ...prev, after_work: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nightclub or night at home?</label>
              <input
                type="text"
                value={profile.nightclub_or_home}
                onChange={(e) => setProfile(prev => ({ ...prev, nightclub_or_home: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">My pet peeves</label>
              <textarea
                value={profile.pet_peeves}
                onChange={(e) => setProfile(prev => ({ ...prev, pet_peeves: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Craziest travel story</label>
              <textarea
                value={profile.craziest_travel_story}
                onChange={(e) => setProfile(prev => ({ ...prev, craziest_travel_story: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weirdest gift I&apos;ve received</label>
              <textarea
                value={profile.weirdest_gift}
                onChange={(e) => setProfile(prev => ({ ...prev, weirdest_gift: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">The worst job I ever had</label>
              <textarea
                value={profile.worst_job}
                onChange={(e) => setProfile(prev => ({ ...prev, worst_job: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">The job I&apos;d do for no money</label>
              <textarea
                value={profile.dream_job}
                onChange={(e) => setProfile(prev => ({ ...prev, dream_job: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </section>

        {/* Social Links */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Social Link 1</label>
              <input
                type="url"
                value={profile.social_link_1}
                onChange={(e) => setProfile(prev => ({ ...prev, social_link_1: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Social Link 2</label>
              <input
                type="url"
                value={profile.social_link_2}
                onChange={(e) => setProfile(prev => ({ ...prev, social_link_2: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </section>

        {/* Save Button (Bottom) */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
