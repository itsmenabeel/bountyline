"use client";

import { ErrorState } from "@/components/shared/error-state";

/** Inside the public header and footer, so the site nav stays usable. */
export default function PublicError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-page px-4 md:px-6 lg:px-8">
      <ErrorState
        error={error}
        retry={retry}
        home={{ href: "/", label: "Go to the home page" }}
      />
    </div>
  );
}
