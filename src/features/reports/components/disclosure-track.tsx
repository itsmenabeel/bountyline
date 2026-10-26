import { CheckIcon, RotateCcw, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Money } from "@/components/shared/money";
import { SEVERITY_LABEL } from "@/lib/constants/domain";
import { formatDate } from "@/lib/format";
import { shortId } from "@/lib/ids";
import { cn } from "@/lib/utils";
import type { Cents, IsoDateString, ReportStatus, Severity } from "@/types/api";
import {
  buildTrack,
  type Track,
  type TrackStep,
  type TrackStepState,
} from "../track";

interface DisclosureTrackProps {
  status: ReportStatus;
  /** "full" on report pages; "compact" in table rows and cards. */
  variant?: "full" | "compact";
  severity?: Severity | null;
  /** The payout, shown on the Rewarded step. */
  amount?: Cents;
  submittedAt?: IsoDateString;
  /** When the report last changed status, shown on the current step. */
  updatedAt?: IsoDateString;
  duplicateOfId?: string | null;
}

/**
 * The report's place in triage, drawn as the backend's state machine (design-plan §5).
 * Done steps are solid, the current one is ringed in the primary color (the same "you are
 * here" as the active nav item), and later ones are hollow. Rewarded fills money green;
 * rejected and duplicate reports end at a cap. No hooks, so it renders on either side.
 */
export function DisclosureTrack({
  variant = "full",
  ...props
}: DisclosureTrackProps) {
  const track = buildTrack(props.status);
  return variant === "compact" ? (
    <CompactTrack track={track} />
  ) : (
    <FullTrack track={track} {...props} />
  );
}

// ---- Compact: ●━●━◉─○ with the summary as its name ----

const COMPACT_NODE: Record<TrackStepState, string> = {
  complete: "size-2 bg-foreground",
  current: "size-2.5 border-2 border-primary",
  upcoming: "size-2 border-[1.5px] border-muted-foreground",
};

function CompactTrack({ track }: { track: Track }) {
  return (
    <span
      role="img"
      aria-label={track.summary}
      className="inline-flex items-center"
    >
      {track.steps.map((step, index) => (
        <span key={step.id} className="inline-flex items-center">
          {index > 0 && (
            <span
              className={cn(
                "h-0.5 w-2.5",
                step.state === "upcoming"
                  ? "bg-muted-foreground/40"
                  : "bg-foreground",
              )}
            />
          )}
          {step.id === "closed" ? (
            <XIcon className="size-3 text-muted-foreground" strokeWidth={3} />
          ) : (
            <span
              className={cn(
                "rounded-full",
                COMPACT_NODE[step.state],
                step.id === "rewarded" &&
                  step.state === "complete" &&
                  "size-2.5 bg-money",
              )}
            />
          )}
        </span>
      ))}
    </span>
  );
}

// ---- Full: an ordered list, vertical on phones and horizontal from sm ----

const STATE_TEXT: Record<TrackStepState, string | null> = {
  complete: "completed",
  current: null, // aria-current announces it
  upcoming: "not reached yet",
};

function Node({ step }: { step: TrackStep }) {
  const base =
    "relative z-10 flex size-4 shrink-0 items-center justify-center rounded-full";

  if (step.id === "closed") {
    return (
      <span
        className={cn(
          base,
          "border-[1.5px] border-muted-foreground bg-muted text-muted-foreground",
        )}
      >
        <XIcon className="size-2.5" strokeWidth={3} />
      </span>
    );
  }
  if (step.id === "rewarded" && step.state === "complete") {
    return (
      <span
        className={cn(base, "bg-money text-background ring-4 ring-money/20")}
      >
        <CheckIcon className="size-2.5" strokeWidth={3.5} />
      </span>
    );
  }
  if (step.state === "complete") {
    return (
      <span className={cn(base, "bg-foreground text-background")}>
        <CheckIcon className="size-2.5" strokeWidth={3.5} />
      </span>
    );
  }
  if (step.state === "current") {
    return (
      <span
        className={cn(
          base,
          "border-2 border-primary bg-card ring-4 ring-primary/20",
        )}
      >
        <span className="size-1.5 rounded-full bg-primary" />
      </span>
    );
  }
  return <span className={cn(base, "border-2 border-muted-foreground")} />;
}

/**
 * The line from one node to the next. A dashed base shows the path ahead; the solid fill
 * grows over it when the report moves on (it animates only on a change, never on load).
 */
function Connector({ filled }: { filled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="absolute top-5 bottom-1 left-1.75 w-0.5 sm:top-1.75 sm:right-1 sm:bottom-auto sm:left-5 sm:h-0.5 sm:w-auto"
    >
      <span className="absolute inset-0 border-l-2 border-dashed border-muted-foreground/60 sm:border-t-2 sm:border-l-0" />
      <span
        className={cn(
          "absolute inset-0 origin-top bg-foreground transition-transform duration-(--motion-base) ease-out sm:origin-left",
          filled ? "scale-100" : "scale-y-0 sm:scale-x-0 sm:scale-y-100",
        )}
      />
    </span>
  );
}

function FullTrack({
  track,
  severity,
  amount,
  submittedAt,
  updatedAt,
  duplicateOfId,
}: { track: Track } & Omit<DisclosureTrackProps, "status" | "variant">) {
  function detailFor(step: TrackStep, index: number): ReactNode {
    switch (step.id) {
      case "submitted":
        return submittedAt ? formatDate(submittedAt) : null;
      case "triage":
        if (track.needsInfo) {
          return (
            <span className="inline-flex items-center gap-1">
              <RotateCcw aria-hidden="true" className="size-3" />
              Needs info
            </span>
          );
        }
        break;
      case "accepted":
        if (step.state !== "upcoming" && severity) {
          return `Severity: ${SEVERITY_LABEL[severity]}`;
        }
        break;
      case "rewarded":
        if (step.state === "complete" && amount !== undefined) {
          return (
            <>
              <Money cents={amount} tone="money" /> from the pool
            </>
          );
        }
        return null;
      case "closed":
        if (track.outcome === "duplicate") {
          return duplicateOfId
            ? `Duplicate of ${shortId(duplicateOfId, "R")}`
            : "Matches an earlier report.";
        }
        return "The triage team rejected this report.";
    }
    return index === track.currentIndex && index > 0 && updatedAt
      ? `Since ${formatDate(updatedAt)}`
      : null;
  }

  return (
    <ol
      aria-label="Report progress"
      className="grid sm:auto-cols-fr sm:grid-flow-col"
    >
      {track.steps.map((step, index) => {
        const isCurrent = index === track.currentIndex;
        const next = track.steps[index + 1];
        const detail = detailFor(step, index);
        const stateText = isCurrent ? null : STATE_TEXT[step.state];
        return (
          <li
            key={step.id}
            aria-current={isCurrent ? "step" : undefined}
            className="relative flex gap-3 pb-6 last:pb-0 sm:flex-col sm:gap-2 sm:pr-4 sm:pb-0"
          >
            <Node step={step} />
            {next && <Connector filled={next.state !== "upcoming"} />}
            <div className="flex min-w-0 flex-col gap-0.5 sm:pr-2">
              <span
                className={cn(
                  "text-sm leading-4",
                  step.state === "upcoming"
                    ? "text-muted-foreground"
                    : "font-medium text-foreground",
                  isCurrent && "font-semibold",
                )}
              >
                {step.label}
                {stateText && <span className="sr-only">, {stateText}</span>}
              </span>
              {detail && (
                <span className="text-xs text-muted-foreground">{detail}</span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
