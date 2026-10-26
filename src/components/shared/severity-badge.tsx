import { Badge } from "@/components/ui/badge";
import { SEVERITY_LABEL } from "@/lib/constants/domain";
import { cn } from "@/lib/utils";
import type { Severity } from "@/types/api";

// Severity is ordinal, so the ramp runs yellow to crimson and a four-step meter repeats the
// level for anyone who can't tell the hues apart (design-plan §4.1).
const SEVERITY_STYLE: Record<Severity, { level: number; className: string }> = {
  LOW: { level: 1, className: "bg-severity-low-subtle text-severity-low" },
  MEDIUM: {
    level: 2,
    className: "bg-severity-medium-subtle text-severity-medium",
  },
  HIGH: { level: 3, className: "bg-severity-high-subtle text-severity-high" },
  CRITICAL: {
    level: 4,
    className: "bg-severity-critical-subtle text-severity-critical",
  },
};

// Each bar a little taller than the last, like a signal meter.
const BARS = [
  { step: 1, height: "h-[55%]" },
  { step: 2, height: "h-[70%]" },
  { step: 3, height: "h-[85%]" },
  { step: 4, height: "h-full" },
] as const;

/** Meter, label, and color for a severity. Untriaged reports have none and show "Unrated". */
export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity | null;
  className?: string;
}) {
  const style = severity ? SEVERITY_STYLE[severity] : null;
  const level = style?.level ?? 0;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1.5",
        style ? style.className : "bg-muted text-muted-foreground",
        className,
      )}
    >
      <span aria-hidden="true" className="flex h-2.5 items-end gap-px">
        {BARS.map(({ step, height }) => (
          <span
            key={step}
            className={cn(
              "w-0.75 rounded-full bg-current",
              height,
              step <= level ? "opacity-100" : "opacity-25",
            )}
          />
        ))}
      </span>
      <span className="sr-only">Severity: </span>
      {severity ? SEVERITY_LABEL[severity] : "Unrated"}
    </Badge>
  );
}
