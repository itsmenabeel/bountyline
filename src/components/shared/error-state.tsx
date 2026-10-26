"use client";

import { CircleAlertIcon, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

/** The reference Next attaches to a server error, which matches the server log entry. */
function digestOf(error: unknown) {
  if (error instanceof Error && "digest" in error) {
    const { digest } = error as Error & { digest?: unknown };
    return typeof digest === "string" ? digest : undefined;
  }
  return undefined;
}

/**
 * The body of every error boundary: what failed, "Try again" (Next's `retry()`, which
 * re-fetches the segment's data), and a way out. In production Next replaces a server
 * error's message with a generic one, so only errors thrown in the browser can name their
 * cause; server failures show the reference instead. No stack traces (design-plan §7.6).
 */
export function ErrorState({
  error,
  retry,
  home,
}: {
  error: unknown;
  retry: () => void;
  home: { href: string; label: string };
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [retrying, startRetry] = useTransition();
  const digest = digestOf(error);

  useEffect(() => {
    // The server logs the full error under the same digest.
    console.error(error);
    heading.current?.focus();
  }, [error]);

  const cause = isApiError(error)
    ? error.userMessage
    : "Something went wrong while loading it. The server may be starting up or busy, so try again in a minute.";

  return (
    <div className="flex flex-col items-start gap-4 py-12">
      <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <CircleAlertIcon aria-hidden="true" className="size-5" />
      </span>
      <div className="flex max-w-prose flex-col gap-2">
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight outline-none"
        >
          This page didn&apos;t load.
        </h1>
        <p className="text-muted-foreground">{cause}</p>
        {digest && (
          <p className="text-sm text-muted-foreground">
            Reference{" "}
            <span className="font-mono text-foreground select-all">
              {digest}
            </span>
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          onClick={() => startRetry(() => retry())}
          aria-disabled={retrying || undefined}
        >
          <RotateCcw
            aria-hidden="true"
            className={cn(retrying && "animate-spin")}
          />
          {retrying ? "Trying again" : "Try again"}
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={home.href}>{home.label}</Link>
        </Button>
      </div>
    </div>
  );
}
