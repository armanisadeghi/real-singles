export default function ProfileFocusLoading() {
  return (
    <div className="min-h-dvh bg-black flex items-center justify-center animate-pulse">
      {/* Full screen image placeholder */}
      <div className="w-full max-w-2xl aspect-[3/4] bg-neutral-800 rounded-lg" />

      {/* Navigation arrows */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2">
        <div className="w-10 h-10 bg-neutral-800 rounded-full" />
      </div>
      <div className="fixed right-4 top-1/2 -translate-y-1/2">
        <div className="w-10 h-10 bg-neutral-800 rounded-full" />
      </div>

      {/* Close button */}
      <div className="fixed top-4 right-4">
        <div className="w-10 h-10 bg-neutral-800 rounded-full" />
      </div>

      {/* Dot indicators */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i === 0 ? "bg-white" : "bg-neutral-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
