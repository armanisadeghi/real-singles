export default function ChatsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 animate-pulse">
      {/* Header */}
      <div className="py-4 border-b border-gray-200 dark:border-neutral-800 mb-4">
        <div className="h-7 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
      </div>

      {/* Search bar skeleton */}
      <div className="mb-4">
        <div className="h-10 bg-gray-100 dark:bg-neutral-800 rounded-xl" />
      </div>

      {/* Conversation list skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900"
          >
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-neutral-700 flex-shrink-0" />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="h-5 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
                <div className="h-3 w-12 bg-gray-100 dark:bg-neutral-800 rounded" />
              </div>
              <div className="h-4 w-3/4 bg-gray-100 dark:bg-neutral-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
