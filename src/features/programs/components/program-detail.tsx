import type { ReactNode } from "react";
import { MarkdownView } from "@/components/shared/markdown-view";
import type { Program } from "@/types/api";
import { ProgramHeader, ProgramOverview } from "./program-overview";

/**
 * Everything a researcher reads before testing: pool and what it covers, the reward tiers,
 * scope, and rules. Shared by the public, researcher, and admin detail pages, which differ
 * in the breadcrumb, whether the status shows, and the action under the pool. The owner's
 * page composes ProgramHeader and ProgramOverview itself, with tabs between them.
 */
export function ProgramDetail({
  program,
  directory,
  showStatus = false,
  action,
}: {
  program: Program;
  /** The list this page came from, for the breadcrumb. */
  directory: { href: string; label: string };
  /** Public and researcher pages only ever show ACTIVE programs, so they leave it out. */
  showStatus?: boolean;
  action?: ReactNode;
}) {
  return (
    <article className="flex flex-col gap-8">
      <ProgramHeader
        program={program}
        directory={directory}
        showStatus={showStatus}
      />
      <ProgramOverview
        program={program}
        action={action}
        Markdown={MarkdownView}
      />
    </article>
  );
}
