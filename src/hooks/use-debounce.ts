"use client";

import { useEffect, useState } from "react";

/** Search inputs wait this long after the last keystroke before they update the URL. */
export const SEARCH_DEBOUNCE_MS = 300;

/** `value`, updated only after it has stopped changing for `delayMs`. */
export function useDebouncedValue<T>(value: T, delayMs = SEARCH_DEBOUNCE_MS) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
