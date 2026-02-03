export default function NotificationsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
        <div className="h-8 w-24 bg-gray-100 dark:bg-neutral-800 rounded-full" />
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-4 rounded-xl ${
              i < 3
                ? "bg-pink-50 dark:bg-pink-950/20"
                : "bg-white dark:bg-neutral-900"
            }`}
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 flex-shrink-0" />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
              <div className="h-3 w-full bg-gray-100 dark:bg-neutral-800 rounded mb-2" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-neutral-800 rounded" />
            </div>

            {/* Unread indicator */}
            {i < 3 && (
              <div className="w-2 h-2 rounded-full bg-pink-400 flex-shrink-0 mt-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
