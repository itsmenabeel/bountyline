import type { Metadata } from "next";
import Link from "next/link";
import { SeverityBadge } from "@/components/shared/severity-badge";
import { PageIntro } from "@/features/marketing/components/page-intro";
import { ReportFlow } from "@/features/marketing/components/report-flow";
import type { Severity } from "@/types/api";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "The steps each role takes on Bountyline: researchers report, companies fund and follow, and the triage team decides and pays.",
};

interface Step {
  title: string;
  detail: string;
  /** The screen the person uses for this step. */
  screen: string;
}

const ROLES: { id: string; title: string; lede: string; steps: Step[] }[] = [
  {
    id: "researchers",
    title: "Researchers",
    lede: "You test a program's assets and report what you find.",
    steps: [
      {
        title: "Pick a program and read its scope",
        detail:
          "Each program lists the assets you may test, the ones you may not, and what it pays per severity.",
        screen: "Programs",
      },
      {
        title: "Submit a report",
        detail:
          "A three-step form checks the program and scope, takes your write-up in Markdown, and shows it back before you send it.",
        screen: "Submit a report",
      },
      {
        title: "Answer the triage team",
        detail:
          "If the team asks for more detail, edit the report. Your edit sends it back to triage.",
        screen: "My reports",
      },
      {
        title: "Get paid",
        detail:
          "Once the team pays your report, the reward lands in your wallet balance and your reputation grows.",
        screen: "Earnings",
      },
    ],
  },
  {
    id: "owners",
    title: "Program owners",
    lede: "Your company runs a program and funds the rewards.",
    steps: [
      {
        title: "Create the program",
        detail:
          "Name it, list the in-scope and out-of-scope assets, and set a reward for each severity you want to pay.",
        screen: "New program",
      },
      {
        title: "Fund the pool through Stripe",
        detail:
          "Add $5.00 to $100,000.00 per payment. The pool grows once Stripe confirms it.",
        screen: "Fund pool",
      },
      {
        title: "Publish it",
        detail:
          "An active program takes reports. You can pause it, resume it, or close it for good.",
        screen: "Program settings",
      },
      {
        title: "Follow the reports",
        detail:
          "Read each report on your programs and comment to add context. The overview flags pools that can't cover their top reward.",
        screen: "Reports",
      },
    ],
  },
  {
    id: "triage",
    title: "Triage team",
    lede: "Bountyline's admins decide each report and pay the valid ones.",
    steps: [
      {
        title: "Work the queue",
        detail:
          "The oldest reports sit at the top. Each one moves to triage, gets a question back to the researcher, or closes as rejected or duplicate.",
        screen: "Triage queue",
      },
      {
        title: "Accept at a severity",
        detail:
          "The severity picks the reward from the program's tiers. The panel shows what the pool holds after the payout.",
        screen: "Report triage",
      },
      {
        title: "Pay from the pool",
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
    <div className="mx-auto flex w-full max-w-page flex-col gap-14 px-4 py-12 md:px-6 md:py-16 lg:px-8">
      <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <PageIntro
          eyebrow="How it works"
          title="Three roles, one path from report to payout."
        >
          <p>
            Researchers report, companies fund and follow along, and the triage
            team decides what each report is worth. Jump to your role.
          </p>
        </PageIntro>
        <nav
          aria-label="On this page"
          className="flex flex-wrap gap-2 lg:justify-end lg:pt-8"
        >
          {[...ROLES, { id: "rewards", title: "Rewards" }].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="inline-flex h-9 items-center rounded-full border bg-card px-4 text-sm font-medium outline-none hover:border-input hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/70 pointer-coarse:h-11"
            >
              {item.title}
            </a>
          ))}
        </nav>
      </div>

      <section
        aria-labelledby="flow-heading"
        className="grid gap-6 rounded-xl border bg-card p-6 md:grid-cols-[0.8fr_1.2fr] md:p-8"
      >
        <div className="flex flex-col gap-2">
          <h2 id="flow-heading" className="text-xl font-semibold">
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
          className="flex scroll-mt-24 flex-col gap-5"
        >
          <div className="flex flex-col gap-1">
            <h2 id={`${role.id}-heading`} className="text-2xl font-semibold">
              {role.title}
            </h2>
            <p className="text-muted-foreground">{role.lede}</p>
          </div>
          <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {role.steps.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col gap-2 rounded-xl border bg-card p-5"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  Step {index + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-pretty text-muted-foreground">
                  {step.detail}
                </p>
                <p className="mt-auto pt-2 text-xs">
                  <span className="text-muted-foreground">Screen: </span>
                  <span className="font-mono">{step.screen}</span>
                </p>
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
        <div className="flex max-w-prose flex-col gap-1">
          <h2 id="rewards-heading" className="text-2xl font-semibold">
            Rewards and reputation
          </h2>
          <p className="text-muted-foreground">
            Each program sets its own reward per severity, up to $1,000,000.00,
            and its page lists them. Reputation is the same everywhere: a paid
            report adds points by severity.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-card">
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
  );
}
