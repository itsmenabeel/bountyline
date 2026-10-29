import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/features/marketing/components/page-intro";

export const metadata: Metadata = {
  title: "About",
  description:
    "The rules Bountyline runs on: who pays, who triages, and how money moves from Stripe to a researcher's wallet.",
};

const SECTIONS = [
  {
    id: "who-pays",
    title: "Who pays",
    body: [
      "A company runs each program and funds its pool through Stripe. Rewards come out of that pool, so a program pays only what it holds.",
      "The owner sets a reward for each severity, from Low to Critical. A higher severity can't pay less than a lower one, and the program page shows every tier before a researcher starts testing.",
    ],
  },
  {
    id: "who-triages",
    title: "Who triages",
    body: [
      "Bountyline's triage team reads each report, asks the researcher for detail when it needs more, and decides whether it's valid, a duplicate, or out of scope.",
      "Program owners read the reports on their programs and comment on them, but they can't accept, reject, or pay one. The people who decide what a report is worth don't hold the money it's paid from.",
    ],
  },
  {
    id: "money",
    title: "How money moves",
    body: [
      "Money comes in through Stripe Checkout. The pool grows once Stripe confirms the payment; a checkout you leave unfinished adds nothing.",
      "Money goes out when the triage team pays an accepted report. The reward for its severity moves from the pool to the researcher's wallet in one step. A pool can't drop below zero, and a report gets paid once.",
    ],
  },
  {
    id: "records",
    title: "What we record",
    body: [
      "The audit log keeps each status change, payout, funding, and account change, with who made it and when. Admins review it from their dashboard.",
      "An admin can ban an account that breaks the rules. Banning an owner pauses their active programs until the owner resumes them.",
    ],
  },
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-12 px-4 py-12 md:px-6 md:py-16 lg:px-8">
      <PageIntro eyebrow="About" title="One pool, one triage team, one record.">
        <p>
          Bountyline connects companies that want their software tested with
          researchers who find what&apos;s wrong with it. This page covers the
          rules the platform runs on.
        </p>
      </PageIntro>

      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            aria-labelledby={`about-${section.id}`}
            className="flex max-w-prose flex-col gap-3"
          >
            <h2 id={`about-${section.id}`} className="text-xl font-semibold">
              {section.title}
            </h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="leading-relaxed text-pretty">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <section
        aria-labelledby="about-demo"
        className="flex max-w-3xl flex-col gap-2 rounded-xl border bg-card p-6"
      >
        <h2 id="about-demo" className="text-lg font-semibold">
          This build runs in test mode
        </h2>
        <p className="text-muted-foreground">
          Stripe runs in test mode here, so no real card gets charged. The{" "}
          <Link
            href="/how-it-works"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            how it works
          </Link>{" "}
          page walks through each role, and the{" "}
          <Link
            href="/faq"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            FAQ
          </Link>{" "}
          lists the limits.
        </p>
      </section>
    </div>
  );
}
