import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

/** The track mark: a report moving from submitted, through triage, to its current step. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn("size-7 shrink-0", className)}
    >
      <rect width="32" height="32" rx="7" className="fill-primary" />
      <g className="stroke-primary-foreground fill-primary-foreground">
        <path d="M8 16h16" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="8" cy="16" r="3" stroke="none" />
        <circle cx="16" cy="16" r="3" stroke="none" />
        <circle
          cx="24"
          cy="16"
          r="3.25"
          strokeWidth="2"
          className="fill-primary"
        />
      </g>
    </svg>
  );
}

export function Logo({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/70",
        className,
      )}
    >
      <LogoMark />
      <span className="text-lg">{SITE_NAME}</span>
    </Link>
  );
}
