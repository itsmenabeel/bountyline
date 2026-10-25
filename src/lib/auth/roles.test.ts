import { describe, expect, it } from "vitest";
import { areaRoleFor, homeFor, safeNextPath } from "./roles";

describe("homeFor", () => {
  it("sends each role to its own dashboard", () => {
    expect(homeFor("RESEARCHER")).toBe("/researcher");
    expect(homeFor("PROGRAM_OWNER")).toBe("/owner");
    expect(homeFor("ADMIN")).toBe("/admin");
  });
});

describe("safeNextPath", () => {
  it("keeps a path inside the user's area, with its query and hash", () => {
    expect(safeNextPath("/admin/reports?status=NEW#top", "ADMIN")).toBe(
      "/admin/reports?status=NEW#top",
    );
    expect(safeNextPath("/owner", "PROGRAM_OWNER")).toBe("/owner");
    expect(
      safeNextPath("/payment/success?session_id=cs_test_1", "PROGRAM_OWNER"),
    ).toBe("/payment/success?session_id=cs_test_1");
  });

  it("rejects another role's area", () => {
    expect(safeNextPath("/admin", "RESEARCHER")).toBeNull();
    expect(safeNextPath("/payment/success", "RESEARCHER")).toBeNull();
  });

  it("rejects prefixes that only look like the area", () => {
    expect(safeNextPath("/researcher-evil", "RESEARCHER")).toBeNull();
    expect(safeNextPath("/admin/../researcher", "ADMIN")).toBeNull();
  });

  it("rejects absolute and protocol-relative URLs", () => {
    for (const next of [
      "https://evil.test/admin",
      "//evil.test/admin",
      "/\\evil.test/admin",
      "/\t/evil.test/admin",
      "javascript:alert(1)",
    ]) {
      expect(safeNextPath(next, "ADMIN")).toBeNull();
    }
  });

  it("rejects missing and non-string values", () => {
    expect(safeNextPath(undefined, "ADMIN")).toBeNull();
    expect(safeNextPath("", "ADMIN")).toBeNull();
    expect(safeNextPath(["/admin"], "ADMIN")).toBeNull();
  });
});

describe("areaRoleFor", () => {
  it("maps each area, including Stripe's /payment pages, to its role", () => {
    expect(areaRoleFor("/admin")).toBe("ADMIN");
    expect(areaRoleFor("/admin/reports/abc")).toBe("ADMIN");
    expect(areaRoleFor("/owner/programs")).toBe("PROGRAM_OWNER");
    expect(areaRoleFor("/payment/success")).toBe("PROGRAM_OWNER");
    expect(areaRoleFor("/researcher")).toBe("RESEARCHER");
  });

  it("returns null outside the areas and for look-alike prefixes", () => {
    for (const path of [
      "/",
      "/login",
      "/programs",
      "/administrator",
      "/forbidden",
    ]) {
      expect(areaRoleFor(path)).toBeNull();
    }
  });
});
