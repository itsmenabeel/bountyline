import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { flashDelay, STAGES, TRACKS } from "../hero-tracks";

/**
 * The home hero's moving background (public.css): rows of the report track, each with a pulse
 * that lights the four stages in their role colors as it passes. The field clears behind the
 * text. With reduced motion the rows and stages stay still. Decoration only, so it's hidden
 * from assistive technology.
 */
export function HeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="hero-tracks pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {TRACKS.map((track) => (
        <div
          key={track.y}
          className={cn("hero-track", !track.alwaysShown && "hidden xl:block")}
          style={
            {
              top: `${track.y}%`,
              "--run-duration": `${track.duration}s`,
              "--run-delay": `${-track.offset}s`,
            } as CSSProperties
          }
        >
          {STAGES.map((stage) => {
            const x = stage.x + track.shift;
            return (
              <span
                key={stage.tone}
                className={cn("hero-node", stage.tone)}
                style={
                  {
                    left: `${x}%`,
                    "--flash-delay": `${flashDelay(x, track)}s`,
                  } as CSSProperties
                }
              />
            );
          })}
          <span className="hero-runner" />
        </div>
      ))}
    </div>
  );
}
