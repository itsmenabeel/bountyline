"use client";

import { useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { ErrorState } from "@/components/shared/error-state";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

// next-themes keeps the choice under this key ("light", "dark", or "system").
const THEME_KEY = "theme";

function prefersDark() {
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(THEME_KEY);
  } catch {
    // Storage can be blocked; fall back to the system setting.
  }
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Replaces the root layout when the layout itself fails, so it brings its own document,
 * styles, fonts, and theme. No providers run here, so it uses only plain components.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    document.documentElement.classList.toggle("dark", prefersDark());
  }, []);

  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <title>Something went wrong · Bountyline</title>
        <header className="mx-auto w-full max-w-page px-4 py-5 md:px-6 lg:px-8">
          <Logo />
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-page flex-1 px-4 md:px-6 lg:px-8"
        >
          <ErrorState
            error={error}
            retry={retry}
            home={{ href: "/", label: "Go to the home page" }}
          />
        </main>
      </body>
    </html>
  );
}
