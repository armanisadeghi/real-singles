export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-7 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
      </div>

      {/* Settings sections */}
      <div className="space-y-6">
        {/* Account section */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
            <div className="h-4 w-20 bg-gray-200 dark:bg-neutral-700 rounded" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-neutral-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-200 dark:bg-neutral-700 rounded" />
                <div className="h-4 w-28 bg-gray-100 dark:bg-neutral-800 rounded" />
              </div>
              <div className="w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded" />
            </div>
          ))}
        </div>

        {/* Preferences section */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
            <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-neutral-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-200 dark:bg-neutral-700 rounded" />
                <div className="h-4 w-32 bg-gray-100 dark:bg-neutral-800 rounded" />
              </div>
              <div className="w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded" />
            </div>
          ))}
        </div>

        {/* Support section */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
            <div className="h-4 w-16 bg-gray-200 dark:bg-neutral-700 rounded" />
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-neutral-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-200 dark:bg-neutral-700 rounded" />
                <div className="h-4 w-24 bg-gray-100 dark:bg-neutral-800 rounded" />
              </div>
              <div className="w-5 h-5 bg-gray-100 dark:bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
