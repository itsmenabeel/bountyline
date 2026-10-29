import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import {
  banRequest,
  banSchema,
  roleChangeText,
  statusDoneText,
  userChangeFailure,
} from "./users";

const conflict = (message: string) =>
  new ApiError({ kind: "http", status: 409, message });

describe("banRequest", () => {
  it("leaves an empty reason out, as the backend wants 1–500 characters or none", () => {
    expect(banRequest(false, "   ")).toEqual({ isActive: false });
    expect(banRequest(false, " Spam ")).toEqual({
      isActive: false,
      reason: "Spam",
    });
    expect(banRequest(true)).toEqual({ isActive: true });
  });

  it("caps the reason at 500 characters", () => {
    expect(banSchema.safeParse({ reason: "x".repeat(500) }).success).toBe(true);
    expect(banSchema.safeParse({ reason: "x".repeat(501) }).success).toBe(
      false,
    );
  });
});

describe("statusDoneText", () => {
  it("reports programs the ban paused", () => {
    expect(statusDoneText({ name: "Acme Security", isActive: false }, 2)).toBe(
      "Acme Security banned. 2 programs paused until the owner resumes them.",
    );
    expect(statusDoneText({ name: "Sam", isActive: false }, 0)).toBe(
      "Sam banned",
    );
    expect(statusDoneText({ name: "Sam", isActive: true }, 0)).toBe(
      "Sam unbanned",
    );
  });
});

describe("userChangeFailure", () => {
  it("names each backend rule", () => {
    expect(
      userChangeFailure(
        conflict(
          "This user owns programs. Delete or close them before changing the role",
        ),
        "role",
      ),
    ).toMatch(/^This owner still has programs/);
    expect(
      userChangeFailure(
        conflict("At least one other active admin must remain"),
        "status",
      ),
    ).toMatch(/at least one other active admin/);
    expect(
      userChangeFailure(conflict("User changed, please retry"), "status"),
    ).toMatch(/^Someone changed this user/);
  });

  it("names the action for other failures", () => {
    expect(
      userChangeFailure(new ApiError({ kind: "network" }), "role"),
    ).toMatch(/^We couldn't change the role\./);
  });
});

describe("roleChangeText", () => {
  it("says what the person becomes", () => {
    expect(roleChangeText({ name: "Sam Okafor" }, "ADMIN")).toBe(
      "Sam Okafor becomes an admin. Their dashboard changes the next time they load a page.",
    );
  });
});
