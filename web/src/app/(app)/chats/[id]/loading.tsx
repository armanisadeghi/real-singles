export default function ChatThreadLoading() {
  return (
    <div className="flex flex-col h-[calc(100dvh-var(--header-height))] bg-gray-50 dark:bg-neutral-950 animate-pulse">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700" />
        <div>
          <div className="h-5 w-24 bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
          <div className="h-3 w-16 bg-gray-100 dark:bg-neutral-800 rounded" />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Incoming message */}
        <div className="flex gap-2 max-w-[80%]">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700 flex-shrink-0" />
          <div className="bg-white dark:bg-neutral-800 rounded-2xl rounded-tl-sm px-4 py-2">
            <div className="h-4 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>

        {/* Outgoing message */}
        <div className="flex justify-end">
          <div className="bg-pink-100 dark:bg-pink-900/30 rounded-2xl rounded-tr-sm px-4 py-2">
            <div className="h-4 w-40 bg-pink-200 dark:bg-pink-800/50 rounded" />
          </div>
        </div>

        {/* Incoming message */}
        <div className="flex gap-2 max-w-[80%]">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700 flex-shrink-0" />
          <div className="bg-white dark:bg-neutral-800 rounded-2xl rounded-tl-sm px-4 py-2">
            <div className="h-4 w-48 bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>

        {/* Outgoing message */}
        <div className="flex justify-end">
          <div className="bg-pink-100 dark:bg-pink-900/30 rounded-2xl rounded-tr-sm px-4 py-2">
            <div className="h-4 w-28 bg-pink-200 dark:bg-pink-800/50 rounded" />
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 bg-gray-100 dark:bg-neutral-800 rounded-full" />
          <div className="w-10 h-10 bg-gray-200 dark:bg-neutral-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}
