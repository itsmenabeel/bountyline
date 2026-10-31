// The home hero's track field: rows of the four report stages, with a pulse running along each
// row and each stage lighting up as the pulse reaches it. public.css animates them; this file
// holds the layout and works out the timing, so a node's flash lines up with its row's pulse.

/** A pulse's run, as a percent of the row's width. It starts and ends out of sight. */
export const RUN_FROM = -4;
export const RUN_TO = 104;

/** Who acts at each stage, left to right, and how far along the row it sits. */
export const STAGES = [
  { tone: "tone-organization", x: 12 },
  { tone: "tone-researcher", x: 37 },
  { tone: "tone-triage", x: 62 },
  { tone: "tone-money", x: 88 },
];

export interface HeroTrack {
  /** Distance from the top of the hero, in percent. */
  y: number;
  /** Seconds for one run. Rows differ so the pulses never fall into step. */
  duration: number;
  /** Seconds into its run a row's pulse is on page load. */
  offset: number;
  /** Moves this row's stages sideways, so they don't line up in columns. */
  shift: number;
  /** Below 1280px only these rows show: the others would pass behind the text. */
  alwaysShown: boolean;
}

export const TRACKS: HeroTrack[] = [
  { y: 12, duration: 13, offset: 2, shift: 0, alwaysShown: true },
  { y: 30, duration: 17, offset: 9, shift: 5, alwaysShown: false },
  { y: 50, duration: 15, offset: 4, shift: -6, alwaysShown: false },
  { y: 70, duration: 19, offset: 13, shift: 4, alwaysShown: false },
  { y: 88, duration: 12, offset: 7, shift: -3, alwaysShown: true },
];

/**
 * The animation-delay, in seconds, that makes a node at `x` percent flash as its row's pulse
 * arrives. Always zero or negative, so every node is mid-cycle and in step from the first frame.
 */
export function flashDelay(
  x: number,
  { duration, offset }: Pick<HeroTrack, "duration" | "offset">,
) {
  const arrival = ((x - RUN_FROM) / (RUN_TO - RUN_FROM)) * duration;
  const untilArrival = (((arrival - offset) % duration) + duration) % duration;
  return untilArrival - duration;
}
