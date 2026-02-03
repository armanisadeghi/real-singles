"use client";

/**
 * Discover Page
 * 
 * New personalized discovery experience for finding matches.
 * This will be the primary way users discover potential connections.
 */

import { Sparkles, Compass } from "lucide-react";

export default function DiscoverPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your personalized discovery experience is coming soon
          </p>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            What's Coming
          </h2>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-pink-500 mt-1 flex-shrink-0" />
              <div>
                <span className="font-medium">AI-Powered Recommendations:</span> Intelligent matching based on your preferences and behavior
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-pink-500 mt-1 flex-shrink-0" />
              <div>
                <span className="font-medium">Curated Daily Picks:</span> Handpicked profiles just for you every day
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-pink-500 mt-1 flex-shrink-0" />
              <div>
                <span className="font-medium">Smart Filtering:</span> Advanced discovery based on compatibility factors
              </div>
            </li>
          </ul>
        </div>

        {/* Temporary Navigation */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Compass className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <p className="text-blue-900 font-medium mb-2">
            Looking for browse mode?
          </p>
          <p className="text-blue-700 text-sm mb-4">
            Use the <span className="font-semibold">Explore</span> tab to browse all profiles
          </p>
        </div>
      </div>
    </div>
  );
}
