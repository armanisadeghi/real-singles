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
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {/* Back button */}
      <Link
        href="/likes?tab=matches"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Matches
      </Link>

      {/* Icon */}
      <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 animate-pulse">
        <Zap className="w-12 h-12 text-white" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Profile Boost
      </h1>

      {/* Description */}
      <p className="text-gray-600 mb-8 max-w-sm mx-auto">
        Get seen up to 10x more! Profile Boost puts you at the top of the stack for 30 minutes.
      </p>

      {/* Coming Soon Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-8">
        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
        Coming Soon
      </div>

      {/* Features Preview */}
      <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4">
        <h2 className="font-semibold text-gray-900">What you'll get:</h2>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
            <span>Be shown to 10x more people for 30 minutes</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
            <span>Priority placement in discover and search</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
            <span>See who views your profile during boost</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
            <span>Average 3x more matches during boost period</span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-8">
        <Link
          href="/discover"
          className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 transition-colors"
        >
          Keep Discovering
        </Link>
      </div>
    </div>
  );
}
