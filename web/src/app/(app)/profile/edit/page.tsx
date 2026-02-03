"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VoiceRecorder, VideoRecorder, VerificationSelfieCapture, ProfileCompletionBadge } from "@/components/profile";
import { getExtensionFromMimeType } from "@/hooks/useMediaPermissions";
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

/**
 * Verification Selfie Section
 * Handles its own state and API calls separately from the main profile form
 */
function VerificationSelfieSection() {
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing verification selfie
  useEffect(() => {
    const loadSelfie = async () => {
      try {
        const res = await fetch("/api/users/me/verification-selfie");
        const data = await res.json();

        if (data.success && data.data) {
          setSelfieUrl(data.data.verificationSelfieUrl || null);
        }
      } catch (err) {
        console.error("Failed to load verification selfie:", err);
        setError("Failed to load verification selfie");
      } finally {
        setLoading(false);
      }
    };

    loadSelfie();
  }, []);

  // Handle selfie save
  const handleSave = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("file", blob, "verification-selfie.jpg");

    const response = await fetch("/api/users/me/verification-selfie", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.msg || "Failed to save verification selfie");
    }

    setSelfieUrl(data.data.verificationSelfieUrl);
  };

  // Handle selfie delete
  const handleDelete = async () => {
    const response = await fetch("/api/users/me/verification-selfie", {
      method: "DELETE",
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.msg || "Failed to delete verification selfie");
    }

    setSelfieUrl(null);
  };

  if (loading) {
    return (
      <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Verification Selfie</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Verification Selfie</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Take a selfie to verify your identity. This helps build trust with other members.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="max-w-sm mx-auto">
        <VerificationSelfieCapture
          existingUrl={selfieUrl}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
        Your selfie is stored securely and only used for verification purposes.
      </p>
    </section>
  );
}

/**
 * Voice & Video Prompts Section
 * Handles its own state and API calls separately from the main profile form
 */
function VoiceVideoSection() {
  const [voicePromptUrl, setVoicePromptUrl] = useState<string | null>(null);
  const [voicePromptDuration, setVoicePromptDuration] = useState<number | null>(null);
  const [videoIntroUrl, setVideoIntroUrl] = useState<string | null>(null);
  const [videoIntroDuration, setVideoIntroDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing voice/video data
  useEffect(() => {
    const loadMediaData = async () => {
      try {
        // Fetch both in parallel
        const [voiceRes, videoRes] = await Promise.all([
          fetch("/api/users/me/voice-prompt"),
          fetch("/api/users/me/video-intro"),
        ]);

        const voiceData = await voiceRes.json();
        const videoData = await videoRes.json();

        if (voiceData.success && voiceData.data) {
          setVoicePromptUrl(voiceData.data.voicePromptUrl || null);
          setVoicePromptDuration(voiceData.data.durationSeconds || null);
        }

        if (videoData.success && videoData.data) {
          setVideoIntroUrl(videoData.data.videoIntroUrl || null);
          setVideoIntroDuration(videoData.data.durationSeconds || null);
        }
      } catch (err) {
        console.error("Failed to load voice/video data:", err);
        setError("Failed to load media data");
      } finally {
        setLoading(false);
      }
    };

    loadMediaData();
  }, []);

  // Handle voice prompt save
  const handleVoiceSave = async (blob: Blob, duration: number) => {
    const formData = new FormData();
    const ext = getExtensionFromMimeType(blob.type);
    formData.append("file", blob, `voice-prompt.${ext}`);
    formData.append("duration", duration.toString());

    const response = await fetch("/api/users/me/voice-prompt", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.msg || "Failed to save voice prompt");
    }

    setVoicePromptUrl(data.data.voicePromptUrl);
    setVoicePromptDuration(data.data.durationSeconds);
  };

  // Handle voice prompt delete
  const handleVoiceDelete = async () => {
    const response = await fetch("/api/users/me/voice-prompt", {
      method: "DELETE",
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.msg || "Failed to delete voice prompt");
    }

    setVoicePromptUrl(null);
    setVoicePromptDuration(null);
  };

  // Handle video intro save
  const handleVideoSave = async (blob: Blob, duration: number) => {
    const formData = new FormData();
    const ext = getExtensionFromMimeType(blob.type);
    formData.append("file", blob, `video-intro.${ext}`);
    formData.append("duration", duration.toString());

    const response = await fetch("/api/users/me/video-intro", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.msg || "Failed to save video intro");
    }

    setVideoIntroUrl(data.data.videoIntroUrl);
    setVideoIntroDuration(data.data.durationSeconds);
  };

  // Handle video intro delete
  const handleVideoDelete = async () => {
    const response = await fetch("/api/users/me/video-intro", {
      method: "DELETE",
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.msg || "Failed to delete video intro");
    }

    setVideoIntroUrl(null);
    setVideoIntroDuration(null);
  };

  if (loading) {
    return (
      <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Voice & Video Prompts</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Voice & Video Prompts</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Add a personal touch to your profile with voice and video introductions.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Voice Prompt */}
        <div className="border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Voice Prompt</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Record up to 30 seconds</p>
          </div>
          <VoiceRecorder
            existingUrl={voicePromptUrl}
            existingDuration={voicePromptDuration}
            onSave={handleVoiceSave}
            onDelete={handleVoiceDelete}
            maxDuration={30}
          />
        </div>

        {/* Video Intro */}
        <div className="border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Video Introduction</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Record or upload up to 60 seconds</p>
          </div>
          <VideoRecorder
            existingUrl={videoIntroUrl}
            existingDuration={videoIntroDuration}
            onSave={handleVideoSave}
            onDelete={handleVideoDelete}
            maxDuration={60}
          />
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
        Voice and video prompts help you stand out and make better connections.
      </p>
    </section>
  );
}

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
  
  // Location (order: Country, State, City)
  country: string;
  state: string;
  city: string;
  zip_code: string;
  hometown: string;
  
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
    country: "",
    state: "",
    city: "",
    zip_code: "",
    hometown: "",
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
      country: profile.country || null,
      state: profile.state || null,
      city: profile.city || null,
      zip_code: profile.zip_code || null,
      hometown: profile.hometown || null,
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

    return true;
  }, [profile, hasChanges, router]);

  // Manual save handler - cancels any pending autosave, saves if needed, and always navigates to profile
  const handleSaveAndContinue = useCallback(async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    pendingChangesRef.current = false;
    
    // If there are changes, save them first
    if (hasChanges()) {
      setSaving(true);
      setSaveStatus("saving");
      setError("");
      
      const success = await performSave(false);
      if (!success) {
        // performSave already handles error state, don't navigate on failure
        return;
      }
    }
    
    // Always navigate to profile view, even if no changes needed saving
    setSuccess("Profile saved!");
    setSaving(false);
    setSaveStatus("saved");
    router.push("/profile");
  }, [performSave, hasChanges, router]);

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
        country: existingProfile.country || "",
        state: existingProfile.state || "",
        city: existingProfile.city || "",
        zip_code: existingProfile.zip_code || "",
        hometown: existingProfile.hometown || "",
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
      <div className="flex items-center justify-center min-h-dvh bg-gray-50 dark:bg-neutral-950">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
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
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-4 w-4 mr-2 text-brand-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving...
          </div>
        );
      case "saved":
        return (
          <div className="flex items-center text-sm text-green-600 dark:text-green-400">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved {lastSaved ? getRelativeTime(lastSaved) : ""}
          </div>
        );
      case "unsaved":
        return (
          <div className="flex items-center text-sm text-amber-600 dark:text-amber-400">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Unsaved changes
          </div>
        );
      case "error":
        return (
          <div className="flex items-center text-sm text-red-600 dark:text-red-400">
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

  // Reusable select component with optional required indicator
  const SelectField = ({ 
    label, 
    value, 
    onChange, 
    options,
    required = false,
    id,
  }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void; 
    options: readonly { value: string; label: string }[];
    required?: boolean;
    id: string;
  }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-required={required}
        className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  // Reusable multi-select chips component with optional required indicator
  const MultiSelectChips = ({ 
    label, 
    selected, 
    options, 
    onToggle,
    required = false,
    id,
  }: { 
    label: string; 
    selected: string[]; 
    options: readonly { value: string; label: string }[];
    onToggle: (value: string) => void;
    required?: boolean;
    id: string;
  }) => (
    <fieldset>
      <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(required)</span>}
      </legend>
      <div 
        role="group" 
        aria-label={label}
        className="flex flex-wrap gap-2"
      >
        {options.map(opt => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              aria-pressed={isSelected}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 ${
                isSelected
                  ? "bg-brand-primary text-white shadow-sm"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 hover:shadow-sm"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6">
      {/* Compact Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {/* Left: Back + Title + Completion */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/profile"
            className="flex items-center justify-center w-8 h-8 -ml-1 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Back to profile"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit</h1>
          <ProfileCompletionBadge variant="compact" className="hidden sm:inline-flex" />
        </div>

        {/* Right: Action Buttons + Status */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block mr-1">
            <SaveStatusIndicator />
          </div>
          <Link
            href="/profile/gallery"
            className="px-3 py-1.5 text-sm font-medium text-brand-secondary border border-brand-secondary rounded-full hover:bg-brand-secondary hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-1"
          >
            Gallery
          </Link>
          <button
            onClick={handleSaveAndContinue}
            disabled={saving || saveStatus === "saving"}
            className="px-3 py-1.5 text-sm font-medium text-white bg-brand-primary rounded-full hover:bg-brand-primary-dark transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
          >
            {saving || saveStatus === "saving" ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6" aria-labelledby="basic-info-heading">
          <h2 id="basic-info-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name<span className="text-red-500 ml-1" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="first-name"
                type="text"
                value={profile.first_name}
                onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                aria-required="true"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name<span className="text-red-500 ml-1" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="last-name"
                type="text"
                value={profile.last_name}
                onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                aria-required="true"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="date-of-birth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth<span className="text-red-500 ml-1" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="date-of-birth"
                type="date"
                value={profile.date_of_birth}
                onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                aria-required="true"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <SelectField
              id="gender"
              label="Gender"
              value={profile.gender}
              onChange={(value) => setProfile(prev => ({ ...prev, gender: value }))}
              options={GENDER_OPTIONS}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zodiac Sign <span className="text-xs text-gray-400 dark:text-gray-500">(auto-calculated from DOB)</span>
              </label>
              <div className="w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300">
                {profile.zodiac_sign 
                  ? ZODIAC_OPTIONS.find(z => z.value === profile.zodiac_sign)?.label || profile.zodiac_sign
                  : 'Enter date of birth to calculate'}
              </div>
            </div>
            <SelectField
              id="marital-status"
              label="Marital Status"
              value={profile.marital_status}
              onChange={(value) => setProfile(prev => ({ ...prev, marital_status: value }))}
              options={MARITAL_STATUS_OPTIONS}
              required
            />
            <SelectField
              id="dating-intentions"
              label="Dating Intentions"
              value={profile.dating_intentions}
              onChange={(value) => setProfile(prev => ({ ...prev, dating_intentions: value }))}
              options={DATING_INTENTIONS_OPTIONS}
              required
            />
          </div>

          <div className="mt-4">
            <MultiSelectChips
              id="looking-for"
              label="I'm interested in"
              selected={profile.looking_for}
              options={GENDER_OPTIONS}
              onToggle={(value) => toggleArrayField("looking_for", value)}
              required
            />
          </div>
        </section>

        {/* Physical */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Physical</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Height with separate feet and inches dropdowns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height</label>
              <div className="flex gap-2">
                <select
                  value={profile.height_feet}
                  onChange={(e) => setProfile(prev => ({ ...prev, height_feet: parseInt(e.target.value) }))}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                >
                  {[4, 5, 6, 7].map(f => (
                    <option key={f} value={f}>{f}&apos;</option>
                  ))}
                </select>
                <select
                  value={profile.height_inches}
                  onChange={(e) => setProfile(prev => ({ ...prev, height_inches: parseInt(e.target.value) }))}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => (
                    <option key={i} value={i}>{i}&quot;</option>
                  ))}
                </select>
              </div>
            </div>
            <SelectField
              id="body-type"
              label="Body Type"
              value={profile.body_type}
              onChange={(value) => setProfile(prev => ({ ...prev, body_type: value }))}
              options={BODY_TYPE_OPTIONS}
            />
          </div>
          
          <div className="mt-4">
            <MultiSelectChips
              id="ethnicity"
              label="Ethnicity"
              selected={profile.ethnicity}
              options={ETHNICITY_OPTIONS}
              onToggle={(value) => toggleArrayField("ethnicity", value)}
            />
          </div>
        </section>

        {/* Location */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              id="country"
              label="Country"
              value={profile.country}
              onChange={(value) => setProfile(prev => ({ ...prev, country: value }))}
              options={COUNTRY_OPTIONS}
            />
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State/Province</label>
              <input
                id="state"
                type="text"
                value={profile.state}
                onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
              <input
                id="city"
                type="text"
                value={profile.city}
                onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="zip-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ZIP Code</label>
              <input
                id="zip-code"
                type="text"
                value={profile.zip_code}
                onChange={(e) => setProfile(prev => ({ ...prev, zip_code: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="hometown" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hometown</label>
              <input
                id="hometown"
                type="text"
                value={profile.hometown}
                onChange={(e) => setProfile(prev => ({ ...prev, hometown: e.target.value }))}
                placeholder="Where did you grow up?"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
          </div>
        </section>

        {/* Lifestyle */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6" aria-labelledby="lifestyle-heading">
          <h2 id="lifestyle-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Lifestyle</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Occupation</label>
              <input
                id="occupation"
                type="text"
                value={profile.occupation}
                onChange={(e) => setProfile(prev => ({ ...prev, occupation: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
              <input
                id="company"
                type="text"
                value={profile.company}
                onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <SelectField
              id="education"
              label="Education"
              value={profile.education}
              onChange={(value) => setProfile(prev => ({ ...prev, education: value }))}
              options={EDUCATION_OPTIONS}
            />
            <SelectField
              id="religion"
              label="Religion"
              value={profile.religion}
              onChange={(value) => setProfile(prev => ({ ...prev, religion: value }))}
              options={RELIGION_OPTIONS}
            />
            <SelectField
              id="political-views"
              label="Political Views"
              value={profile.political_views}
              onChange={(value) => setProfile(prev => ({ ...prev, political_views: value }))}
              options={POLITICAL_OPTIONS}
            />
            <SelectField
              id="exercise"
              label="Exercise"
              value={profile.exercise}
              onChange={(value) => setProfile(prev => ({ ...prev, exercise: value }))}
              options={EXERCISE_OPTIONS}
            />
          </div>

          <div className="mt-4">
            <MultiSelectChips
              id="languages"
              label="Languages"
              selected={profile.languages}
              options={LANGUAGE_OPTIONS}
              onToggle={(value) => toggleArrayField("languages", value)}
            />
          </div>
        </section>

        {/* Habits */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Habits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField
              id="smoking"
              label="Smoking"
              value={profile.smoking}
              onChange={(value) => setProfile(prev => ({ ...prev, smoking: value }))}
              options={SMOKING_OPTIONS}
            />
            <SelectField
              id="drinking"
              label="Drinking"
              value={profile.drinking}
              onChange={(value) => setProfile(prev => ({ ...prev, drinking: value }))}
              options={DRINKING_OPTIONS}
            />
            <SelectField
              id="marijuana"
              label="Marijuana"
              value={profile.marijuana}
              onChange={(value) => setProfile(prev => ({ ...prev, marijuana: value }))}
              options={MARIJUANA_OPTIONS}
            />
          </div>
        </section>

        {/* Family */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Family</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              id="has-kids"
              label="Do you have children?"
              value={profile.has_kids}
              onChange={(value) => setProfile(prev => ({ ...prev, has_kids: value }))}
              options={HAS_KIDS_OPTIONS}
            />
            <SelectField
              id="wants-kids"
              label="Do you want children?"
              value={profile.wants_kids}
              onChange={(value) => setProfile(prev => ({ ...prev, wants_kids: value }))}
              options={WANTS_KIDS_OPTIONS}
            />
          </div>
          
          <div className="mt-4">
            <MultiSelectChips
              id="pets"
              label="Pets"
              selected={profile.pets}
              options={PETS_OPTIONS}
              onToggle={(value) => toggleArrayField("pets", value)}
            />
          </div>
        </section>

        {/* Interests */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6" aria-labelledby="interests-heading">
          <h2 id="interests-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Interests</h2>
          <MultiSelectChips
            id="interests"
            label="Select your interests"
            selected={profile.interests}
            options={INTEREST_OPTIONS}
            onToggle={(value) => toggleArrayField("interests", value)}
          />
        </section>

        {/* Life Goals */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Life Goals</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{categoryLabels[category]}</h3>
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
                            className={`px-3 py-2 text-sm rounded-full border transition-all duration-200 ${
                              isSelected
                                ? "bg-brand-primary/10 dark:bg-brand-primary/20 border-brand-primary text-brand-primary font-medium"
                                : canSelect
                                ? "border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 hover:border-brand-primary/50 hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10"
                                : "border-gray-200 dark:border-neutral-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
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
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {profile.life_goals.length}/10 selected
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">Loading life goals...</p>
          )}
        </section>

        {/* Verification Selfie */}
        <VerificationSelfieSection />

        {/* Voice & Video Prompts */}
        <VoiceVideoSection />

        {/* About Me */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6" aria-labelledby="about-me-heading">
          <h2 id="about-me-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">About Me</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
              <textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="looking-for-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">What I&apos;m Looking For</label>
              <textarea
                id="looking-for-description"
                value={profile.looking_for_description}
                onChange={(e) => setProfile(prev => ({ ...prev, looking_for_description: e.target.value }))}
                rows={3}
                placeholder="Describe your ideal match..."
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
          </div>
        </section>

        {/* Profile Prompts */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6" aria-labelledby="prompts-heading">
          <h2 id="prompts-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Get to Know Me</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Answer these prompts to help others learn more about you.</p>
          <div className="space-y-4">
            <div>
              <label htmlFor="ideal-first-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">My ideal first date starts with... and ends with...</label>
              <textarea
                id="ideal-first-date"
                value={profile.ideal_first_date}
                onChange={(e) => setProfile(prev => ({ ...prev, ideal_first_date: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="non-negotiables" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">My top non-negotiables</label>
              <textarea
                id="non-negotiables"
                value={profile.non_negotiables}
                onChange={(e) => setProfile(prev => ({ ...prev, non_negotiables: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="way-to-heart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">The way to my heart is through...</label>
              <textarea
                id="way-to-heart"
                value={profile.way_to_heart}
                onChange={(e) => setProfile(prev => ({ ...prev, way_to_heart: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="after-work" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">After work, you can find me...</label>
              <textarea
                id="after-work"
                value={profile.after_work}
                onChange={(e) => setProfile(prev => ({ ...prev, after_work: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="nightclub-or-home" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nightclub or night at home?</label>
              <input
                id="nightclub-or-home"
                type="text"
                value={profile.nightclub_or_home}
                onChange={(e) => setProfile(prev => ({ ...prev, nightclub_or_home: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="pet-peeves" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">My pet peeves</label>
              <textarea
                id="pet-peeves"
                value={profile.pet_peeves}
                onChange={(e) => setProfile(prev => ({ ...prev, pet_peeves: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="craziest-travel-story" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Craziest travel story</label>
              <textarea
                id="craziest-travel-story"
                value={profile.craziest_travel_story}
                onChange={(e) => setProfile(prev => ({ ...prev, craziest_travel_story: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="weirdest-gift" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weirdest gift I&apos;ve received</label>
              <textarea
                id="weirdest-gift"
                value={profile.weirdest_gift}
                onChange={(e) => setProfile(prev => ({ ...prev, weirdest_gift: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="worst-job" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">The worst job I ever had</label>
              <textarea
                id="worst-job"
                value={profile.worst_job}
                onChange={(e) => setProfile(prev => ({ ...prev, worst_job: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="dream-job" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">The job I&apos;d do for no money</label>
              <textarea
                id="dream-job"
                value={profile.dream_job}
                onChange={(e) => setProfile(prev => ({ ...prev, dream_job: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
          </div>
        </section>

        {/* Social Links */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6" aria-labelledby="social-links-heading">
          <h2 id="social-links-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Social Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="social-link-1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Social Link 1</label>
              <input
                id="social-link-1"
                type="url"
                value={profile.social_link_1}
                onChange={(e) => setProfile(prev => ({ ...prev, social_link_1: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
            <div>
              <label htmlFor="social-link-2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Social Link 2</label>
              <input
                id="social-link-2"
                type="url"
                value={profile.social_link_2}
                onChange={(e) => setProfile(prev => ({ ...prev, social_link_2: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
              />
            </div>
          </div>
        </section>

        {/* Save Button (Bottom) */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveAndContinue}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white font-medium rounded-lg hover:from-brand-primary-light hover:to-brand-primary transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            {saving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
