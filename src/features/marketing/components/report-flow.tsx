import {
  HandCoins,
  Landmark,
  type LucideIcon,
  ScanSearch,
  SendHorizontal,
} from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type Tone = "organization" | "researcher" | "triage" | "money";

interface FlowStep {
  actor: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  tone: Tone;
}

const STEPS: FlowStep[] = [
  {
    actor: "Program owner",
    title: "Funds the pool",
    detail:
      "Pays through Stripe. The pool grows once Stripe confirms the payment.",
    icon: Landmark,
    tone: "organization",
  },
  {
    actor: "Researcher",
    title: "Submits a report",
    detail: "Against an in-scope asset of an active program.",
    icon: SendHorizontal,
    tone: "researcher",
  },
  {
    actor: "Triage team",
    title: "Triages it",
    detail:
      "Accepts it at a severity, asks the researcher for detail, or closes it.",
    icon: ScanSearch,
    tone: "triage",
  },
  {
    actor: "Triage team",
    title: "Pays from the pool",
    detail:
      "The severity's reward moves from the pool to the researcher's wallet.",
    icon: HandCoins,
    tone: "money",
  },
];

const TONE_COLOR: Record<Tone, string> = {
  organization: "var(--role-organization)",
  researcher: "var(--role-researcher)",
  triage: "var(--role-triage)",
  money: "var(--money)",
};

/**
 * "How a report moves" (design-plan §5): a timeline with the role that acts at each step,
 * across the page from md up and down it on phones. Each step's color names its role, with the
 * name beside it in words, and each line fades into the next step's color. It describes the
 * process and claims no live numbers.
 */
export function ReportFlow({ className }: { className?: string }) {
  return (
    <ol
      className={cn(
        "reveal-group grid gap-y-8 md:grid-cols-4 md:gap-y-0",
        className,
      )}
    >
      {STEPS.map((step, index) => {
        const next = STEPS[index + 1];
        return (
          <li
            key={step.title}
            className={cn(
              `tone-${step.tone}`,
              "relative grid grid-cols-[3rem_1fr] gap-x-4 md:flex md:flex-col md:gap-4 md:pr-8",
            )}
          >
            {next && (
              <span
                aria-hidden="true"
                className="flow-line absolute top-12 -bottom-8 left-6 w-0.5 -translate-x-1/2 bg-linear-to-b from-(--tone) to-(--flow-next) md:top-6 md:right-0 md:bottom-auto md:left-12 md:h-0.5 md:w-auto md:translate-x-0 md:-translate-y-1/2 md:bg-linear-to-r"
                style={
                  { "--flow-next": TONE_COLOR[next.tone] } as CSSProperties
                }
              />
            )}
            <span className="relative flex size-12 items-center justify-center rounded-full bg-(--tone) text-primary-foreground ring-4 ring-(--tone-subtle)">
              <step.icon aria-hidden="true" className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-mono text-xs font-medium tracking-wide text-(color:--tone) uppercase">
                {step.actor}
              </p>
              <p className="text-lg font-semibold">{step.title}</p>
              <p className="text-sm text-pretty text-muted-foreground">
                {step.detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
