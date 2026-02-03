"use client";

/**
 * ActionMenu Component
 * 
 * iOS 16-style action sheet / action menu for contextual actions.
 * Displays as a bottom sheet on mobile and a dropdown on desktop.
 */

import { useEffect, useCallback, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Visual style of the item */
  variant?: "default" | "destructive";
  /** Optional description below the label */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (itemId: string) => void;
  items: ActionMenuItem[];
  /** Optional title for the menu */
  title?: string;
  /** Optional message below the title */
  message?: string;
  /** Position for desktop dropdown (defaults to top-right) */
  anchorPosition?: { top: number; right: number } | null;
}

export function ActionMenu({
  isOpen,
  onClose,
  onSelect,
  items,
  title,
  message,
  anchorPosition,
}: ActionMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle open/close with animation
  useEffect(() => {
    if (isOpen) {
      // Only lock scroll on mobile (bottom sheet behavior)
      // Desktop dropdown doesn't need scroll lock
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      
      if (isMobile) {
        document.body.style.overflow = "hidden";
      }
      
      // Trigger enter animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Animated close handler
  const handleClose = useCallback(() => {
    setIsAnimatingOut(true);
    setIsVisible(false);
    
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleClose]);

  // Handle backdrop click (clicking anywhere outside the menu)
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      // Close when clicking the backdrop overlay
      handleClose();
    },
    [handleClose]
  );

  const handleItemClick = useCallback(
    (item: ActionMenuItem) => {
      if (item.disabled || item.loading) return;
      onSelect(item.id);
    },
    [onSelect]
  );

  if (!isOpen && !isAnimatingOut) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        "transition-opacity duration-200 ease-out",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Backdrop - clicking here closes the menu */}
      <div 
        className={cn(
          "absolute inset-0 cursor-pointer",
          "bg-black/40 backdrop-blur-[2px]",
          "md:bg-black/10 md:backdrop-blur-none",
          "transition-opacity duration-200 ease-out",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleBackdropClick}
      />

      {/* Mobile: Bottom sheet */}
      <div 
        ref={menuRef}
        className={cn(
          "md:hidden",
          "fixed bottom-0 left-0 right-0 mx-4 mb-4",
          "flex flex-col gap-2",
          "transition-all duration-200 ease-out",
          isVisible 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-8"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Action Group */}
        <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl dark:shadow-black/30">
          {/* Header (optional) */}
          {(title || message) && (
            <div className="px-4 py-3 text-center border-b border-gray-200/50 dark:border-neutral-700/50">
              {title && (
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
              )}
              {message && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{message}</p>
              )}
            </div>
          )}

          {/* Action Items */}
          <div className="divide-y divide-gray-200/50 dark:divide-neutral-700/50">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled || item.loading}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 transition-colors",
                    "hover:bg-gray-100/80 dark:hover:bg-neutral-800/80 active:bg-gray-200/80 dark:active:bg-neutral-700/80",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    item.variant === "destructive" && "text-red-600 dark:text-red-400",
                    item.variant !== "destructive" && "text-gray-900 dark:text-gray-100"
                  )}
                >
                  {Icon && (
                    <div className="w-5 h-5 flex items-center justify-center">
                      {item.loading ? (
                        <div className={cn(
                          "w-4 h-4 border-2 border-t-transparent rounded-full animate-spin",
                          item.variant === "destructive" ? "border-red-600 dark:border-red-400" : "border-gray-600 dark:border-gray-400"
                        )} />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <span className="text-base font-medium">{item.label}</span>
                    {item.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cancel Button (separate card for iOS feel) */}
        <button
          onClick={handleClose}
          className={cn(
            "w-full py-3.5 text-center rounded-2xl font-semibold",
            "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-xl dark:shadow-black/30",
            "text-blue-600 dark:text-blue-400 hover:bg-gray-100/80 dark:hover:bg-neutral-800/80 active:bg-gray-200/80 dark:active:bg-neutral-700/80",
            "transition-colors"
          )}
        >
          Cancel
        </button>
      </div>

      {/* Desktop: Dropdown positioned near trigger */}
      <div 
        className={cn(
          "hidden md:block",
          "absolute w-56",
          "transition-all duration-150 ease-out origin-top-right",
          isVisible 
            ? "opacity-100 scale-100" 
            : "opacity-0 scale-95"
        )}
        style={{
          top: anchorPosition?.top ?? 60,
          right: anchorPosition?.right ?? 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-2xl dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10">
          {/* Action Items - compact for desktop */}
          <div className="py-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled || item.loading}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                    "hover:bg-gray-100 dark:hover:bg-neutral-800 active:bg-gray-200 dark:active:bg-neutral-700",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    item.variant === "destructive" && "text-red-600 dark:text-red-400",
                    item.variant !== "destructive" && "text-gray-700 dark:text-gray-300"
                  )}
                >
                  {Icon && (
                    <div className="w-4 h-4 flex items-center justify-center">
                      {item.loading ? (
                        <div className={cn(
                          "w-3 h-3 border-2 border-t-transparent rounded-full animate-spin",
                          item.variant === "destructive" ? "border-red-600 dark:border-red-400" : "border-gray-600 dark:border-gray-400"
                        )} />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                  )}
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionMenu;
