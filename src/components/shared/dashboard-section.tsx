import Link from "next/link";
import { type ReactNode, useId } from "react";

/** A titled block on an overview page, with an optional "View all" link to the full list. */
export function DashboardSection({
  title,
  description,
  viewAll,
  children,
}: {
  title: string;
  description?: string;
  viewAll?: { href: string; label: string };
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex min-w-0 flex-col gap-3"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={headingId} className="text-lg font-semibold">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {viewAll && (
          <Link
            href={viewAll.href}
            className="touch-link shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {viewAll.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
