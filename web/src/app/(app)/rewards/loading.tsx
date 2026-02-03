export default function RewardsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header with points */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl p-6 mb-6">
        <div className="h-4 w-24 bg-white/30 rounded mb-2" />
        <div className="h-10 w-32 bg-white/30 rounded" />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-hidden mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-10 w-24 rounded-full ${
              i === 0
                ? "bg-gray-200 dark:bg-neutral-700"
                : "bg-gray-100 dark:bg-neutral-800"
            }`}
          />
        ))}
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden"
          >
            <div className="aspect-square bg-gray-200 dark:bg-neutral-700" />
            <div className="p-3">
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
              <div className="h-4 w-16 bg-pink-100 dark:bg-pink-900/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
