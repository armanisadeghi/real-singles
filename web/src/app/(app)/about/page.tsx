"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  RefreshCw, 
  Sparkles,
  Code,
  Calendar,
  Package,
  Heart,
} from "lucide-react";
import { useAppVersion } from "@/hooks/useAppVersion";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  const { currentVersion, latestVersion, isUpdateAvailable, isChecking, checkForUpdate, reloadApp } = useAppVersion({
    pollingInterval: 0, // Disable automatic polling on this page
    checkOnRouteChange: false,
    debug: false,
  });

  const [isCheckingManual, setIsCheckingManual] = useState(false);

  const handleCheckForUpdates = async () => {
    setIsCheckingManual(true);
    await checkForUpdate();
    // Add a small delay for better UX feedback
    setTimeout(() => setIsCheckingManual(false), 500);
  };

  const version = currentVersion || latestVersion;
  const deployedDate = version?.deployedAt ? new Date(version.deployedAt) : null;

  // Format deployment date as relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/profile"
          className="flex items-center justify-center w-8 h-8 -ml-1 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Back to profile"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">About</h1>
      </div>

      {/* Hero Section with Logo */}
      <div className="relative overflow-hidden bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-brand-primary/10 dark:from-pink-500/5 dark:via-purple-500/5 dark:to-brand-primary/5 rounded-2xl p-8 mb-6 text-center">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-brand-primary/20 to-pink-400/20 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24 rounded-3xl bg-white dark:bg-neutral-900 shadow-lg flex items-center justify-center">
              <Image
                src="/images/logo-transparent.png"
                alt="RealSingles"
                width={80}
                height={80}
                className="dark:hidden"
              />
              <Image
                src="/images/logo-dark-transparent.png"
                alt="RealSingles"
                width={80}
                height={80}
                className="hidden dark:block"
              />
            </div>
          </div>

          {/* App Name */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            RealSingles
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Where Real Connections Happen
          </p>

          {/* Version Number - Large and Prominent */}
          {version && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-full border border-gray-200 dark:border-neutral-700 shadow-sm">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span className="text-lg font-semibold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Version {version.version}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Version Details */}
      {version && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-black/20 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Version Details</h3>
          
          <div className="space-y-4">
            {/* Build Number */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Build Number</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{version.buildNumber}</p>
              </div>
            </div>

            {/* Deployed At */}
            {deployedDate && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Last Updated</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getRelativeTime(deployedDate)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {deployedDate.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Git Commit (if available) */}
            {version.gitCommit && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  <Code className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Commit</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {version.gitCommit.substring(0, 7)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Update Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-black/20 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Updates</h3>
          {isUpdateAvailable && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
              <Sparkles className="w-3 h-3" />
              New version available
            </span>
          )}
        </div>

        {isUpdateAvailable ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              A new version is available! Reload the app to get the latest features and improvements.
            </p>
            <button
              onClick={reloadApp}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
            >
              Reload App
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isChecking || isCheckingManual 
                ? "Checking for updates..." 
                : "You're running the latest version of RealSingles."}
            </p>
            <button
              onClick={handleCheckForUpdates}
              disabled={isChecking || isCheckingManual}
              className={cn(
                "w-full py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
                isChecking || isCheckingManual
                  ? "bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className={cn("w-4 h-4", (isChecking || isCheckingManual) && "animate-spin")} />
                {isChecking || isCheckingManual ? "Checking..." : "Check for Updates"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Made with</span>
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
          <span>by the RealSingles Team</span>
        </div>
        
        <div className="flex items-center justify-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <Link 
            href="/terms" 
            className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Terms
          </Link>
          <span>•</span>
          <Link 
            href="/privacy-policy" 
            className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Privacy
          </Link>
          <span>•</span>
          <Link 
            href="/faq" 
            className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            FAQ
          </Link>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} RealSingles. All rights reserved.
        </p>
      </div>
    </div>
  );
}
