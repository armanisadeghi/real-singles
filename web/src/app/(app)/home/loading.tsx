export default function HomeLoading() {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-950 animate-pulse">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="h-8 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-gray-200 dark:bg-neutral-700 rounded-full" />
          <div className="w-10 h-10 bg-gray-200 dark:bg-neutral-700 rounded-full" />
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 pb-24 space-y-6">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-4 text-center"
            >
              <div className="h-8 w-8 mx-auto bg-gray-200 dark:bg-neutral-700 rounded-full mb-2" />
              <div className="h-6 w-8 mx-auto bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
              <div className="h-3 w-12 mx-auto bg-gray-100 dark:bg-neutral-800 rounded" />
            </div>
          ))}
        </div>

        {/* Featured section */}
        <div>
          <div className="h-5 w-32 bg-gray-200 dark:bg-neutral-700 rounded mb-3" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-48 bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden"
              >
                <div className="aspect-[3/4] bg-gray-200 dark:bg-neutral-700" />
                <div className="p-3">
                  <div className="h-5 w-20 bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
                  <div className="h-3 w-16 bg-gray-100 dark:bg-neutral-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div>
          <div className="h-5 w-24 bg-gray-200 dark:bg-neutral-700 rounded mb-3" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl"
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-700" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
                  <div className="h-3 w-16 bg-gray-100 dark:bg-neutral-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
