export default function PrivacySettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-8 h-8 bg-gray-200 dark:bg-neutral-700 rounded-full" />
        <div className="h-7 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
      </div>

      {/* Privacy options */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-neutral-800 last:border-0"
            >
              <div>
                <div className="h-5 w-36 bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
                <div className="h-3 w-56 bg-gray-100 dark:bg-neutral-800 rounded" />
              </div>
              <div className="w-12 h-7 bg-gray-200 dark:bg-neutral-700 rounded-full" />
            </div>
          ))}
        </div>

        {/* Danger zone */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
            <div className="h-4 w-24 bg-red-200 dark:bg-red-900/30 rounded" />
          </div>
          <div className="px-4 py-4">
            <div className="h-10 w-full bg-red-100 dark:bg-red-900/20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
