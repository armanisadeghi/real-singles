export default function SpeedDatingLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-100 dark:bg-neutral-800 rounded" />
      </div>

      {/* Session cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row"
          >
            {/* Image */}
            <div className="w-full md:w-48 aspect-video md:aspect-square bg-gray-200 dark:bg-neutral-700 flex-shrink-0" />

            {/* Content */}
            <div className="p-4 flex-1">
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
              <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded mb-3" />

              {/* Meta info */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
                  <div className="h-3 w-24 bg-gray-100 dark:bg-neutral-800 rounded" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
                  <div className="h-3 w-20 bg-gray-100 dark:bg-neutral-800 rounded" />
                </div>
              </div>

              {/* Button */}
              <div className="h-10 w-32 bg-gray-200 dark:bg-neutral-700 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
