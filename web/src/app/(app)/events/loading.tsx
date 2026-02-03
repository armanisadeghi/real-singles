export default function EventsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-32 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
        <div className="h-4 w-64 bg-gray-100 dark:bg-neutral-800 rounded" />
      </div>

      {/* Event cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Image placeholder */}
            <div className="aspect-[16/9] bg-gray-200 dark:bg-neutral-700" />

            {/* Content */}
            <div className="p-4">
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
              <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded mb-3" />

              {/* Meta info */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
                  <div className="h-3 w-20 bg-gray-100 dark:bg-neutral-800 rounded" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
                  <div className="h-3 w-16 bg-gray-100 dark:bg-neutral-800 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
