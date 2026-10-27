"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PendingLabel } from "@/components/shared/pending-label";
import { QueryError } from "@/components/shared/query-error";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FundDialog } from "@/features/payments/components/fund-dialog";
import { clientQuery } from "@/lib/query/descriptor";
import type { OwnerProgramTab } from "../owner-tabs";
import { programDetailQuery } from "../queries";
import { ProgramHeader, ProgramOverview } from "./program-detail";
import { ProgramSettings } from "./program-settings";

/** Writes the tab into the URL without a server round trip; Overview is the default. */
function writeTab(tab: OwnerProgramTab) {
  const url = new URL(window.location.href);
  if (tab === "overview") url.searchParams.delete("tab");
  else url.searchParams.set("tab", tab);
  window.history.replaceState(null, "", url);
}

/**
 * The owner's program page: header, then Overview and Settings tabs synced to `?tab=`
 * (design-plan §7.4). It reads the program through TanStack Query, seeded by the server
 * page, so a status change shows in the header the moment the owner makes it.
 */
export function OwnerProgramView({
  id,
  initialTab,
}: {
  id: string;
  initialTab: OwnerProgramTab;
}) {
  const [tab, setTab] = useState(initialTab);
  // Settings stays mounted once opened, so a look at Overview keeps unsaved edits.
  const [settingsOpened, setSettingsOpened] = useState(
    initialTab === "settings",
  );
  // Set by a delete, so this query stops before the program is gone.
  const [leaving, setLeaving] = useState(false);
  const query = useQuery({
    ...clientQuery(programDetailQuery(id)),
    enabled: !leaving,
  });

  if (leaving) {
    return (
      <output className="flex items-center gap-2 text-sm">
        <PendingLabel>Opening your programs</PendingLabel>
      </output>
    );
  }
  if (!query.data) {
    return query.isError ? (
      <QueryError
        title="We couldn't load this program."
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    ) : null;
  }

  const program = query.data;
  return (
    <article className="flex flex-col gap-6">
      <ProgramHeader
        program={program}
        directory={{ href: "/owner/programs", label: "Programs" }}
        showStatus
      />
      <Tabs
        value={tab}
        onValueChange={(next) => {
          const value = next as OwnerProgramTab;
          setTab(value);
          if (value === "settings") setSettingsOpened(true);
          writeTab(value);
        }}
        className="gap-6"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <ProgramOverview
            program={program}
            action={
              program.status !== "CLOSED" && <FundDialog program={program} />
            }
          />
        </TabsContent>
        <TabsContent
          value="settings"
          forceMount={settingsOpened || undefined}
          className="data-[state=inactive]:hidden"
        >
          <ProgramSettings program={program} onLeave={() => setLeaving(true)} />
        </TabsContent>
      </Tabs>
    </article>
  );
}
