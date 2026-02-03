export default function ProfileEditLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-8 h-8 bg-gray-200 dark:bg-neutral-700 rounded-full" />
        <div className="h-7 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
      </div>

      {/* Profile photo section */}
      <div className="mb-8">
        <div className="h-5 w-24 bg-gray-200 dark:bg-neutral-700 rounded mb-3" />
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-neutral-700" />
          <div className="h-10 w-32 bg-gray-100 dark:bg-neutral-800 rounded-full" />
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        {/* Field group */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 w-20 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
            <div className="h-12 w-full bg-gray-100 dark:bg-neutral-800 rounded-xl" />
          </div>
        ))}

        {/* Text area */}
        <div>
          <div className="h-4 w-16 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
          <div className="h-32 w-full bg-gray-100 dark:bg-neutral-800 rounded-xl" />
        </div>
      </div>

      {/* Save button */}
      <div className="mt-8">
        <div className="h-12 w-full bg-gray-200 dark:bg-neutral-700 rounded-full" />
      </div>
    </div>
  );
}
