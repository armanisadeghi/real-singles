"use client";

import { useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Full height on mobile */
  fullHeight?: boolean;
  /** Show close button */
  showClose?: boolean;
  /** Custom height class */
  height?: "auto" | "half" | "full";
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  fullHeight = false,
  showClose = true,
  height = "auto",
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
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

  const heightClasses = {
    auto: "max-h-[85vh]",
    half: "h-[50vh]",
    full: "h-[90vh]",
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      {/* Desktop: centered modal, Mobile: bottom sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bg-white dark:bg-neutral-900 overflow-hidden",
          // Mobile: bottom sheet
          "bottom-0 left-0 right-0 rounded-t-2xl",
          "animate-in slide-in-from-bottom duration-300",
          // Desktop: centered modal
          "md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2",
          "md:rounded-xl md:max-w-lg md:w-full md:mx-4",
          "md:animate-in md:fade-in md:zoom-in-95 md:slide-in-from-bottom-0",
          fullHeight ? "h-[90vh] md:h-auto md:max-h-[85vh]" : heightClasses[height],
          "flex flex-col"
        )}
      >
        {/* Handle bar (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-neutral-600" />
        </div>

        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-700 shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title || ""}
            </h2>
            {showClose && (
              <button
                onClick={onClose}
                className="p-2 -m-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {/* Safe area padding for mobile */}
        <div className="pb-[env(safe-area-inset-bottom)] md:pb-0" />
      </div>
    </div>
  );
}

interface BottomSheetActionProps {
  children: React.ReactNode;
  className?: string;
}

export function BottomSheetActions({ children, className }: BottomSheetActionProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-700 px-4 py-3 flex gap-3",
        "pb-[calc(env(safe-area-inset-bottom)+12px)] md:pb-3",
        className
      )}
    >
      {children}
    </div>
  );
}
