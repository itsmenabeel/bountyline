"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Program } from "@/types/api";
import { programKeys } from "./queries";

/**
 * After a save, the response is the program as stored: it replaces the page's copy, and
 * every list showing programs refetches (title, status, and tiers show there).
 */
export function useSavedProgram() {
  const queryClient = useQueryClient();
  return useCallback(
    (program: Program) => {
      queryClient.setQueryData(programKeys.detail(program.id), program);
      void queryClient.invalidateQueries({ queryKey: programKeys.lists() });
    },
    [queryClient],
  );
}
