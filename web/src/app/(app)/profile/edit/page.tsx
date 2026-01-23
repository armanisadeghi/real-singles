"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INTERESTS = [
  "Travel", "Music", "Movies", "Reading", "Fitness", "Cooking", "Photography",
  "Art", "Gaming", "Sports", "Dancing", "Hiking", "Yoga", "Wine", "Coffee",
  "Dogs", "Cats", "Fashion", "Technology", "Nature", "Beach", "Mountains"
];

const BODY_TYPES = ["slim", "athletic", "average", "curvy", "plus-size"];
const SMOKING = ["never", "occasionally", "regularly"];
const DRINKING = ["never", "socially", "regularly"];
const EXERCISE = ["never", "sometimes", "regularly", "daily"];
const WANTS_KIDS = ["yes", "no", "maybe", "have_and_want_more"];
const GENDERS = ["male", "female", "non-binary", "other"];

const AUTOSAVE_DELAY = 5000; // 5 seconds

type ProfileState = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  looking_for: string[];
  height_inches: string;
  body_type: string;
  city: string;
  state: string;
  country: string;
  occupation: string;
  education: string;
  religion: string;
  smoking: string;
  drinking: string;
  exercise: string;
  has_kids: boolean;
  wants_kids: string;
  interests: string[];
  bio: string;
  looking_for_description: string;
};

type SaveStatus = "saved" | "saving" | "unsaved" | "error" | "idle";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Refs for autosave
  const lastSavedProfileRef = useRef<string>("");
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Form state
  const [profile, setProfile] = useState<ProfileState>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    looking_for: [],
    height_inches: "",
    body_type: "",
    city: "",
    state: "",
    country: "",
    occupation: "",
    education: "",
    religion: "",
    smoking: "",
    drinking: "",
    exercise: "",
    has_kids: false,
    wants_kids: "",
    interests: [],
    bio: "",
    looking_for_description: "",
  });

  // Check if profile has changed from last saved state
  const hasChanges = useCallback(() => {
    const currentJson = JSON.stringify(profile);
    return currentJson !== lastSavedProfileRef.current;
  }, [profile]);

  // Save function
  const performSave = useCallback(async (isAutosave = false) => {
    // Don't save if no changes
    if (!hasChanges()) {
      return true;
    }

    if (!isAutosave) {
      setSaving(true);
    }
    setSaveStatus("saving");
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/login");
      return false;
    }

    const profileData = {
      user_id: user.id,
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      date_of_birth: profile.date_of_birth || null,
      gender: profile.gender || null,
      looking_for: profile.looking_for.length > 0 ? profile.looking_for : null,
      height_inches: profile.height_inches ? parseInt(profile.height_inches) : null,
      body_type: profile.body_type || null,
      city: profile.city || null,
      state: profile.state || null,
      country: profile.country || null,
      occupation: profile.occupation || null,
      education: profile.education || null,
      religion: profile.religion || null,
      smoking: profile.smoking || null,
      drinking: profile.drinking || null,
      exercise: profile.exercise || null,
      has_kids: profile.has_kids,
      wants_kids: profile.wants_kids || null,
      interests: profile.interests.length > 0 ? profile.interests : null,
      bio: profile.bio || null,
      looking_for_description: profile.looking_for_description || null,
    };

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "user_id" });

    if (upsertError) {
      setError(upsertError.message);
      setSaveStatus("error");
      if (!isAutosave) {
        setSaving(false);
      }
      return false;
    }

    // Update last saved state
    lastSavedProfileRef.current = JSON.stringify(profile);
    setLastSaved(new Date());
    setSaveStatus("saved");
    
    if (!isAutosave) {
      setSuccess("Profile saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
      setSaving(false);
    }

    return true;
  }, [profile, hasChanges, router]);

  // Manual save handler
  const handleSave = useCallback(async () => {
    // Clear any pending autosave
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    await performSave(false);
  }, [performSave]);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const loadedProfile = {
        first_name: existingProfile.first_name || "",
        last_name: existingProfile.last_name || "",
        date_of_birth: existingProfile.date_of_birth || "",
        gender: existingProfile.gender || "",
        looking_for: existingProfile.looking_for || [],
        height_inches: existingProfile.height_inches?.toString() || "",
        body_type: existingProfile.body_type || "",
        city: existingProfile.city || "",
        state: existingProfile.state || "",
        country: existingProfile.country || "",
        occupation: existingProfile.occupation || "",
        education: existingProfile.education || "",
        religion: existingProfile.religion || "",
        smoking: existingProfile.smoking || "",
        drinking: existingProfile.drinking || "",
        exercise: existingProfile.exercise || "",
        has_kids: existingProfile.has_kids || false,
        wants_kids: existingProfile.wants_kids || "",
        interests: existingProfile.interests || [],
        bio: existingProfile.bio || "",
        looking_for_description: existingProfile.looking_for_description || "",
      };
      setProfile(loadedProfile);
      // Store the initial state as "last saved"
      lastSavedProfileRef.current = JSON.stringify(loadedProfile);
    } else {
      // For new profiles, store empty state
      lastSavedProfileRef.current = JSON.stringify(profile);
    }

    setLoading(false);
    isInitialLoadRef.current = false;
  };

  // Autosave effect - triggers when profile changes
  useEffect(() => {
    // Skip autosave during initial load
    if (isInitialLoadRef.current || loading) {
      return;
    }

    // Check if there are actual changes
    if (!hasChanges()) {
      setSaveStatus("saved");
      return;
    }

    // Mark as unsaved
    setSaveStatus("unsaved");

    // Clear existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Set new timer for autosave
    autosaveTimerRef.current = setTimeout(() => {
      performSave(true);
    }, AUTOSAVE_DELAY);

    // Cleanup
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [profile, loading, hasChanges, performSave]);

  // Save on page unload (safety net)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges()) {
        // Try to save synchronously (won't always work)
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

  const toggleInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const toggleLookingFor = (gender: string) => {
    setProfile(prev => ({
      ...prev,
      looking_for: prev.looking_for.includes(gender)
        ? prev.looking_for.filter(g => g !== gender)
        : [...prev.looking_for, gender],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Helper to format relative time
  const getRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Status indicator component
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <div className="mt-1">
            <SaveStatusIndicator />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || saveStatus === "saving"}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving || saveStatus === "saving" ? "Saving..." : "Save Changes"}
        </button>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                {GENDERS.map(g => (
                  <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1).replace("-", " ")}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Looking For</label>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map(gender => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => toggleLookingFor(gender)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    profile.looking_for.includes(gender)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {gender.charAt(0).toUpperCase() + gender.slice(1).replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Physical */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Physical</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (inches)</label>
              <input
                type="number"
                value={profile.height_inches}
                onChange={(e) => setProfile(prev => ({ ...prev, height_inches: e.target.value }))}
                placeholder="e.g., 68 for 5 ft 8 in"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
              <select
                value={profile.body_type}
                onChange={(e) => setProfile(prev => ({ ...prev, body_type: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                {BODY_TYPES.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={profile.country}
                onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
              <input
                type="text"
                value={profile.education}
                onChange={(e) => setProfile(prev => ({ ...prev, education: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
              <input
                type="text"
                value={profile.religion}
                onChange={(e) => setProfile(prev => ({ ...prev, religion: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Smoking</label>
              <select
                value={profile.smoking}
                onChange={(e) => setProfile(prev => ({ ...prev, smoking: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                {SMOKING.map(opt => (
                  <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drinking</label>
              <select
                value={profile.drinking}
                onChange={(e) => setProfile(prev => ({ ...prev, drinking: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                {DRINKING.map(opt => (
                  <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exercise</label>
              <select
                value={profile.exercise}
                onChange={(e) => setProfile(prev => ({ ...prev, exercise: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                {EXERCISE.map(opt => (
                  <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="has_kids"
                checked={profile.has_kids}
                onChange={(e) => setProfile(prev => ({ ...prev, has_kids: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="has_kids" className="ml-2 text-sm text-gray-700">I have kids</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wants Kids</label>
              <select
                value={profile.wants_kids}
                onChange={(e) => setProfile(prev => ({ ...prev, wants_kids: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                {WANTS_KIDS.map(opt => (
                  <option key={opt} value={opt}>{opt.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Interests */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  profile.interests.includes(interest)
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </section>

        {/* Bio */}
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
