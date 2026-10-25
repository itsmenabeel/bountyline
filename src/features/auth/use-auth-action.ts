"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { toApiError } from "@/lib/api/errors";
import type { AuthFailure } from "./actions";

/**
 * Runs one auth server action at a time and remembers which control started it, so that
 * control shows the spinner while the others disable. A successful action redirects: the
 * call rejects with Next's redirect error, which `unstable_rethrow` hands back to the router,
 * and the pending state lasts until the next page renders.
 */
export function useAuthAction<Key extends string>() {
  const [isPending, startTransition] = useTransition();
  const [running, setRunning] = useState<Key | null>(null);

  function run(
    key: Key,
    action: () => Promise<AuthFailure>,
    onFailure: (failure: AuthFailure) => void,
  ) {
    setRunning(key);
    startTransition(async () => {
      let failure: AuthFailure;
      try {
        failure = await action();
      } catch (error) {
        unstable_rethrow(error);
        // The action request itself failed, e.g. the browser went offline.
        failure = {
          ok: false,
          message: toApiError(error).userMessage,
          fieldErrors: {},
        };
      }
      setRunning(null);
      onFailure(failure);
    });
  }

  return { running: isPending ? running : null, isPending, run };
}
