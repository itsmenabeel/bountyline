import { describe, expect, it } from "vitest";
import { buildTrack } from "./track";

const states = (status: Parameters<typeof buildTrack>[0]) =>
  buildTrack(status).steps.map((step) => `${step.id}:${step.state}`);

describe("buildTrack", () => {
  it("puts a new report on the first of four steps", () => {
    expect(states("NEW")).toEqual([
      "submitted:current",
      "triage:upcoming",
      "accepted:upcoming",
      "rewarded:upcoming",
    ]);
    expect(buildTrack("NEW").summary).toBe("New, step 1 of 4");
  });

  it("keeps a needs-info report on the triage step and flags the loop", () => {
    const track = buildTrack("NEEDS_INFO");
    expect(track.currentIndex).toBe(1);
    expect(track.needsInfo).toBe(true);
    expect(track.summary).toBe("Needs info, step 2 of 4");
    expect(buildTrack("TRIAGING").needsInfo).toBe(false);
  });

  it("marks accepted as step 3 and rewarded as the finished last step", () => {
    expect(buildTrack("ACCEPTED").summary).toBe("Accepted, step 3 of 4");
    expect(states("REWARDED")).toEqual([
      "submitted:complete",
      "triage:complete",
      "accepted:complete",
      "rewarded:complete",
    ]);
    expect(buildTrack("REWARDED").outcome).toBe("rewarded");
  });

  it("ends rejected and duplicate reports after triage", () => {
    expect(states("REJECTED")).toEqual([
      "submitted:complete",
      "triage:complete",
      "closed:current",
    ]);
    const duplicate = buildTrack("DUPLICATE");
    expect(duplicate.outcome).toBe("duplicate");
    expect(duplicate.steps.at(-1)?.label).toBe("Duplicate");
    expect(duplicate.summary).toBe("Duplicate, step 3 of 3");
  });
});
