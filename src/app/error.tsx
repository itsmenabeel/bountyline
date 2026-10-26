"use client";

import { Logo } from "@/components/brand/logo";
import { ErrorState } from "@/components/shared/error-state";

/**
 * The fallback for pages without a nearer boundary (sign-in, the standalone pages) and for
 * a role area's own layout, such as the session check failing. It renders in the root
 * layout alone, so it brings the logo and its own main landmark.
 */
export default function RootError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <>
      <header className="mx-auto w-full max-w-page px-4 py-5 md:px-6 lg:px-8">
        <Logo />
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-page flex-1 px-4 outline-none md:px-6 lg:px-8"
      >
        <ErrorState
          error={error}
          retry={retry}
          home={{ href: "/", label: "Go to the home page" }}
        />
      </main>
    </>
  );
}
