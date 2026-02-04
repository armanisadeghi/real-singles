"use client";

/**
 * MatchmakerContext
 *
 * Provides the matchmaker ID to all portal pages.
 * The layout fetches the matchmaker record and passes the ID here.
 * Child components use useMatchmaker() to access it.
 */

import { createContext, useContext, type ReactNode } from "react";

interface MatchmakerContextValue {
  /** The matchmaker's database ID (from matchmakers table) */
  matchmakerId: string;
}

const MatchmakerContext = createContext<MatchmakerContextValue | null>(null);

interface MatchmakerProviderProps {
  matchmakerId: string;
  children: ReactNode;
}

export function MatchmakerProvider({
  matchmakerId,
  children,
}: MatchmakerProviderProps) {
  return (
    <MatchmakerContext.Provider value={{ matchmakerId }}>
      {children}
    </MatchmakerContext.Provider>
  );
}

export function useMatchmaker(): MatchmakerContextValue {
  const context = useContext(MatchmakerContext);

  if (!context) {
    throw new Error("useMatchmaker must be used within a MatchmakerProvider");
  }

  return context;
}

export default MatchmakerContext;
