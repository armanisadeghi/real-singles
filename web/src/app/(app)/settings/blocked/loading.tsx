export default function BlockedUsersLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-8 h-8 bg-gray-200 dark:bg-neutral-700 rounded-full" />
        <div className="h-7 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
      </div>

      {/* Description */}
      <div className="mb-6">
        <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded mb-1" />
        <div className="h-4 w-3/4 bg-gray-100 dark:bg-neutral-800 rounded" />
      </div>

      {/* Blocked users list */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-700" />
              <div>
                <div className="h-5 w-24 bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
                <div className="h-3 w-16 bg-gray-100 dark:bg-neutral-800 rounded" />
              </div>
            </div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-neutral-700 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
