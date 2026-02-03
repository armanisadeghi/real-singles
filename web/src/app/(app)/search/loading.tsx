export default function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header with tabs */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-neutral-800 rounded-full p-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`h-10 w-20 rounded-full ${
                i === 0
                  ? "bg-white dark:bg-neutral-900"
                  : "bg-transparent"
              }`}
            />
          ))}
        </div>
        <div className="h-10 w-24 bg-gray-100 dark:bg-neutral-800 rounded-full" />
      </div>

      {/* Profile list */}
      <div className="max-w-2xl mx-auto space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 bg-white dark:bg-neutral-900 rounded-xl"
          >
            <div className="w-[72px] h-[72px] bg-gray-200 dark:bg-neutral-700 rounded-lg" />
            <div className="flex-1">
              <div className="h-5 w-32 bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
              <div className="h-4 w-24 bg-gray-100 dark:bg-neutral-800 rounded mb-2" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-gray-100 dark:bg-neutral-800 rounded-full" />
                <div className="h-5 w-12 bg-gray-100 dark:bg-neutral-800 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
