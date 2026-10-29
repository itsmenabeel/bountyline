import { describe, expect, it } from "vitest";
import { contactMailto, contactSchema } from "./schemas";

const valid = {
  name: "Riley Researcher",
  email: "Riley@Example.com ",
  topic: "payment",
  message: "My payout shows on the report but not in my wallet.",
} as const;

const firstMessage = (values: Record<string, unknown>) =>
  contactSchema.safeParse(values).error?.issues[0]?.message;

describe("contactSchema", () => {
  it("accepts a complete message and normalizes the email", () => {
    expect(contactSchema.parse(valid).email).toBe("riley@example.com");
  });

  it("applies the length rules", () => {
    expect(firstMessage({ ...valid, message: "Too short." })).toBe(
      "Write at least 20 characters.",
    );
    expect(firstMessage({ ...valid, message: "x".repeat(5001) })).toBe(
      "Keep it to 5,000 characters.",
    );
    expect(firstMessage({ ...valid, message: "   " })).toBe(
      "Write your message.",
    );
    expect(firstMessage({ ...valid, name: "R" })).toBe(
      "Enter at least 2 characters.",
    );
  });

  it("needs a topic from the list", () => {
    expect(firstMessage({ ...valid, topic: undefined })).toBe("Pick a topic.");
    expect(firstMessage({ ...valid, topic: "sales" })).toBe("Pick a topic.");
  });
});

describe("contactMailto", () => {
  it("encodes the subject and a body signed with the sender's name and email", () => {
    const url = contactMailto("team@example.com", contactSchema.parse(valid));
    expect(url.startsWith("mailto:team@example.com?subject=")).toBe(true);
    const params = new URLSearchParams(url.slice(url.indexOf("?") + 1));
    expect(params.get("subject")).toBe("[Bountyline] A payment or payout");
    expect(params.get("body")).toBe(
      "My payout shows on the report but not in my wallet.\n\nRiley Researcher\nriley@example.com",
    );
  });

  it("keeps characters that would break the link encoded", () => {
    const url = contactMailto(
      "team@example.com",
      contactSchema.parse({
        ...valid,
        message: "Amount & fees? 100% = yes #1 please",
      }),
    );
    expect(url).not.toMatch(/body=[^&]*[#&?]/);
    expect(url).toContain("%26");
  });
});
