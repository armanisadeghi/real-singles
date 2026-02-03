"use client";

/**
 * Boost Page (Placeholder)
 * 
 * This will eventually allow users to boost their profile visibility.
 * For now, it shows a coming soon message.
 */

import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";

export default function BoostPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 sm:py-10 text-center">
      {/* Back button */}
      <Link
        href="/likes?tab=matches"
        className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-5 sm:mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Matches
      </Link>

      {/* Icon */}
      <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 animate-pulse">
        <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Profile Boost
      </h1>

      {/* Description */}
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-5 max-w-sm mx-auto">
        Get seen up to 10x more! Profile Boost puts you at the top of the stack for 30 minutes.
      </p>

      {/* Coming Soon Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs sm:text-sm font-medium mb-5">
        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
        Coming Soon
      </div>

      {/* Features Preview */}
      <div className="bg-gray-50 dark:bg-neutral-900 rounded-xl p-4 sm:p-5 text-left space-y-3">
        <h2 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">What you'll get:</h2>
        <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2.5">
            <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">✓</span>
            <span>Be shown to 10x more people for 30 minutes</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">✓</span>
            <span>Priority placement in discover and search</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">✓</span>
            <span>See who views your profile during boost</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">✓</span>
            <span>Average 3x more matches during boost period</span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-5 pb-safe">
        <Link
          href="/discover"
          className="inline-block px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium rounded-xl hover:from-pink-600 hover:to-rose-600 transition-colors"
        >
          Keep Discovering
        </Link>
      </div>
    </div>
  );
}
