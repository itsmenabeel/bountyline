import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

// Shared by the root layout and global-error, which replaces the layout and needs its own.

export const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const fontVariables = `${plexSans.variable} ${plexMono.variable}`;
