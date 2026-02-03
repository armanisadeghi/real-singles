export default function SearchProfileLoading() {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-950 animate-pulse">
      {/* Hero image */}
      <div className="relative aspect-[3/4] max-h-[60vh] bg-gray-200 dark:bg-neutral-700" />

      {/* Content */}
      <div className="relative -mt-8 rounded-t-3xl bg-white dark:bg-neutral-900 min-h-[40vh]">
        <div className="px-4 pt-6 pb-24">
          {/* Name and age */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="h-6 w-8 bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 mb-4">
            <div className="w-4 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="h-4 w-24 bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>

          {/* Bio */}
          <div className="mb-6">
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
              <div className="h-4 w-3/4 bg-gray-100 dark:bg-neutral-800 rounded" />
            </div>
          </div>

          {/* Info badges */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-20 bg-gray-100 dark:bg-neutral-800 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 pb-safe">
        <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-neutral-700" />
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-neutral-700" />
          <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-neutral-700" />
        </div>
      </div>
    </div>
  );
}
