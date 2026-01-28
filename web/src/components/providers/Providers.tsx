"use client";

/**
 * Client-side providers wrapper
 * 
 * Wraps children with all necessary client-side providers:
 * - ToastProvider for notification toasts
 */

import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
