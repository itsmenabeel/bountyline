import Link from "next/link";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * One headline number: a label, the value, and an optional line under it. Render it inside
 * a <dl> (each card is a dt/dd group). With `href`, the value links to the list behind the
 * number and the link covers the whole card.
 */
export function StatCard({
  label,
  value,
  helper,
  href,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  href?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col gap-1 rounded-xl border bg-card p-4",
        href &&
          "transition-colors duration-(--motion-fast) hover:border-input has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/70",
      )}
    >
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold tracking-tight">
        {href ? (
          <Link
            href={href}
            className="inline-block min-w-6 outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
      {helper && <dd className="text-xs text-muted-foreground">{helper}</dd>}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border bg-card p-4"
      aria-hidden="true"
    >
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-20" />
    </div>
  );
}
