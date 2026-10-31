import { ArrowRight, Building2, ScanSearch } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { HeroBackdrop } from "@/features/marketing/components/hero-backdrop";
import {
  NewestPrograms,
  NewestProgramsSkeleton,
} from "@/features/marketing/components/newest-programs";
import { PageTransition } from "@/features/marketing/components/page-transition";
import {
  PlatformStats,
  PlatformStatsSkeleton,
} from "@/features/marketing/components/platform-stats";
import { ReportFlow } from "@/features/marketing/components/report-flow";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  description:
    "Organizations fund a bounty pool through Stripe. Researchers report what they find, and our triage team pays valid reports from that pool.",
  path: "/",
});

const AUDIENCES = [
  {
    id: "researchers",
    icon: ScanSearch,
    tone: "tone-researcher",
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
    icon: Building2,
    tone: "tone-organization",
    title: "For organizations",
    lede: "Set a scope and reward tiers, then fund the pool through Stripe.",
    points: [
      "Our triage team reviews each report and decides the severity it pays at.",
      "Money leaves the pool only for reports the team accepts and pays.",
    ],
    cta: { href: "/register", label: "Fund a program" },
  },
] as const;

/** design-plan §7.1: centered hero, platform numbers, the report timeline, newest programs, audiences. */
export default function Home() {
  return (
    <PageTransition>
      <div className="flex w-full flex-col">
        <section className="relative isolate overflow-hidden border-b">
          <HeroBackdrop />
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-24 text-center md:px-6 md:py-36">
            <h1 className="rise-in text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Offer bounties. Find and report vulnerabilities. Get paid.{" "}
              <span className="text-primary sm:block">All in one place.</span>
            </h1>
            <p className="rise-in max-w-prose text-lg text-pretty text-muted-foreground [--enter-i:1]">
              Organizations fund a bounty pool. Researchers report what they
              find, and our triage team pays valid reports from the reward pool.
              A single platform for all your bug bounty needs.
            </p>
            <div className="rise-in flex w-full flex-col justify-center gap-3 pt-2 [--enter-i:2] sm:w-auto sm:flex-row">
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
        </section>

        <div className="mx-auto flex w-full max-w-page flex-col gap-20 px-4 py-14 md:px-6 md:py-20 lg:px-8">
          <Suspense fallback={<PlatformStatsSkeleton />}>
            <PlatformStats />
          </Suspense>

          <section
            aria-labelledby="report-flow-heading"
            className="flex flex-col gap-8"
          >
            <h2
              id="report-flow-heading"
              className="reveal text-2xl font-semibold"
            >
              How a report moves
            </h2>
            <ReportFlow />
          </section>

          <section
            aria-labelledby="newest-programs-heading"
            className="flex flex-col gap-4"
          >
            <div className="reveal flex items-end justify-between gap-4">
              <h2
                id="newest-programs-heading"
                className="text-2xl font-semibold"
              >
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

          <div className="reveal-group grid gap-4 md:grid-cols-2">
            {AUDIENCES.map((audience) => (
              <section
                key={audience.id}
                aria-labelledby={`audience-${audience.id}`}
                className={`${audience.tone} flex flex-col gap-4 rounded-xl border border-[color-mix(in_oklab,var(--tone)_35%,var(--border))] bg-linear-to-br from-(--tone-subtle) to-card to-70% p-6 transition-[translate] duration-(--motion-base) ease-out motion-safe:hover:-translate-y-1`}
              >
                <span className="flex size-11 items-center justify-center rounded-lg bg-(--tone) text-primary-foreground">
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
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm marker:text-(color:--tone)">
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
                    className="inline-flex items-center text-sm font-medium text-(color:--tone) underline-offset-4 hover:underline"
                  >
                    See the steps
                  </Link>
                </div>
              </section>
            ))}
          </div>

          <section
            aria-labelledby="closing-heading"
            className="reveal flex flex-col items-start gap-5 rounded-xl bg-primary px-6 py-10 text-primary-foreground md:flex-row md:items-center md:justify-between md:px-10"
          >
            <div className="flex flex-col gap-2">
              <h2 id="closing-heading" className="text-2xl font-semibold">
                Fund a pool, or start reporting.
              </h2>
              <p className="max-w-prose text-primary-foreground/85">
                You pick a role when you sign up. The demo accounts on the
                sign-in page let you try each one first.
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
      </div>
    </PageTransition>
  );
}
