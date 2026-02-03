export default function NotificationSettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-8 h-8 bg-gray-200 dark:bg-neutral-700 rounded-full" />
        <div className="h-7 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
      </div>

      {/* Toggle sections */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-neutral-800 last:border-0"
          >
            <div>
              <div className="h-5 w-32 bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
              <div className="h-3 w-48 bg-gray-100 dark:bg-neutral-800 rounded" />
            </div>
            <div className="w-12 h-7 bg-gray-200 dark:bg-neutral-700 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
