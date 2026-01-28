"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Users, MapPin, Clock, Check, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PrivacySettings {
  showProfile: boolean;
  showOnlineStatus: boolean;
  showDistance: boolean;
  showLastActive: boolean;
  whoCanMessage: "everyone" | "matches_only" | "nobody";
}

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState<PrivacySettings>({
    showProfile: true,
    showOnlineStatus: true,
    showDistance: true,
    showLastActive: true,
    whoCanMessage: "everyone",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error loading settings:", error);
        return;
      }

      if (data && (data as any).privacy_settings) {
        setSettings((data as any).privacy_settings as PrivacySettings);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: PrivacySettings) => {
    setSaving(true);
    setMessage("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ privacy_settings: newSettings } as any)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error saving settings:", error);
        setMessage("Failed to save settings");
        return;
      }

      setMessage("Settings saved successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error:", error);
      setMessage("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof Omit<PrivacySettings, "whoCanMessage">) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const updateMessageSetting = (value: "everyone" | "matches_only" | "nobody") => {
    const newSettings = {
      ...settings,
      whoCanMessage: value,
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/settings"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Privacy Settings</h1>
            <p className="text-sm text-gray-600 mt-1">
              Control what others can see about you
            </p>
          </div>
        </div>

        {/* Success Message */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">{message}</p>
            </div>
          </div>
        )}

        {/* Privacy Settings */}
        <div className="space-y-4">
          {/* Show Profile in Discovery */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  {settings.showProfile ? <Eye className="w-5 h-5 text-pink-600" /> : <EyeOff className="w-5 h-5 text-gray-500" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Show Profile in Discovery</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Your profile will appear in search results and recommendations
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting("showProfile")}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                  settings.showProfile ? "bg-pink-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showProfile ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Show Online Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Show Online Status</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Let others see when you're online
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting("showOnlineStatus")}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                  settings.showOnlineStatus ? "bg-pink-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showOnlineStatus ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Show Distance */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Show Distance</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Display distance from others on your profile
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting("showDistance")}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                  settings.showDistance ? "bg-pink-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showDistance ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Show Last Active */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Show Last Active</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Display when you were last active on the app
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting("showLastActive")}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                  settings.showLastActive ? "bg-pink-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showLastActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Who Can Message Me */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Who Can Message Me</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Control who can send you messages
                </p>
              </div>
            </div>
            <div className="space-y-2 ml-14">
              <button
                onClick={() => updateMessageSetting("everyone")}
                disabled={saving}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  settings.whoCanMessage === "everyone"
                    ? "border-pink-500 bg-pink-50 text-pink-900"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="font-medium">Everyone</div>
                <div className="text-xs text-gray-600">Anyone can message you</div>
              </button>
              <button
                onClick={() => updateMessageSetting("matches_only")}
                disabled={saving}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  settings.whoCanMessage === "matches_only"
                    ? "border-pink-500 bg-pink-50 text-pink-900"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="font-medium">Matches Only</div>
                <div className="text-xs text-gray-600">Only mutual matches can message you</div>
              </button>
              <button
                onClick={() => updateMessageSetting("nobody")}
                disabled={saving}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  settings.whoCanMessage === "nobody"
                    ? "border-pink-500 bg-pink-50 text-pink-900"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="font-medium">Nobody</div>
                <div className="text-xs text-gray-600">Disable incoming messages</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
