import { beforeEach, describe, expect, it } from "vitest";
import {
  EMPTY_REPORT_DRAFT,
  reportDraftHasContent,
  useReportDraftStore,
} from "./report-draft-store";

// sessionStorage doesn't exist under Node; the store only keeps state in memory here.
describe("useReportDraftStore", () => {
  beforeEach(() => useReportDraftStore.setState({ drafts: {} }));

  it("keeps one draft per program", () => {
    const { save } = useReportDraftStore.getState();
    save("a", { title: "XSS in search" });
    save("b", { step: 1, inScope: true });
    expect(useReportDraftStore.getState().drafts).toEqual({
      a: { ...EMPTY_REPORT_DRAFT, title: "XSS in search" },
      b: { ...EMPTY_REPORT_DRAFT, step: 1, inScope: true },
    });
  });

  it("merges later saves into the program's draft", () => {
    const { save } = useReportDraftStore.getState();
    save("a", { title: "XSS in search", step: 1 });
    save("a", { description: "Steps..." });
    expect(useReportDraftStore.getState().drafts.a).toMatchObject({
      step: 1,
      title: "XSS in search",
      description: "Steps...",
    });
  });

  it("discards one program's draft and leaves the rest", () => {
    const { save, discard } = useReportDraftStore.getState();
    save("a", { title: "One" });
    save("b", { title: "Two" });
    discard("a");
    expect(Object.keys(useReportDraftStore.getState().drafts)).toEqual(["b"]);
  });
});

describe("reportDraftHasContent", () => {
  it("counts the title and write-up, not the step or the checkbox", () => {
    expect(reportDraftHasContent(undefined)).toBe(false);
    expect(
      reportDraftHasContent({ ...EMPTY_REPORT_DRAFT, step: 2, inScope: true }),
    ).toBe(false);
    expect(
      reportDraftHasContent({ ...EMPTY_REPORT_DRAFT, description: " x " }),
    ).toBe(true);
  });
});
