"use client";

import { useAppVersion } from "@/hooks/useAppVersion";
import { RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpdateBannerProps {
  /**
   * How often to check for updates (in milliseconds)
   * Default: 5 minutes (300000ms)
   */
  pollingInterval?: number;

  /**
   * Check for updates on route changes
   * Default: true
   */
  checkOnRouteChange?: boolean;

  /**
   * Position of the banner
   * Default: "top"
   */
  position?: "top" | "bottom";

  /**
   * Custom className
   */
  className?: string;
}

/**
 * UpdateBanner Component
 * 
 * Displays a banner when a new version of the app is available.
 * Users can click to reload or dismiss the notification.
 * 
 * @example
 * <UpdateBanner pollingInterval={300000} checkOnRouteChange={true} />
 */
export function UpdateBanner({
  pollingInterval = 300000,
  checkOnRouteChange = true,
  position = "top",
  className,
}: UpdateBannerProps) {
  const {
    isUpdateAvailable,
    latestVersion,
    reloadApp,
    dismissUpdate,
  } = useAppVersion({
    pollingInterval,
    checkOnRouteChange,
    debug: process.env.NODE_ENV === "development",
  });

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg",
        "animate-in slide-in-from-top-2 fade-in duration-300",
        position === "top" ? "top-0" : "bottom-0",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Message */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="shrink-0 bg-white/20 rounded-full p-2">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                A new version is available
                {latestVersion && (
                  <span className="ml-2 opacity-90 text-xs">
                    (v{latestVersion.version})
                  </span>
                )}
              </p>
              <p className="text-xs opacity-90 hidden sm:block">
                Click reload to get the latest features and fixes
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={reloadApp}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm",
                "bg-white text-blue-600 hover:bg-blue-50",
                "transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              )}
            >
              Reload
            </button>
            <button
              onClick={dismissUpdate}
              className={cn(
                "p-2 rounded-lg",
                "hover:bg-white/10",
                "transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              )}
              aria-label="Dismiss update notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
