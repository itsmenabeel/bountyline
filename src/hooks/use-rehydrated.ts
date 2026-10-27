"use client";

import { useEffect, useState } from "react";

/**
 * Loads a `skipHydration` persisted store after mount and reports when it's done. Until
 * then a page renders the same placeholder on the server and the client, so the saved state
 * never causes a hydration mismatch.
 */
export function useRehydrated(persist: {
  rehydrate: () => Promise<void> | void;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void Promise.resolve(persist.rehydrate()).then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, [persist]);
  return ready;
}
