"use client";

/**
 * Client-side providers wrapper
 * 
 * Wraps children with all necessary client-side providers:
 * - ToastProvider for notification toasts
 * 
 * Note: DiscoverProfilesProvider is added in the (app) layout
 * because it requires authenticated user context.
 */

import { ToastProvider } from "@/components/ui/Toast";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
