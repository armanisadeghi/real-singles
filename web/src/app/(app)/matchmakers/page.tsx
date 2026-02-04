"use client";

/**
 * Professional Matchmakers Page (Placeholder)
 * 
 * This will eventually connect users with professional matchmakers
 * for curated matches. For now, it shows a coming soon message.
 */

import Link from "next/link";
import { Wand2, ArrowLeft, Heart, Users, Sparkles } from "lucide-react";

export default function MatchmakersPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 sm:py-10 text-center">
      {/* Back button */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-5 sm:mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Explore
      </Link>

      {/* Icon cluster */}
      <div className="relative inline-flex mx-auto mb-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <Wand2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        {/* Floating mini icons */}
        <div className="absolute -right-2 -top-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center shadow-md">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <div className="absolute -left-2 -bottom-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center shadow-md">
          <Users className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Professional Matchmakers
      </h1>

      {/* Description */}
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-5 max-w-sm mx-auto">
        Get expert help finding your perfect match. Professional matchmakers will curate personalized connections based on your preferences and relationship goals.
      </p>

      {/* Coming Soon Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs sm:text-sm font-medium mb-5">
        <Sparkles className="w-3 h-3" />
        Coming Soon
      </div>

      {/* Features Preview */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-rose-950/30 rounded-xl p-4 sm:p-5 text-left space-y-3 border border-purple-200 dark:border-purple-900/50">
        <h2 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">What you'll get:</h2>
        <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2.5">
            <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">✓</span>
            <span>One-on-one consultation with experienced matchmakers</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">✓</span>
            <span>Personalized match curation based on compatibility</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">✓</span>
            <span>Expert dating advice and relationship coaching</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">✓</span>
            <span>Higher quality matches from real professionals</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">✓</span>
            <span>Ongoing support throughout your dating journey</span>
          </li>
        </ul>
      </div>

      {/* Interested CTA */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Interested in being notified when this launches?
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Contact us or follow our updates to be the first to know!
        </p>
      </div>

      {/* CTA */}
      <div className="mt-5 pb-safe">
        <Link
          href="/explore"
          className="inline-block px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg shadow-purple-500/25"
        >
          Back to Explore
        </Link>
      </div>
    </div>
  );
}
