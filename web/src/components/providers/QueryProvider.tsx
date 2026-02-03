"use client";

/**
 * QueryProvider - TanStack Query client provider
 * 
 * Provides client-side caching and request deduplication for the app.
 * 
 * Key features:
 * - Automatic request deduplication (same query won't be fetched twice)
 * - Background refetching for stale data
 * - Caching with configurable stale times
 * - Error retry with exponential backoff
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 1 minute
            staleTime: 60 * 1000,
            // Cache data for 5 minutes after it becomes unused
            gcTime: 5 * 60 * 1000,
            // Don't refetch on window focus by default (too aggressive)
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
            // Don't retry on 401/403 errors
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Don't retry mutations by default
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
