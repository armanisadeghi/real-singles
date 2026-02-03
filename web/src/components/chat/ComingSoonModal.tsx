"use client";

import { useEffect, useCallback } from "react";
import { Phone, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: "call" | "video";
}

/**
 * ComingSoon Modal for Call/Video features
 * 
 * Displays an animated modal with ripple effect when users tap
 * on call or video buttons. Inspired by iOS design patterns.
 */
export function ComingSoonModal({ isOpen, onClose, feature }: ComingSoonModalProps) {
  const Icon = feature === "call" ? Phone : Video;
  const title = feature === "call" ? "Voice Calls" : "Video Calls";
  const description = feature === "call" 
    ? "Voice calling is coming soon! You'll be able to call your matches directly."
    : "Video calling is coming soon! Connect face-to-face with your matches.";

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl mx-4 max-w-sm w-full animate-in zoom-in-95 fade-in duration-300 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Animated ripple effect container */}
        <div className="flex flex-col items-center pt-12 pb-8 px-6">
          {/* Ripple animation */}
          <div className="relative w-40 h-40 flex items-center justify-center mb-6">
            {/* Ripple ring 1 - outermost */}
            <div 
              className={cn(
                "absolute inset-0 rounded-full border-[3px]",
                feature === "call" ? "border-green-300" : "border-blue-300"
              )}
              style={{
                animation: 'ripple 2.5s ease-out infinite',
              }}
            />
            
            {/* Ripple ring 2 */}
            <div 
              className={cn(
                "absolute inset-0 rounded-full border-[3px]",
                feature === "call" ? "border-green-300" : "border-blue-300"
              )}
              style={{
                animation: 'ripple 2.5s ease-out infinite 0.8s',
              }}
            />
            
            {/* Ripple ring 3 */}
            <div 
              className={cn(
                "absolute inset-0 rounded-full border-[3px]",
                feature === "call" ? "border-green-300" : "border-blue-300"
              )}
              style={{
                animation: 'ripple 2.5s ease-out infinite 1.6s',
              }}
            />
            
            {/* Static background circles */}
            <div className={cn(
              "absolute inset-4 rounded-full",
              feature === "call" ? "bg-green-100/80" : "bg-blue-100/80"
            )} />
            <div className={cn(
              "absolute inset-10 rounded-full",
              feature === "call" ? "bg-green-50" : "bg-blue-50"
            )} />
            <div className="absolute inset-14 rounded-full bg-white" />
            
            {/* Icon container */}
            <div className={cn(
              "relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg z-10",
              feature === "call" 
                ? "bg-gradient-to-br from-green-400 to-green-600" 
                : "bg-gradient-to-br from-blue-400 to-blue-600"
            )}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Keyframes */}
          <style jsx>{`
            @keyframes ripple {
              0% {
                transform: scale(0.4);
                opacity: 1;
              }
              100% {
                transform: scale(1);
                opacity: 0;
              }
            }
          `}</style>

          {/* Title */}
          <h2 
            id="coming-soon-title"
            className="text-xl font-semibold text-gray-900 mb-2 text-center"
          >
            {title} Coming Soon
          </h2>

          {/* Description */}
          <p className="text-gray-500 text-center text-sm mb-6 max-w-xs">
            {description}
          </p>

          {/* Action button */}
          <button
            onClick={onClose}
            className={cn(
              "w-full py-3.5 rounded-full font-semibold text-white transition-all active:scale-[0.98]",
              feature === "call"
                ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            )}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
