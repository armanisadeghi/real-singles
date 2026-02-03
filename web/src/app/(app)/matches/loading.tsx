export default function MatchesLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-7 w-24 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
        <div className="h-4 w-48 bg-gray-100 dark:bg-neutral-800 rounded" />
      </div>

      {/* Match cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden"
          >
            {/* Image */}
            <div className="aspect-[3/4] bg-gray-200 dark:bg-neutral-700" />

            {/* Content */}
            <div className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <div className="h-5 w-20 bg-gray-200 dark:bg-neutral-700 rounded" />
                <div className="h-4 w-6 bg-gray-100 dark:bg-neutral-800 rounded" />
              </div>
              <div className="h-3 w-16 bg-gray-100 dark:bg-neutral-800 rounded mb-2" />
              <div className="h-8 w-full bg-gray-200 dark:bg-neutral-700 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
