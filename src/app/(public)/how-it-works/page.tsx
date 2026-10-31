import {
  ArrowDown,
  ArrowRight,
  Building2,
  ClipboardList,
  Compass,
  CreditCard,
  Eye,
  FilePenLine,
  HandCoins,
  ListChecks,
  type LucideIcon,
  MessagesSquare,
  Rocket,
  ScanSearch,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { SeverityBadge } from "@/components/shared/severity-badge";
import { PageIntro } from "@/features/marketing/components/page-intro";
import { PageTransition } from "@/features/marketing/components/page-transition";
import { ReportFlow } from "@/features/marketing/components/report-flow";
import { pageMetadata } from "@/lib/metadata";
import type { Severity } from "@/types/api";

export const metadata = pageMetadata({
  title: "How it works",
  description:
    "The steps each role takes on Bountyline: researchers report, organizations fund and follow, and the triage team decides and pays.",
  path: "/how-it-works",
});

interface Step {
  title: string;
  detail: string;
  /** The screen the person uses for this step. */
  screen: string;
  icon: LucideIcon;
}

// How far each step's card leans into its role color, so the path deepens toward the end.
const STEP_SHADES = [5, 9, 13, 17];

const ROLES: {
  id: string;
  title: string;
  lede: string;
  tone: string;
  icon: LucideIcon;
  steps: Step[];
}[] = [
  {
    id: "researchers",
    title: "Researchers",
    lede: "You test a program's assets and report what you find.",
    tone: "tone-researcher",
    icon: ScanSearch,
    steps: [
      {
        title: "Pick a program and read its scope",
        detail:
          "Each program lists the assets you may test, the ones you may not, and what it pays per severity.",
        screen: "Programs",
        icon: Compass,
      },
      {
        title: "Submit a report",
        detail:
          "A three-step form checks the program and scope, takes your write-up in Markdown, and shows it back before you send it.",
        screen: "Submit a report",
        icon: FilePenLine,
      },
      {
        title: "Answer the triage team",
        detail:
          "If the team asks for more detail, edit the report. Your edit sends it back to triage.",
        screen: "My reports",
        icon: MessagesSquare,
      },
      {
        title: "Get paid",
        detail:
          "Once the team pays your report, the reward lands in your wallet balance and your reputation grows.",
        screen: "Earnings",
        icon: Wallet,
      },
    ],
  },
  {
    id: "owners",
    title: "Program owners",
    lede: "Your organization runs a program and funds the rewards.",
    tone: "tone-organization",
    icon: Building2,
    steps: [
      {
        title: "Create the program",
        detail:
          "Name it, list the in-scope and out-of-scope assets, and set a reward for each severity you want to pay.",
        screen: "New program",
        icon: ClipboardList,
      },
      {
        title: "Fund the pool through Stripe",
        detail:
          "Add $5.00 to $100,000.00 per payment. The pool grows once Stripe confirms it.",
        screen: "Fund pool",
        icon: CreditCard,
      },
      {
        title: "Publish it",
        detail:
          "An active program takes reports. You can pause it, resume it, or close it for good.",
        screen: "Program settings",
        icon: Rocket,
      },
      {
        title: "Follow the reports",
        detail:
          "Read each report on your programs and comment to add context. The overview flags pools that can't cover their top reward.",
        screen: "Reports",
        icon: Eye,
      },
    ],
  },
  {
    id: "triage",
    title: "Triage team",
    lede: "Bountyline's admins decide each report and pay the valid ones.",
    tone: "tone-triage",
    icon: ShieldCheck,
    steps: [
      {
        title: "Work the queue",
        detail:
          "The oldest reports sit at the top. Each one moves to triage, gets a question back to the researcher, or closes as rejected or duplicate.",
        screen: "Triage queue",
        icon: ListChecks,
      },
      {
        title: "Accept at a severity",
        icon: ShieldCheck,
        detail:
          "The severity picks the reward from the program's tiers. The panel shows what the pool holds after the payout.",
        screen: "Report triage",
      },
      {
        title: "Pay from the pool",
        icon: HandCoins,
        detail:
          "A confirm step names the researcher, the amount, and the pool after. A report pays once, and the pool can't go below zero.",
        screen: "Report triage",
      },
    ],
  },
];

const REPUTATION: { severity: Severity; points: number; example: string }[] = [
  {
    severity: "LOW",
    points: 1,
    example: "A missing security header with little impact on its own.",
  },
  {
    severity: "MEDIUM",
    points: 3,
    example: "Reflected cross-site scripting that needs a victim's click.",
  },
  {
    severity: "HIGH",
    points: 7,
    example: "Reading another customer's records through a broken check.",
  },
  {
    severity: "CRITICAL",
    points: 15,
    example: "Taking over accounts or running code on the server.",
  },
];

export default function HowItWorksPage() {
  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-page flex-col gap-14 px-4 py-12 md:px-6 md:py-16 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <PageIntro
            eyebrow="How it works"
            title="Three roles, one path from report to payout."
          >
            <p>
              Researchers report, organizations fund and follow along, and the
              triage team decides what each report is worth. Jump to your role.
            </p>
          </PageIntro>
          <nav
            aria-label="On this page"
            className="rise-in flex flex-wrap gap-2 [--enter-i:1] lg:justify-end lg:pt-8"
          >
            {[
              ...ROLES,
              { id: "rewards", title: "Rewards", tone: "tone-money" },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`${item.tone} inline-flex h-9 items-center gap-2 rounded-full border bg-card px-4 text-sm font-medium outline-none hover:border-input hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/70 pointer-coarse:h-11`}
              >
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-(--tone)"
                />
                {item.title}
              </a>
            ))}
          </nav>
        </div>

        <section aria-labelledby="flow-heading" className="flex flex-col gap-8">
          <div className="reveal flex max-w-prose flex-col gap-2">
            <h2 id="flow-heading" className="text-2xl font-semibold">
              How a report moves
            </h2>
            <p className="text-muted-foreground">
              Every report follows the same track. The progress line on a report
              page shows which step it has reached.
            </p>
          </div>
          <ReportFlow />
        </section>

        {ROLES.map((role) => (
          <section
            key={role.id}
            id={role.id}
            aria-labelledby={`${role.id}-heading`}
            className={`${role.tone} flex scroll-mt-24 flex-col gap-6`}
          >
            <div className="reveal flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-(--tone) text-primary-foreground">
                <role.icon aria-hidden="true" className="size-6" />
              </span>
              <div className="flex flex-col gap-0.5">
                <h2
                  id={`${role.id}-heading`}
                  className="text-2xl font-semibold"
                >
                  {role.title}
                </h2>
                <p className="text-muted-foreground">{role.lede}</p>
              </div>
            </div>
            <ol className="reveal-group grid gap-10 xl:auto-cols-fr xl:grid-flow-col">
              {role.steps.map((step, index) => (
                <li
                  key={step.title}
                  className="relative flex flex-col gap-3 rounded-xl border border-[color-mix(in_oklab,var(--tone)_30%,var(--border))] bg-[color-mix(in_oklab,var(--tone)_var(--shade),var(--card))] p-5 transition-[translate] duration-(--motion-base) ease-out motion-safe:hover:-translate-y-1"
                  style={
                    { "--shade": `${STEP_SHADES[index]}%` } as CSSProperties
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-(--tone) text-primary-foreground">
                      <step.icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="font-mono text-xs font-medium">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-pretty">{step.detail}</p>
                  <p className="mt-auto pt-2 text-xs">
                    <span>Screen: </span>
                    <span className="font-mono font-medium">{step.screen}</span>
                  </p>
                  {index < role.steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-9 left-1/2 z-10 flex size-8 -translate-x-1/2 items-center justify-center rounded-full bg-(--tone-subtle) text-(color:--tone) xl:top-1/2 xl:-right-9 xl:bottom-auto xl:left-auto xl:translate-x-0 xl:-translate-y-1/2"
                    >
                      <ArrowDown className="size-4 xl:hidden" />
                      <ArrowRight className="hidden size-4 xl:block" />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}

        <section
          id="rewards"
          aria-labelledby="rewards-heading"
          className="flex scroll-mt-24 flex-col gap-5"
        >
          <div className="reveal flex max-w-prose flex-col gap-1">
            <h2 id="rewards-heading" className="text-2xl font-semibold">
              Rewards and reputation
            </h2>
            <p className="text-muted-foreground">
              Each program sets its own reward per severity, up to
              $1,000,000.00, and its page lists them. Reputation is the same
              everywhere: a paid report adds points by severity.
            </p>
          </div>
          <div className="reveal overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[32rem] text-sm">
              <caption className="sr-only">
                Reputation points per paid report, by severity
              </caption>
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium">
                    Severity
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Reputation
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    A typical finding
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {REPUTATION.map((row) => (
                  <tr key={row.severity}>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={row.severity} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      +{row.points}
                    </td>
                    <td className="px-4 py-3 text-pretty text-muted-foreground">
                      {row.example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Ready to look?{" "}
            <Link
              href="/programs"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Browse active programs
            </Link>
            .
          </p>
        </section>
      </div>
    </PageTransition>
  );
}
