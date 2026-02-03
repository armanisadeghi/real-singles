export default function ProfileGalleryLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gray-200 dark:bg-neutral-700 rounded-full" />
          <div className="h-7 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
        </div>
        <div className="h-10 w-24 bg-gray-200 dark:bg-neutral-700 rounded-full" />
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gray-200 dark:bg-neutral-700 rounded-xl"
          />
        ))}
      </div>

      {/* Add photo button */}
      <div className="mt-6">
        <div className="h-12 w-full bg-gray-100 dark:bg-neutral-800 rounded-full" />
      </div>
    </div>
  );
}
