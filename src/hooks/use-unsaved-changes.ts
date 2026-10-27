"use client";

import { useEffect } from "react";

/**
 * Asks before the tab closes or reloads while `when` is true. The browser shows its own
 * wording; pages can't change it. Links inside the app don't trigger it, so forms that need
 * to survive in-app navigation keep their draft elsewhere (the wizard stores).
 */
export function useUnsavedChanges(when: boolean) {
  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [when]);
}
