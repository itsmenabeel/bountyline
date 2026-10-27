"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactNode } from "react";
import { Money } from "@/components/shared/money";
import { SeverityBadge } from "@/components/shared/severity-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Program } from "@/types/api";

const MarkdownView = dynamic(
  () => import("@/components/shared/markdown-view").then((m) => m.MarkdownView),
  { loading: () => <Skeleton className="h-12 w-full" /> },
);

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </div>
  );
}

function Assets({ assets }: { assets: string[] }) {
  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {assets.map((asset) => (
        <li
          key={asset}
          className="px-3 py-2 font-mono text-sm [overflow-wrap:anywhere]"
        >
          {asset}
        </li>
      ))}
    </ul>
  );
}

/**
 * What a researcher checks before writing: the program's scope, rules, and rewards, in the
 * order they decide whether a finding counts. The full program page opens in a new tab so
 * the draft stays where it is.
 */
export function ProgramScopeCard({ program }: { program: Program }) {
  const { inScope, outOfScope, rules } = program.scope;
  const tiers = [...program.rewardTiers].sort((a, b) => b.amount - a.amount);

  return (
    <section
      aria-label={`Scope of ${program.title}`}
      className="flex flex-col gap-5 rounded-xl border bg-card p-5"
    >
      <Part title="In scope">
        <Assets assets={inScope} />
      </Part>
      <Part title="Out of scope">
        {outOfScope.length > 0 ? (
          <Assets assets={outOfScope} />
        ) : (
          <p className="text-sm text-muted-foreground">
            The owner hasn't listed anything as out of scope.
          </p>
        )}
      </Part>
      {rules && (
        <Part title="Rules">
          <MarkdownView source={rules} />
        </Part>
      )}
      <Part title="Rewards">
        <ul className="flex flex-col divide-y text-sm">
          {tiers.map((tier) => (
            <li
              key={tier.severity}
              className="flex items-center justify-between gap-4 py-2"
            >
              <SeverityBadge severity={tier.severity} />
              <Money cents={tier.amount} />
            </li>
          ))}
        </ul>
      </Part>
      <p className="text-sm">
        <Link
          href={`/researcher/programs/${program.id}`}
          target="_blank"
          className="underline underline-offset-4"
        >
          Open the full program page
          <span className="sr-only"> (opens in a new tab)</span>
        </Link>
      </p>
    </section>
  );
}
