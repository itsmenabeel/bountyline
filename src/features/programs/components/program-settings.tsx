"use client";

import type { Program } from "@/types/api";
import { ProgramDelete } from "./program-delete";
import { ProgramDetailsForm } from "./program-details-form";
import { ProgramScopeForm } from "./program-scope-form";
import { ProgramStatusActions } from "./program-status-actions";
import { ProgramTiersForm } from "./program-tiers-form";
import { SettingsSection } from "./settings-section";

/**
 * The owner's Settings tab (design-plan §7.4): details, scope, and tiers save on their own,
 * then status and delete. A closed program can't be edited, so only those two remain.
 * Each form resets to the saved values after its own save and leaves the others alone, so
 * unsaved edits in one card survive a save in another.
 */
export function ProgramSettings({
  program,
  onLeave,
}: {
  program: Program;
  onLeave: () => void;
}) {
  const closed = program.status === "CLOSED";

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {closed ? (
        <p className="rounded-lg border bg-card px-4 py-3 text-sm">
          Closed programs can't be edited. The Overview tab shows the program as
          researchers last saw it.
        </p>
      ) : (
        <>
          <SettingsSection
            id="settings-details"
            title="Details"
            description="The name and description researchers read first."
          >
            <ProgramDetailsForm program={program} />
          </SettingsSection>
          <SettingsSection
            id="settings-scope"
            title="Scope"
            description="Saving replaces the whole scope with these lists and rules."
          >
            <ProgramScopeForm program={program} />
          </SettingsSection>
          <SettingsSection
            id="settings-tiers"
            title="Reward tiers"
            description="What each severity pays from the pool."
          >
            <ProgramTiersForm program={program} />
          </SettingsSection>
        </>
      )}
      <SettingsSection id="settings-status" title="Status">
        <ProgramStatusActions program={program} />
      </SettingsSection>
      <SettingsSection
        id="settings-delete"
        title="Delete program"
        tone="danger"
      >
        <ProgramDelete program={program} onLeave={onLeave} />
      </SettingsSection>
    </div>
  );
}
