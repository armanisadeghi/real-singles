"use client";

/**
 * ActionMenu Component
 * 
 * iOS 16-style action sheet / action menu for contextual actions.
 * Displays as a bottom sheet on mobile and a centered modal on desktop.
 */

import { useEffect, useCallback, useState } from "react";
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
}

export function ActionMenu({
  isOpen,
  onClose,
  onSelect,
  items,
  title,
  message,
}: ActionMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Handle open/close with animation
  useEffect(() => {
    if (isOpen) {
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      // Trigger enter animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
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
      // Close on any click on the backdrop (not just e.target === e.currentTarget)
      // This ensures clicking anywhere outside closes the menu
      if (e.target === e.currentTarget) {
        handleClose();
      }
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
        "fixed inset-0 z-50 flex items-end justify-center md:items-center",
        "transition-opacity duration-200 ease-out",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-[2px]",
          "transition-opacity duration-200 ease-out",
          isVisible ? "opacity-100" : "opacity-0"
        )} 
      />

      {/* Menu Container */}
      <div 
        className={cn(
          "relative w-full max-w-sm mx-4 mb-4 md:mb-0 flex flex-col gap-2",
          "transition-all duration-200 ease-out",
          isVisible 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-8 md:translate-y-0 md:scale-95"
        )}
      >
        {/* Main Action Group */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl">
          {/* Header (optional) */}
          {(title || message) && (
            <div className="px-4 py-3 text-center border-b border-gray-200/50">
              {title && (
                <p className="text-sm font-semibold text-gray-500">{title}</p>
              )}
              {message && (
                <p className="text-xs text-gray-400 mt-0.5">{message}</p>
              )}
            </div>
          )}

          {/* Action Items */}
          <div className="divide-y divide-gray-200/50">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled || item.loading}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 transition-colors",
                    "hover:bg-gray-100/80 active:bg-gray-200/80",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    item.variant === "destructive" && "text-red-600",
                    item.variant !== "destructive" && "text-gray-900"
                  )}
                >
                  {/* Icon */}
                  {Icon && (
                    <div className="w-5 h-5 flex items-center justify-center">
                      {item.loading ? (
                        <div
                          className={cn(
                            "w-4 h-4 border-2 border-t-transparent rounded-full animate-spin",
                            item.variant === "destructive"
                              ? "border-red-600"
                              : "border-gray-600"
                          )}
                        />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                  )}

                  {/* Label & Description */}
                  <div className="flex-1 text-left">
                    <span
                      className={cn(
                        "text-base font-medium",
                        !Icon && "pl-0"
                      )}
                    >
                      {item.label}
                    </span>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </p>
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
            "bg-white/95 backdrop-blur-xl shadow-xl",
            "text-blue-600 hover:bg-gray-100/80 active:bg-gray-200/80",
            "transition-colors"
          )}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ActionMenu;
