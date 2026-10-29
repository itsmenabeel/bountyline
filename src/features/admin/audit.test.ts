import { describe, expect, it } from "vitest";
import { auditActionLabel, auditEntityHref, auditSummary } from "./audit";
import { auditLogParams, auditRange } from "./params";

const summary = (action: string, metadata: unknown) =>
  auditSummary({ action, metadata: metadata as never });

describe("auditSummary", () => {
  it("describes a triage move with its severity", () => {
    expect(
      summary("REPORT_STATUS_CHANGE", {
        from: "TRIAGING",
        to: "ACCEPTED",
        severity: "HIGH",
      }),
    ).toBe("In triage to Accepted at High.");
  });

  it("describes a payout move with its amount", () => {
    expect(
      summary("REPORT_STATUS_CHANGE", {
        from: "ACCEPTED",
        to: "REWARDED",
        amount: 50_000,
      }),
    ).toBe("Accepted to Rewarded for $500.00.");
  });

  it("says why a ban paused a program", () => {
    expect(
      summary("PROGRAM_STATUS_CHANGE", {
        from: "ACTIVE",
        to: "PAUSED",
        reason: "owner_banned",
      }),
    ).toBe("Active to Paused, because an admin banned the owner.");
  });

  it("gives a ban's reason and the programs it paused", () => {
    expect(
      summary("USER_BANNED", { reason: "Spam reports", pausedPrograms: 2 }),
    ).toBe("Reason: Spam reports. 2 programs paused.");
    expect(summary("USER_BANNED", { pausedPrograms: 0 })).toBe(
      "No reason given.",
    );
  });

  it("formats money and tiers", () => {
    expect(summary("POOL_FUNDED", { amount: 150_000 })).toBe(
      "$1,500.00 added through Stripe.",
    );
    expect(
      summary("REWARD_TIERS_UPDATED", {
        tiers: [
          { severity: "LOW", amount: 10_000 },
          { severity: "HIGH", amount: 150_000 },
        ],
      }),
    ).toBe("Low $100.00, High $1,500.00.");
    expect(summary("ROLE_UPDATED", { from: "RESEARCHER", to: "ADMIN" })).toBe(
      "Researcher to Admin.",
    );
  });

  it("adds nothing when the metadata doesn't match or the action is unknown", () => {
    expect(summary("REPORT_STATUS_CHANGE", { from: "NOPE" })).toBeNull();
    expect(summary("POOL_FUNDED", null)).toBeNull();
    expect(summary("SOMETHING_NEW", { amount: 1 })).toBeNull();
    expect(summary("REPORT_DELETED", {})).toBeNull();
  });
});

describe("auditActionLabel and auditEntityHref", () => {
  it("labels known actions and turns unknown ones into sentence case", () => {
    expect(auditActionLabel("PAYOUT_ISSUED")).toBe("Payout sent");
    expect(auditActionLabel("API_KEY_ROTATED")).toBe("Api key rotated");
  });

  it("links reports and programs, not users", () => {
    expect(auditEntityHref({ entityType: "Report", entityId: "r1" })).toBe(
      "/admin/reports/r1",
    );
    expect(auditEntityHref({ entityType: "Program", entityId: "p1" })).toBe(
      "/admin/programs/p1",
    );
    expect(auditEntityHref({ entityType: "User", entityId: "u1" })).toBeNull();
  });
});

describe("auditRange", () => {
  it("covers both days whole, in UTC", () => {
    expect(auditRange("2026-10-01", "2026-10-29")).toEqual({
      from: "2026-10-01T00:00:00.000Z",
      to: "2026-10-29T23:59:59.999Z",
    });
    expect(auditRange(undefined, "2026-10-29")).toEqual({
      from: undefined,
      to: "2026-10-29T23:59:59.999Z",
    });
  });

  it("sends nothing for a range that ends before it starts", () => {
    expect(auditRange("2026-10-29", "2026-10-01")).toEqual({});
  });
});

describe("auditLogParams", () => {
  it("drops unknown actions, bad ids, and malformed days", () => {
    const params = auditLogParams.parse({
      action: "DROP_TABLE",
      actorId: "nope",
      from: "29/10/2026",
      to: "2026-10-29",
    });
    expect(params).toMatchObject({
      action: undefined,
      actorId: undefined,
      from: undefined,
      to: "2026-10-29",
    });
  });
});
