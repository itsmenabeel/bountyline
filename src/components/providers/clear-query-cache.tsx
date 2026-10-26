"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Empties the browser's query cache. Sign-out and sign-in end in client navigations, so the
 * cache would otherwise carry one person's reports and comments into the next session in
 * the same tab. Mounted on the sign-in pages, which run no queries of their own.
 */
export function ClearQueryCache() {
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.clear();
  }, [queryClient]);
  return null;
}
