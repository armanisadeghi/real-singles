"use client";

import { useState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Bell, 
  Lock, 
  UserX, 
  Trash2, 
  FileText,
  HelpCircle,
  Shield,
  ChevronRight,
  BadgeCheck,
  PauseCircle,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileHidden, setProfileHidden] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);

  // Fetch current profile_hidden state on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/users/me");
        const data = await response.json();
        if (data.success && data.data) {
          setProfileHidden(data.data.profile_hidden || false);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handlePauseToggle = async () => {
    setPauseLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_hidden: !profileHidden }),
      });

      const data = await response.json();
      if (data.success) {
        setProfileHidden(!profileHidden);
        setSuccess(
          !profileHidden
            ? "Your account is now paused. You won't appear in search or matches."
            : "Your account is active again. You'll appear in search and matches."
        );
      } else {
        setError(data.msg || "Failed to update account status");
      }
    } catch (err) {
      setError("Failed to update account status");
    } finally {
      setPauseLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    // In a real app, you'd call an API endpoint that uses the admin client
    alert("Account deletion would be processed here. Contact support for now.");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6">
      {/* Compact Header */}
      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/profile"
          className="flex items-center justify-center w-8 h-8 -ml-1 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Back to profile"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Quick Links */}
        <nav className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-black/20 divide-y divide-gray-100 dark:divide-neutral-800" aria-label="Settings navigation">
          <Link
            href="/settings/notifications"
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage notification preferences</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </Link>

          <Link
            href="/settings/privacy"
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-secondary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-brand-secondary-dark" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Privacy</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Control what others see</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </Link>

          <Link
            href="/settings/verification"
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Verification</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Verify phone and photos</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </Link>

          <Link
            href="/settings/blocked"
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Blocked Users</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage blocked accounts</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </Link>

          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                profileHidden ? "bg-orange-100 dark:bg-orange-900/30" : "bg-gray-100 dark:bg-neutral-800"
              }`}>
                <PauseCircle className={`w-5 h-5 ${
                  profileHidden ? "text-orange-600 dark:text-orange-400" : "text-gray-600 dark:text-gray-400"
                }`} aria-hidden="true" />
              </div>
              <div id="pause-account-label">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Pause Account</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profileHidden 
                    ? "Your profile is hidden from search" 
                    : "Hide from search and matches"}
                </p>
              </div>
            </div>
            <button
              onClick={handlePauseToggle}
              disabled={pauseLoading}
              role="switch"
              aria-checked={profileHidden}
              aria-labelledby="pause-account-label"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
                profileHidden ? "bg-orange-500" : "bg-gray-200 dark:bg-neutral-700"
              } ${pauseLoading ? "opacity-50" : ""}`}
            >
              <span className="sr-only">
                {profileHidden ? "Enable profile visibility" : "Pause profile visibility"}
              </span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  profileHidden ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <Link
            href="/profile/gallery"
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Gallery</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage photos and videos</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </Link>

          <Link
            href="/terms"
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Terms of Service</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Read our terms</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </Link>

          <Link
            href="/privacy-policy"
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Privacy Policy</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">How we handle your data</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </Link>

          <Link
            href="/faq"
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">FAQ</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Frequently asked questions</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          </Link>
        </nav>
        {/* Change Password */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-black/20 p-6" aria-labelledby="change-password-heading">
          <h2 id="change-password-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Change Password</h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {error && (
              <div role="alert" className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div role="status" className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>


        {/* Account Actions */}
        <section className="bg-white rounded-xl shadow-sm p-6" aria-labelledby="account-actions-heading">
          <h2 id="account-actions-heading" className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
          
          <div className="space-y-4">
            <button
              onClick={handleSignOut}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
            >
              Sign Out
            </button>
            
            <button
              onClick={handleDeleteAccount}
              className="w-full py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
