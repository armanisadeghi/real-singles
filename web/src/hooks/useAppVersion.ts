"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

interface VersionInfo {
  version: string;
  buildNumber: number;
  gitCommit?: string;
  deployedAt: string;
}

interface UseAppVersionOptions {
  /**
   * How often to check for updates (in milliseconds)
   * Default: 5 minutes (300000ms)
   * Set to 0 to disable polling
   */
  pollingInterval?: number;

  /**
   * Check for updates on route changes
   * Default: true
   */
  checkOnRouteChange?: boolean;

  /**
   * Callback when a new version is detected
   */
  onUpdateAvailable?: (newVersion: VersionInfo, currentVersion: VersionInfo) => void;

  /**
   * Enable debug logging
   * Default: false
   */
  debug?: boolean;
}

/**
 * Hook to track app version and detect when updates are available
 * 
 * @example
 * const { isUpdateAvailable, currentVersion, latestVersion, checkForUpdate, dismissUpdate } = useAppVersion({
 *   pollingInterval: 300000, // Check every 5 minutes
 *   checkOnRouteChange: true,
 *   onUpdateAvailable: (newVersion, currentVersion) => {
 *     console.log(`Update available: ${currentVersion.version} → ${newVersion.version}`);
 *   },
 * });
 */
export function useAppVersion(options: UseAppVersionOptions = {}) {
  const {
    pollingInterval = 300000, // 5 minutes
    checkOnRouteChange = true,
    onUpdateAvailable,
    debug = false,
  } = options;

  const pathname = usePathname();
  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(null);
  const [latestVersion, setLatestVersion] = useState<VersionInfo | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track if update has been dismissed for this session
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Use refs to avoid re-creating functions
  const onUpdateAvailableRef = useRef(onUpdateAvailable);
  const isCheckingRef = useRef(false);
  
  useEffect(() => {
    onUpdateAvailableRef.current = onUpdateAvailable;
  }, [onUpdateAvailable]);

  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) {
        console.log("[useAppVersion]", ...args);
      }
    },
    [debug]
  );

  /**
   * Fetch version from API
   */
  const fetchVersion = useCallback(async (): Promise<VersionInfo | null> => {
    try {
      const response = await fetch("/api/version", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch version: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        version: data.version,
        buildNumber: data.buildNumber,
        gitCommit: data.gitCommit,
        deployedAt: data.deployedAt,
      };
    } catch (err) {
      log("Error fetching version:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, [log]);

  /**
   * Check if a version is newer than another
   */
  const isNewerVersion = useCallback(
    (newVer: VersionInfo, oldVer: VersionInfo): boolean => {
      // Primary check: build number
      if (newVer.buildNumber > oldVer.buildNumber) {
        return true;
      }

      // Secondary check: deployed timestamp
      if (new Date(newVer.deployedAt) > new Date(oldVer.deployedAt)) {
        return true;
      }

      return false;
    },
    []
  );

  /**
   * Check for updates
   */
  const checkForUpdateRef = useRef<(() => Promise<void>) | undefined>(undefined);
  
  const checkForUpdate = useCallback(async () => {
    if (isCheckingRef.current) {
      log("Already checking for update, skipping");
      return;
    }

    isCheckingRef.current = true;
    setIsChecking(true);
    setError(null);
    log("Checking for update...");

    try {
      const version = await fetchVersion();

      if (!version) {
        log("Failed to fetch version");
        return;
      }

      log("Fetched version:", version);

      // If this is the first check, set as current version
      setCurrentVersion((current) => {
        if (!current) {
          log("Setting initial version:", version);
          setLatestVersion(version);
          return version;
        }

        // Check if new version is available
        if (isNewerVersion(version, current)) {
          log("New version detected:", version, "Current:", current);
          setLatestVersion(version);
          
          // Check if dismissed before showing update
          setIsDismissed((dismissed) => {
            const shouldShow = !dismissed;
            setIsUpdateAvailable(shouldShow);
            
            if (shouldShow && onUpdateAvailableRef.current) {
              onUpdateAvailableRef.current(version, current);
            }
            
            return dismissed;
          });
        } else {
          log("Already on latest version");
          setLatestVersion(version);
        }

        return current;
      });
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }, [fetchVersion, isNewerVersion, log]);
  
  useEffect(() => {
    checkForUpdateRef.current = checkForUpdate;
  }, [checkForUpdate]);

  /**
   * Dismiss the update notification for this session
   */
  const dismissUpdate = useCallback(() => {
    log("Dismissing update notification");
    setIsUpdateAvailable(false);
    setIsDismissed(true);
  }, [log]);

  /**
   * Reload the page to get the latest version
   */
  const reloadApp = useCallback(() => {
    log("Reloading app...");
    window.location.reload();
  }, [log]);

  // Initial version check
  useEffect(() => {
    log("Running initial version check");
    checkForUpdateRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Set up polling
  useEffect(() => {
    if (pollingInterval <= 0) {
      log("Polling disabled");
      return;
    }

    log(`Setting up polling interval: ${pollingInterval}ms`);
    const intervalId = setInterval(() => {
      log("Polling for update...");
      checkForUpdateRef.current?.();
    }, pollingInterval);

    return () => {
      log("Clearing polling interval");
      clearInterval(intervalId);
    };
  }, [pollingInterval, log]);

  // Check on route change
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (!checkOnRouteChange) {
      return;
    }

    // Skip initial mount
    if (prevPathnameRef.current === pathname) {
      prevPathnameRef.current = pathname;
      return;
    }

    prevPathnameRef.current = pathname;
    log("Route changed, checking for update");
    checkForUpdateRef.current?.();
  }, [pathname, checkOnRouteChange, log]);

  return {
    currentVersion,
    latestVersion,
    isUpdateAvailable,
    isChecking,
    error,
    checkForUpdate,
    dismissUpdate,
    reloadApp,
  };
}
