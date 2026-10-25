"use client";

import { useAfterDelay } from "@/hooks/use-after-delay";
import { cn } from "@/lib/utils";

const SLOW_AFTER_MS = 5_000;

/**
 * Explains a long wait: Render's free tier sleeps, and the first request after that can take
 * up to a minute. The live region stays mounted so screen readers announce the text.
 */
export function ColdStartHint({
  pending,
  className,
}: {
  pending: boolean;
  className?: string;
}) {
  const slow = useAfterDelay(pending, SLOW_AFTER_MS);

  return (
    <p
      aria-live="polite"
      className={cn(
        "pt-2 text-sm text-muted-foreground",
        className,
        "empty:pt-0",
      )}
    >
      {slow
        ? "The server is waking up. This can take up to a minute on the first request."
        : null}
    </p>
  );
}
