import { describe, expect, it } from "vitest";
import { pageMetadata, SHARE_IMAGE } from "./metadata";

const description = "Answers for researchers and program owners.";

describe("pageMetadata", () => {
  it("puts the full title on the share cards and the bare title on the page", () => {
    const metadata = pageMetadata({ title: "FAQ", description, path: "/faq" });
    expect(metadata.title).toBe("FAQ");
    expect(metadata.openGraph?.title).toBe("FAQ · Bountyline");
    expect(metadata.twitter?.title).toBe("FAQ · Bountyline");
  });

  it("leaves the title to the root layout when a page has none", () => {
    const metadata = pageMetadata({ description, path: "/" });
    expect(metadata).not.toHaveProperty("title");
    expect(metadata.openGraph?.title).toBe("Bountyline");
  });

  it("points the canonical address and the card at the page's path", () => {
    const metadata = pageMetadata({ title: "FAQ", description, path: "/faq" });
    expect(metadata.alternates?.canonical).toBe("/faq");
    expect(metadata.openGraph?.url).toBe("/faq");
    expect(metadata.openGraph?.description).toBe(description);
  });

  it("names the share image on both cards, since Next drops the root file otherwise", () => {
    const metadata = pageMetadata({ description, path: "/" });
    expect(metadata.openGraph?.images).toEqual([SHARE_IMAGE]);
    expect(metadata.twitter?.images).toEqual([SHARE_IMAGE]);
  });
});
