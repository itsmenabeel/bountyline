import { cn } from "@/lib/utils";

interface FlowStep {
  actor: string;
  title: string;
  detail: string;
  money?: boolean;
}

const STEPS: FlowStep[] = [
  {
    actor: "Program owner",
    title: "Funds the pool",
    detail:
      "Pays through Stripe. The pool grows once Stripe confirms the payment.",
    money: true,
  },
  {
    actor: "Researcher",
    title: "Submits a report",
    detail: "Against an in-scope asset of an active program.",
  },
  {
    actor: "Triage team",
    title: "Triages it",
    detail:
      "Accepts it at a severity, asks the researcher for detail, or closes it.",
  },
  {
    actor: "Triage team",
    title: "Pays from the pool",
    detail:
      "The severity's reward moves from the pool to the researcher's wallet.",
    money: true,
  },
];

/**
 * "How a report moves" (design-plan §5): the disclosure track as an explainer, with the
 * role that acts at each step. It describes the process and claims no live numbers. Money
 * steps get the money-green node; the rest use the track's completed-node ink.
 */
export function ReportFlow({ className }: { className?: string }) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {STEPS.map((step, index) => {
        const last = index === STEPS.length - 1;
        return (
          <li key={step.title} className="grid grid-cols-[1.25rem_1fr] gap-x-4">
            <div className="flex flex-col items-center" aria-hidden="true">
              <span
                className={cn(
                  "mt-1.5 size-3 shrink-0 rounded-full",
                  step.money ? "bg-money" : "bg-foreground",
                )}
              />
              {!last && <span className="my-1 w-0.5 flex-1 bg-border" />}
            </div>
            <div className={cn("flex flex-col gap-0.5", !last && "pb-6")}>
              <p className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {step.actor}
              </p>
              <p className="font-semibold">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
