"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, Loader2 } from "lucide-react";

interface DataIntegrityActionsProps {
  autoFixableAvatars: number;
  autoFixableGallery: number;
}

export function DataIntegrityActions({
  autoFixableAvatars,
  autoFixableGallery,
}: DataIntegrityActionsProps) {
  const router = useRouter();
  const [fixing, setFixing] = useState<string | null>(null);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const totalAutoFixable = autoFixableAvatars + autoFixableGallery;

  if (totalAutoFixable === 0) {
    return null;
  }

  async function handleFixAll() {
    setFixing("all");
    setResult(null);

    try {
      const results = await Promise.all([
        autoFixableAvatars > 0
          ? fetch("/api/admin/data-integrity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "fix_avatars" }),
            }).then((r) => r.json())
          : null,
        autoFixableGallery > 0
          ? fetch("/api/admin/data-integrity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "fix_gallery" }),
            }).then((r) => r.json())
          : null,
      ]);

      const avatarResult = results[0];
      const galleryResult = results[1];

      const fixedCount =
        (avatarResult?.fixed?.length || 0) + (galleryResult?.fixed?.length || 0);
      const failedCount =
        (avatarResult?.failed?.length || 0) +
        (galleryResult?.failed?.length || 0);

      setResult({
        type: failedCount === 0 ? "success" : "error",
        message: `Fixed ${fixedCount} issues${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
      });

      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (error) {
      setResult({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to fix issues",
      });
    } finally {
      setFixing(null);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span
          className={`text-sm ${
            result.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {result.message}
        </span>
      )}
      <button
        onClick={handleFixAll}
        disabled={fixing !== null}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {fixing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Fixing...
          </>
        ) : (
          <>
            <Wrench className="w-4 h-4" />
            Fix All ({totalAutoFixable})
          </>
        )}
      </button>
    </div>
  );
}
