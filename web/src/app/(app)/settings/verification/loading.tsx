export default function VerificationSettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-8 h-8 bg-gray-200 dark:bg-neutral-700 rounded-full" />
        <div className="h-7 w-28 bg-gray-200 dark:bg-neutral-700 rounded" />
      </div>

      {/* Verification status card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-neutral-700" />
          <div>
            <div className="h-6 w-32 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>
        </div>
        <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded mb-2" />
        <div className="h-4 w-3/4 bg-gray-100 dark:bg-neutral-800 rounded" />
      </div>

      {/* Verification options */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700" />
              <div>
                <div className="h-5 w-28 bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
                <div className="h-3 w-40 bg-gray-100 dark:bg-neutral-800 rounded" />
              </div>
            </div>
            <div className="w-6 h-6 bg-gray-200 dark:bg-neutral-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
