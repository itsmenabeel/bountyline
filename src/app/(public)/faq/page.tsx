import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FaqSidePanel } from "@/features/marketing/components/faq-side-panel";
import { PageIntro } from "@/features/marketing/components/page-intro";
import { PageTransition } from "@/features/marketing/components/page-transition";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "FAQ",
  description:
    "Answers for researchers and program owners: funding limits, editing reports, payouts, reputation, and Stripe test mode.",
  path: "/faq",
});

interface Question {
  id: string;
  question: string;
  answer: string;
}

// Every answer restates a rule the backend enforces (implementation-plan §3.4).
const GROUPS: {
  id: string;
  title: string;
  tone: string;
  questions: Question[];
}[] = [
  {
    id: "researchers",
    title: "For researchers",
    tone: "tone-researcher",
    questions: [
      {
        id: "which-programs",
        question: "Can I report to any program?",
        answer:
          "You can report to active programs. Paused, draft, and closed programs don't take reports. Read the scope first and report against an asset it lists.",
      },
      {
        id: "edit-report",
        question: "Can I edit a report after I send it?",
        answer:
          "Yes, while it's New or Needs info. Editing a report in Needs info sends it back to triage. After that the report locks, and you can add detail in the comments.",
      },
      {
        id: "report-limit",
        question: "Is there a limit on how many reports I send?",
        answer:
          "Ten reports per account per hour. The form tells you when you've reached it.",
      },
      {
        id: "getting-paid",
        question: "Do I get paid once a report is accepted?",
        answer:
          "Payment follows acceptance. The triage team pays an accepted report from the program's pool, and the reward lands in your platform wallet balance. If the pool runs short, the report waits until the owner adds funds.",
      },
      {
        id: "reputation",
        question: "Do I earn reputation?",
        answer:
          "Each paid report adds points by severity: 1 for Low, 3 for Medium, 7 for High, and 15 for Critical.",
      },
    ],
  },
  {
    id: "owners",
    title: "For program owners",
    tone: "tone-organization",
    questions: [
      {
        id: "funding-limits",
        question: "How much can I add to a pool?",
        answer:
          "From $5.00 to $100,000.00 per payment, through Stripe. You can fund a program in any status except closed.",
      },
      {
        id: "money-out",
        question: "Does money leave the pool without my say?",
        answer:
          "Money leaves only when the triage team pays an accepted report, and only the reward for that report's severity. You set those rewards per severity.",
      },
      {
        id: "own-triage",
        question: "Can I triage reports on my own program?",
        answer:
          "No. Bountyline's triage team decides each report. You can read every report on your programs and comment to add context.",
      },
      {
        id: "change-tiers",
        question: "Can I change a reward after publishing?",
        answer:
          "You can change any tier's amount in the program's settings. A new amount applies to accepted reports the team hasn't paid yet. A saved tier stays on, since reports may already be waiting at that severity.",
      },
      {
        id: "delete-program",
        question: "Can I delete a program?",
        answer:
          "Only with an empty pool and no open reports. Otherwise, close it: a closed program takes no new reports or funds.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    tone: "tone-money",
    questions: [
      {
        id: "test-mode",
        question: "Is my card charged?",
        answer:
          "No. Stripe runs in test mode on this site. Pay with card 4242 4242 4242 4242, any future date, and any CVC.",
      },
      {
        id: "pending",
        question: "My payment says Pending. Is something wrong?",
        answer:
          "Stripe may still be confirming it. Use Check status on your Payments page to ask Stripe now. A checkout you leave unfinished turns Cancelled once Stripe closes it, within 24 hours.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <PageTransition>
      <div className="mx-auto flex w-full max-w-page flex-col gap-12 px-4 py-12 md:px-6 md:py-16 lg:px-8">
        <PageIntro
          eyebrow="FAQ"
          title="Questions people ask before they start."
        >
          <p>
            Grouped by who's asking. Still stuck?{" "}
            <Link
              href="/contact"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Write to us
            </Link>
            .
          </p>
        </PageIntro>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-14">
          <div className="flex min-w-0 flex-col gap-10">
            {GROUPS.map((group) => (
              <section
                key={group.id}
                id={group.id}
                aria-labelledby={`faq-${group.id}`}
                className={`${group.tone} reveal flex scroll-mt-24 flex-col gap-3`}
              >
                <h2
                  id={`faq-${group.id}`}
                  className="flex items-center gap-2.5 text-xl font-semibold"
                >
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-full bg-(--tone)"
                  />
                  {group.title}
                </h2>
                <Accordion
                  type="multiple"
                  className="rounded-xl border bg-card px-5"
                >
                  {group.questions.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger className="text-base">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="max-w-prose text-pretty text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}
          </div>
          <FaqSidePanel
            groups={GROUPS.map((group) => ({
              id: group.id,
              title: group.title,
              tone: group.tone,
              count: group.questions.length,
            }))}
          />
        </div>
      </div>
    </PageTransition>
  );
}
