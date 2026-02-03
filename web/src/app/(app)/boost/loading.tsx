export default function BoostLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto bg-gray-200 dark:bg-neutral-700 rounded-full mb-4" />
        <div className="h-8 w-32 mx-auto bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
        <div className="h-4 w-64 mx-auto bg-gray-100 dark:bg-neutral-800 rounded" />
      </div>

      {/* Boost options */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-neutral-700 rounded-xl" />
              <div>
                <div className="h-5 w-24 bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
                <div className="h-3 w-32 bg-gray-100 dark:bg-neutral-800 rounded" />
              </div>
            </div>
            <div className="h-10 w-20 bg-gray-200 dark:bg-neutral-700 rounded-full" />
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-8 bg-white dark:bg-neutral-900 rounded-2xl p-4">
        <div className="h-5 w-24 bg-gray-200 dark:bg-neutral-700 rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-8 w-12 bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
            <div className="h-3 w-20 bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>
          <div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
            <div className="h-3 w-24 bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
