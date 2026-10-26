import Link from "next/link";
import type { ReactNode } from "react";
import { Money } from "@/components/shared/money";
import { plainExcerpt } from "@/lib/format";
import type { Program } from "@/types/api";
import { coverageText, poolCoverage } from "../pool-coverage";

const SCOPE_PREVIEW = 2;

/**
 * One program in the directory. The title link covers the whole card; `action` (the
 * researcher's "Submit report") sits above that link so it stays its own target.
 */
export function ProgramCard({
  program,
  href,
  action,
}: {
  program: Program;
  href: string;
  action?: ReactNode;
}) {
  const coverage = poolCoverage(program);
  const topReward = coverage?.tier.amount;
  const { inScope } = program.scope;
  const hidden = inScope.length - SCOPE_PREVIEW;

  return (
    <article className="relative flex w-full flex-col gap-4 rounded-xl border bg-card p-5 transition-colors duration-(--motion-fast) hover:border-input has-[a[data-card-link]:focus-visible]:ring-3 has-[a[data-card-link]:focus-visible]:ring-ring/70">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-lg leading-snug font-semibold text-balance">
          <Link
            href={href}
            data-card-link
            className="outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {program.title}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground">
          Run by {program.owner.name}
        </p>
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">
        {plainExcerpt(program.description)}
      </p>

      <dl className="grid grid-cols-2 gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Bounty pool</dt>
          <dd className="flex flex-col gap-0.5">
            <Money
              cents={program.poolBalance}
              tone="money"
              className="text-base font-medium"
            />
            <span className="text-xs text-muted-foreground">
              {coverageText(coverage)}
            </span>
          </dd>
        </div>
        {topReward !== undefined && (
          <div className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Top reward</dt>
            <dd>
              <Money cents={topReward} className="text-base font-medium" />
            </dd>
          </div>
        )}
      </dl>

      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">In scope</span>
        <ul className="flex min-w-0 flex-wrap items-center gap-1.5">
          {inScope.slice(0, SCOPE_PREVIEW).map((asset) => (
            <li
              key={asset}
              className="max-w-full truncate rounded-md bg-muted px-2 py-0.5 font-mono text-xs"
            >
              {asset}
            </li>
          ))}
          {hidden > 0 && (
            <li className="text-xs text-muted-foreground">+{hidden} more</li>
          )}
        </ul>
      </div>

      {action && <div className="relative z-10 mt-auto pt-1">{action}</div>}
    </article>
  );
}
