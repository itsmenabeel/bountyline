import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Money } from "@/components/shared/money";
import { SeverityBadge } from "@/components/shared/severity-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { formatDate } from "@/lib/format";
import type { Program } from "@/types/api";
import { coverageText, poolCoverage } from "../pool-coverage";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** Scope entries are hostnames, paths, and app ids: mono, and free to wrap anywhere. */
function AssetList({ assets }: { assets: string[] }) {
  return (
    <ul className="flex flex-col divide-y rounded-lg border bg-card">
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

/** Breadcrumb, the page's h1, the status pill when shown, and who runs the program. */
export function ProgramHeader({
  program,
  directory,
  showStatus = false,
}: {
  program: Program;
  directory: { href: string; label: string };
  showStatus?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={directory.href}>{directory.label}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">
              {program.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
            {program.title}
          </h1>
          {showStatus && <StatusBadge kind="program" status={program.status} />}
        </div>
        <p className="text-sm text-muted-foreground">
          Run by {program.owner.name}. Updated {formatDate(program.updatedAt)}.
        </p>
      </div>
    </div>
  );
}

/** Pool and rewards beside the description, scope, and rules. */
export function ProgramOverview({
  program,
  action,
  Markdown,
}: {
  program: Program;
  /** Goes under the pool, such as "Submit a report" or "Fund pool". */
  action?: ReactNode;
  /**
   * Renders the description and rules. A prop so this file imports no renderer: server pages
   * pass MarkdownView (no JS shipped), and the owner's client view passes the lazy one.
   */
  Markdown: ComponentType<{ source: string }>;
}) {
  const coverage = poolCoverage(program);
  // Highest reward first: researchers look for what the top finding pays.
  const tiers = [...program.rewardTiers].sort((a, b) => b.amount - a.amount);
  const { inScope, outOfScope, rules } = program.scope;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <aside
        aria-label="Pool and rewards"
        className="flex flex-col gap-4 lg:sticky lg:top-20 lg:order-2"
      >
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Bounty pool</span>
            <Money
              cents={program.poolBalance}
              tone="money"
              className="text-2xl font-semibold"
            />
            <span className="text-sm text-muted-foreground">
              {coverageText(coverage)}
            </span>
          </div>
          {action}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <h2 className="text-base font-semibold">Rewards</h2>
          {tiers.length > 0 ? (
            <table className="w-full text-sm">
              <caption className="sr-only">Reward for each severity</caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Severity</th>
                  <th scope="col">Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tiers.map((tier) => (
                  <tr key={tier.severity}>
                    <td className="py-2">
                      <SeverityBadge severity={tier.severity} />
                    </td>
                    <td className="py-2 text-right">
                      <Money cents={tier.amount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">
              The owner hasn't set reward tiers yet.
            </p>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col gap-8 lg:order-1">
        <Section title="About this program">
          <Markdown source={program.description} />
        </Section>
        <Section title="In scope">
          <AssetList assets={inScope} />
        </Section>
        <Section title="Out of scope">
          {outOfScope.length > 0 ? (
            <AssetList assets={outOfScope} />
          ) : (
            <p className="text-sm text-muted-foreground">
              The owner hasn't listed anything as out of scope.
            </p>
          )}
        </Section>
        {rules && (
          <Section title="Rules">
            <Markdown source={rules} />
          </Section>
        )}
      </div>
    </div>
  );
}
