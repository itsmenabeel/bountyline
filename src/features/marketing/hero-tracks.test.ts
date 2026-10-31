import { describe, expect, it } from "vitest";
import { flashDelay, RUN_FROM, RUN_TO, TRACKS } from "./hero-tracks";

const track = { duration: 10, offset: 2 };

/** Where a row's pulse is, in percent of the row, `seconds` after the page loads. */
function pulseAt(seconds: number, { duration, offset }: typeof track) {
  const progress = (((seconds + offset) % duration) + duration) % duration;
  return RUN_FROM + (progress / duration) * (RUN_TO - RUN_FROM);
}

describe("flashDelay", () => {
  it("starts a node's cycle at the moment the pulse reaches it", () => {
    for (const x of [12, 37, 62, 88]) {
      // A cycle starts whenever (seconds - delay) is a whole number of durations.
      const firstFlash = flashDelay(x, track) + track.duration;
      expect(pulseAt(firstFlash, track)).toBeCloseTo(x);
    }
  });

  it("stays zero or negative and within one run, so nodes are running from the first frame", () => {
    for (const row of TRACKS) {
      for (const x of [0, 12, 50, 88, 100]) {
        const delay = flashDelay(x, row);
        expect(delay).toBeLessThanOrEqual(0);
        expect(delay).toBeGreaterThanOrEqual(-row.duration);
      }
    }
  });
});
