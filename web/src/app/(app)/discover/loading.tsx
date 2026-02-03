/**
 * Discover Page Loading State
 * 
 * Shows a skeleton matching the DiscoverProfileView layout.
 * Uses the same structure as the DiscoverSkeleton component.
 */

export default function DiscoverLoading() {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-900 flex flex-col animate-pulse">
      {/* Centered container for desktop */}
      <div className="flex-1 flex flex-col md:flex-row md:items-start md:justify-center md:py-8 md:px-4 md:gap-6 max-w-6xl mx-auto w-full">
        {/* Left Column - Photo placeholder */}
        <div className="relative md:sticky md:top-8 md:w-[400px] md:flex-shrink-0">
          {/* Photo placeholder */}
          <div className="md:rounded-2xl md:overflow-hidden md:shadow-lg dark:shadow-black/30">
            <div className="bg-gray-200 dark:bg-neutral-700 h-[55vh] md:h-[450px]" />
          </div>

          {/* Action buttons placeholder - Desktop */}
          <div className="hidden md:flex items-center justify-center gap-3 py-4">
            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-700" />
            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-700" />
            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-700" />
            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-700" />
          </div>

          {/* Info card placeholder - Desktop */}
          <div className="hidden md:block bg-white dark:bg-neutral-950 rounded-2xl shadow-lg dark:shadow-black/30 mt-4 p-5">
            <div className="h-7 bg-gray-200 dark:bg-neutral-700 rounded w-48 mb-3" />
            <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-40" />
          </div>
        </div>

        {/* Right Column - Profile details placeholder */}
        <div className="flex-1 bg-white dark:bg-neutral-950 md:rounded-2xl md:shadow-lg dark:md:shadow-black/30 md:max-w-xl">
          <div className="p-5 md:p-6 space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded w-32" />
            <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4" />
            <div className="h-20 bg-gray-200 dark:bg-neutral-700 rounded w-full mt-4" />
            <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/2 mt-4" />
          </div>
        </div>
      </div>

      {/* Mobile Action Bar placeholder */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)] z-40">
        <div className="flex items-center justify-center gap-4 py-4 px-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-700" />
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-700" />
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-700" />
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-700" />
        </div>
      </div>
    </div>
  );
}
