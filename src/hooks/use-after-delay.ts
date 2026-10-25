"use client";

import { useEffect, useState } from "react";

/** True once `active` has stayed true for `delayMs`; false again as soon as it turns off. */
export function useAfterDelay(active: boolean, delayMs: number) {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setElapsed(true), delayMs);
    return () => {
      clearTimeout(timer);
      setElapsed(false);
    };
  }, [active, delayMs]);

  return active && elapsed;
}
