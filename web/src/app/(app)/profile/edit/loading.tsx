/**
 * Profile Edit Loading Skeleton
 * 
 * This skeleton matches the exact structure of the profile edit page to prevent
 * Cumulative Layout Shift (CLS). Each section's height is calibrated to match
 * the actual content dimensions.
 */

function SectionSkeleton({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string 
}) {
  return (
    <section className={`bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6 ${className}`}>
      {children}
    </section>
  );
}

function SectionTitle({ width = "w-32" }: { width?: string }) {
  return (
    <div className={`h-6 ${width} bg-gray-200 dark:bg-neutral-700 rounded mb-4`} />
  );
}

function InputSkeleton() {
  return (
    <div>
      <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded mb-1.5" />
      <div className="h-11 w-full bg-gray-100 dark:bg-neutral-800 rounded-lg" />
    </div>
  );
}

function TextareaSkeleton({ rows = 4 }: { rows?: number }) {
  const height = rows === 2 ? "h-[68px]" : rows === 3 ? "h-[92px]" : "h-[116px]";
  return (
    <div>
      <div className="h-4 w-32 bg-gray-200 dark:bg-neutral-700 rounded mb-1.5" />
      <div className={`${height} w-full bg-gray-100 dark:bg-neutral-800 rounded-lg`} />
    </div>
  );
}

function ChipGroupSkeleton({ chipCount = 6 }: { chipCount?: number }) {
  return (
    <div className="mt-4">
      <div className="h-4 w-28 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: chipCount }).map((_, i) => (
          <div 
            key={i} 
            className="h-9 bg-gray-100 dark:bg-neutral-800 rounded-full"
            style={{ width: `${60 + Math.random() * 40}px` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProfileEditLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6 animate-pulse">
      {/* Header Bar - matches actual header structure */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {/* Left: Back + Title + Completion Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-gray-200 dark:bg-neutral-700 rounded-full" />
          <div className="h-6 w-12 bg-gray-200 dark:bg-neutral-700 rounded" />
          <div className="h-6 w-20 bg-gray-200 dark:bg-neutral-700 rounded-full hidden sm:block" />
        </div>
        {/* Right: Save Status + Gallery + Save */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded hidden sm:block" />
          <div className="h-9 w-16 bg-gray-200 dark:bg-neutral-700 rounded-full" />
          <div className="h-9 w-14 bg-brand-primary/30 rounded-full" />
        </div>
      </div>

      <div className="space-y-8">
        {/* Basic Info Section - 7 fields in 2-col grid + 1 chip group */}
        <SectionSkeleton>
          <SectionTitle width="w-24" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSkeleton />
            <InputSkeleton />
            <InputSkeleton />
            <InputSkeleton />
            <InputSkeleton />
            <InputSkeleton />
            <InputSkeleton />
          </div>
          <ChipGroupSkeleton chipCount={4} />
        </SectionSkeleton>

        {/* Physical Section - 2 fields + chip group */}
        <SectionSkeleton>
          <SectionTitle width="w-20" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSkeleton />
            <InputSkeleton />
          </div>
          <ChipGroupSkeleton chipCount={8} />
        </SectionSkeleton>

        {/* Location Section - 5 fields in 2-col grid */}
        <SectionSkeleton>
          <SectionTitle width="w-20" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSkeleton />
            <InputSkeleton />
            <InputSkeleton />
            <InputSkeleton />
            <div className="md:col-span-2">
              <InputSkeleton />
            </div>
          </div>
        </SectionSkeleton>

        {/* Lifestyle Section - 6 fields + chip group */}
        <SectionSkeleton>
          <SectionTitle width="w-20" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSkeleton />
            <InputSkeleton />
            <InputSkeleton />
            <InputSkeleton />
            <InputSkeleton />
            <InputSkeleton />
          </div>
          <ChipGroupSkeleton chipCount={6} />
        </SectionSkeleton>

        {/* Habits Section - 3 fields in 3-col grid */}
        <SectionSkeleton>
          <SectionTitle width="w-16" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputSkeleton />
            <InputSkeleton />
            <InputSkeleton />
          </div>
        </SectionSkeleton>

        {/* Family Section - 2 fields + chip group */}
        <SectionSkeleton>
          <SectionTitle width="w-16" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSkeleton />
            <InputSkeleton />
          </div>
          <ChipGroupSkeleton chipCount={5} />
        </SectionSkeleton>

        {/* Interests Section - chip group only */}
        <SectionSkeleton>
          <SectionTitle width="w-20" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 16 }).map((_, i) => (
              <div 
                key={i} 
                className="h-9 bg-gray-100 dark:bg-neutral-800 rounded-full"
                style={{ width: `${70 + Math.random() * 50}px` }}
              />
            ))}
          </div>
        </SectionSkeleton>

        {/* Life Goals Section - 4 category groups */}
        <SectionSkeleton>
          <SectionTitle width="w-24" />
          <div className="h-4 w-72 bg-gray-200 dark:bg-neutral-700 rounded mb-4" />
          {["w-36", "w-32", "w-40", "w-28"].map((width, catIndex) => (
            <div key={catIndex} className="mb-4">
              <div className={`h-4 ${width} bg-gray-200 dark:bg-neutral-700 rounded mb-2`} />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 + catIndex }).map((_, i) => (
                  <div 
                    key={i} 
                    className="h-10 bg-gray-100 dark:bg-neutral-800 rounded-full"
                    style={{ width: `${80 + Math.random() * 40}px` }}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="h-3 w-20 bg-gray-200 dark:bg-neutral-700 rounded mt-2" />
        </SectionSkeleton>

        {/* Verification Selfie Section */}
        <SectionSkeleton>
          <SectionTitle width="w-36" />
          <div className="h-4 w-72 bg-gray-200 dark:bg-neutral-700 rounded mb-4" />
          <div className="max-w-sm mx-auto">
            <div className="aspect-[4/3] bg-gray-200 dark:bg-neutral-700 rounded-xl" />
          </div>
          <div className="h-3 w-64 bg-gray-200 dark:bg-neutral-700 rounded mx-auto mt-4" />
        </SectionSkeleton>

        {/* Voice & Video Section - 2 column grid */}
        <SectionSkeleton>
          <SectionTitle width="w-40" />
          <div className="h-4 w-80 bg-gray-200 dark:bg-neutral-700 rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Voice Prompt Card */}
            <div className="border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
                <div className="h-5 w-28 bg-gray-200 dark:bg-neutral-700 rounded" />
                <div className="h-3 w-36 bg-gray-200 dark:bg-neutral-700 rounded mt-1" />
              </div>
              <div className="p-4">
                <div className="h-24 bg-gray-100 dark:bg-neutral-800 rounded-lg" />
              </div>
            </div>
            {/* Video Intro Card */}
            <div className="border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
                <div className="h-5 w-36 bg-gray-200 dark:bg-neutral-700 rounded" />
                <div className="h-3 w-44 bg-gray-200 dark:bg-neutral-700 rounded mt-1" />
              </div>
              <div className="p-4">
                <div className="h-24 bg-gray-100 dark:bg-neutral-800 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="h-3 w-72 bg-gray-200 dark:bg-neutral-700 rounded mx-auto mt-4" />
        </SectionSkeleton>

        {/* About Me Section - 2 textareas */}
        <SectionSkeleton>
          <SectionTitle width="w-24" />
          <div className="space-y-4">
            <TextareaSkeleton rows={4} />
            <TextareaSkeleton rows={3} />
          </div>
        </SectionSkeleton>

        {/* Profile Prompts Section - 10 fields */}
        <SectionSkeleton>
          <SectionTitle width="w-32" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-neutral-700 rounded mb-4" />
          <div className="space-y-4">
            <TextareaSkeleton rows={2} />
            <TextareaSkeleton rows={2} />
            <TextareaSkeleton rows={2} />
            <TextareaSkeleton rows={2} />
            <InputSkeleton />
            <TextareaSkeleton rows={2} />
            <TextareaSkeleton rows={2} />
            <TextareaSkeleton rows={2} />
            <TextareaSkeleton rows={2} />
            <TextareaSkeleton rows={2} />
          </div>
        </SectionSkeleton>

        {/* Social Links Section - 2 inputs */}
        <SectionSkeleton>
          <SectionTitle width="w-28" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSkeleton />
            <InputSkeleton />
          </div>
        </SectionSkeleton>

        {/* Save Button */}
        <div className="flex justify-end">
          <div className="h-12 w-40 bg-brand-primary/30 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
