"use client";

import { useEffect, useCallback, useState } from "react";
import { X, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RouteModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal is closed */
  onClose: () => void;
  /** The URL/route to display inside the modal */
  url: string;
  /** Optional title shown in the modal header */
  title?: string;
  /** Width as percentage of viewport (default: 90) */
  widthPercent?: number;
  /** Height as percentage of viewport (default: 90) */
  heightPercent?: number;
}

/**
 * A reusable modal that displays any route/URL in a nearly full-screen iframe overlay.
 * Useful for previewing pages (e.g. admin user profiles) without navigating away.
 *
 * - Same-origin routes share authentication cookies automatically
 * - Escape key and backdrop click close the modal
 * - "Open in new tab" button for full-page navigation
 */
export function RouteModal({
  isOpen,
  onClose,
  url,
  title,
  widthPercent = 90,
  heightPercent = 90,
}: RouteModalProps) {
  const [loading, setLoading] = useState(true);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      setLoading(true);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          "relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col",
          "animate-in fade-in zoom-in-95 duration-300"
        )}
        style={{
          width: `${widthPercent}vw`,
          height: `${heightPercent}vh`,
          maxWidth: "1600px",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 shrink-0">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
            {title || url}
          </h2>
          <div className="flex items-center gap-1">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 top-[49px] flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              <p className="text-sm text-slate-500">Loading...</p>
            </div>
          </div>
        )}

        {/* Iframe */}
        <iframe
          src={url}
          className="flex-1 w-full border-0"
          onLoad={() => setLoading(false)}
          title={title || "Route preview"}
        />
      </div>
    </div>
  );
}
