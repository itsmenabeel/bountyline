import { ArrowRight, Coins, ScanSearch } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  NewestPrograms,
  NewestProgramsSkeleton,
} from "@/features/marketing/components/newest-programs";
import {
  PlatformStats,
  PlatformStatsSkeleton,
} from "@/features/marketing/components/platform-stats";
import { ReportFlow } from "@/features/marketing/components/report-flow";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  description:
    "Companies fund a bounty pool through Stripe. Researchers report what they find, and our triage team pays valid reports from that pool.",
  path: "/",
});

const AUDIENCES = [
  {
    id: "researchers",
    icon: ScanSearch,
    title: "For researchers",
    lede: "Pick an active program, read its scope, and report what you find.",
    points: [
      "Each program lists what it pays per severity before you start.",
      "The track on every report shows where it stands in triage.",
    ],
    cta: { href: "/programs", label: "Browse programs" },
  },
  {
    id: "owners",
    icon: Coins,
    title: "For companies",
    lede: "Set a scope and reward tiers, then fund the pool through Stripe.",
    points: [
      "Our triage team reviews each report and decides the severity it pays at.",
      "Money leaves the pool only for reports the team accepts and pays.",
    ],
    cta: { href: "/register", label: "Fund a program" },
  },
] as const;

/** design-plan §7.1: hero with the report flow, platform numbers, newest programs, audiences. */
export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-20 px-4 py-14 md:px-6 md:py-20 lg:px-8">
      <section className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-5">
          <p className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Bug bounty and disclosure
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Bug reports, triaged and paid from one funded pool.
          </h1>
          <p className="max-w-prose text-lg text-pretty text-muted-foreground">
            Companies fund a bounty pool through Stripe. Researchers report what
            they find, and our triage team pays valid reports from that pool.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/programs">
                Browse programs
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">Fund a program</Link>
            </Button>
          </div>
        </div>
        <section
          aria-labelledby="report-flow-heading"
          className="flex flex-col gap-5 rounded-xl border bg-card p-6"
        >
          <h2 id="report-flow-heading" className="text-lg font-semibold">
            How a report moves
          </h2>
          <ReportFlow />
        </section>
      </section>

      <Suspense fallback={<PlatformStatsSkeleton />}>
        <PlatformStats />
      </Suspense>

      <section
        aria-labelledby="newest-programs-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex items-end justify-between gap-4">
          <h2 id="newest-programs-heading" className="text-2xl font-semibold">
            Newest programs
          </h2>
          <Link
            href="/programs"
            className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View all programs
          </Link>
        </div>
        <Suspense fallback={<NewestProgramsSkeleton />}>
          <NewestPrograms />
        </Suspense>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {AUDIENCES.map((audience) => (
          <section
            key={audience.id}
            aria-labelledby={`audience-${audience.id}`}
            className="flex flex-col gap-4 rounded-xl border bg-card p-6"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <audience.icon aria-hidden="true" className="size-5" />
            </span>
            <div className="flex flex-col gap-2">
              <h2
                id={`audience-${audience.id}`}
                className="text-xl font-semibold"
              >
                {audience.title}
              </h2>
              <p className="text-muted-foreground">{audience.lede}</p>
            </div>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm">
              {audience.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 pt-2">
              <Button asChild variant="outline">
                <Link href={audience.cta.href}>{audience.cta.label}</Link>
              </Button>
              <Link
                href={`/how-it-works#${audience.id}`}
                className="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                See the steps
              </Link>
            </div>
          </section>
        ))}
      </div>

      <section
        aria-labelledby="closing-heading"
        className="flex flex-col items-start gap-5 rounded-xl bg-primary px-6 py-10 text-primary-foreground md:flex-row md:items-center md:justify-between md:px-10"
      >
        <div className="flex flex-col gap-2">
          <h2 id="closing-heading" className="text-2xl font-semibold">
            Fund a pool, or start reporting.
          </h2>
          <p className="max-w-prose text-primary-foreground/85">
            You pick a role when you sign up. The demo accounts on the sign-in
            page let you try each one first.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" variant="secondary">
            <Link href="/register">Create an account</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
