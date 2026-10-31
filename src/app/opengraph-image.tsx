import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SHARE_IMAGE } from "@/lib/metadata";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const alt = SHARE_IMAGE.alt;
export const size = { width: SHARE_IMAGE.width, height: SHARE_IMAGE.height };
export const contentType = "image/png";

const asset = (...path: string[]) => join(process.cwd(), "src", ...path);

// The image runs outside the CSS, so it repeats the light theme's values from globals.css.
const INK = "#14161b";
const MUTED = "#565d6b";
const BACKGROUND = "#f7f8fa";
const BORDER = "#d9dce3";
const MONEY = "#0f7a45";

// The same four moments and money colors as the home page's "How a report moves".
const TRACK = [
  { label: "Funded", money: true },
  { label: "Reported", money: false },
  { label: "Triaged", money: false },
  { label: "Paid", money: true },
];

const [plexSans, plexMono, logo] = await Promise.all([
  readFile(asset("assets", "fonts", "ibm-plex-sans-latin-600-normal.woff")),
  readFile(asset("assets", "fonts", "ibm-plex-mono-latin-500-normal.woff")),
  readFile(asset("app", "icon.svg"), "base64"),
]);

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        backgroundColor: BACKGROUND,
        color: INK,
        fontFamily: "IBM Plex Sans",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* biome-ignore lint/performance/noImgElement: next/og draws this; next/image can't run here. */}
        <img
          src={`data:image/svg+xml;base64,${logo}`}
          width={64}
          height={64}
          alt=""
        />
        <span style={{ fontSize: 40 }}>{SITE_NAME}</span>
      </div>

      <div
        style={{
          display: "flex",
          maxWidth: 980,
          fontSize: 76,
          lineHeight: 1.1,
          letterSpacing: -1.5,
        }}
      >
        {SITE_DESCRIPTION}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {TRACK.map((step, index) => (
            <div
              key={step.label}
              style={{
                display: "flex",
                alignItems: "center",
                flexGrow: index === TRACK.length - 1 ? 0 : 1,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: step.money ? MONEY : INK,
                }}
              />
              {index < TRACK.length - 1 && (
                <div
                  style={{ flexGrow: 1, height: 4, backgroundColor: BORDER }}
                />
              )}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 16,
            fontFamily: "IBM Plex Mono",
            fontSize: 26,
            color: MUTED,
          }}
        >
          {TRACK.map((step) => (
            <span key={step.label}>{step.label}</span>
          ))}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "IBM Plex Sans", data: plexSans, weight: 600, style: "normal" },
        { name: "IBM Plex Mono", data: plexMono, weight: 500, style: "normal" },
      ],
    },
  );
}
