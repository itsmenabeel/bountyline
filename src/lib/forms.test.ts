import { describe, expect, it } from "vitest";
import { flattenFieldErrors } from "./forms";

describe("flattenFieldErrors", () => {
  it("lists nested errors by path", () => {
    expect(
      flattenFieldErrors({
        title: { type: "too_small", message: "Enter a title." },
        inScope: [
          undefined,
          { value: { type: "custom", message: "Repeated." } },
        ],
      } as never),
    ).toEqual([
      { path: "title", message: "Enter a title." },
      { path: "inScope.1.value", message: "Repeated." },
    ]);
  });

  it("keeps fields named like an error's own keys", () => {
    expect(
      flattenFieldErrors({
        message: { type: "too_small", message: "Write your message." },
        type: { type: "invalid_value", message: "Pick a type." },
      } as never),
    ).toEqual([
      { path: "message", message: "Write your message." },
      { path: "type", message: "Pick a type." },
    ]);
  });
});
