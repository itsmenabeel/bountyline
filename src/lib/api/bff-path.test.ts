import { describe, expect, it } from "vitest";
import { toBackendPath } from "./bff-path";

describe("toBackendPath", () => {
  it("joins segments into a backend path", () => {
    expect(toBackendPath(["users", "me"])).toBe("/users/me");
    expect(toBackendPath(["reports", "abc", "comments"])).toBe(
      "/reports/abc/comments",
    );
  });

  it("re-encodes each segment", () => {
    expect(toBackendPath(["programs", "a/b?c"])).toBe("/programs/a%2Fb%3Fc");
  });

  it("refuses the token endpoints in any case", () => {
    expect(toBackendPath(["auth", "login"])).toBeNull();
    expect(toBackendPath(["Auth", "refresh-token"])).toBeNull();
  });

  it("refuses dot segments, empty segments, and an empty path", () => {
    expect(toBackendPath(["programs", "..", "auth", "login"])).toBeNull();
    expect(toBackendPath([".", "users"])).toBeNull();
    expect(toBackendPath(["users", ""])).toBeNull();
    expect(toBackendPath([])).toBeNull();
  });
});
