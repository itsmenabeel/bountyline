"use client";

import { ErrorState } from "@/components/shared/error-state";
import { ROLE_HOME } from "@/lib/auth/roles";

/** Renders inside the dashboard shell, so the sidebar stays usable. */
export default function DashboardError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <ErrorState
      error={error}
      retry={retry}
      home={{ href: ROLE_HOME.RESEARCHER, label: "Go to overview" }}
    />
  );
}
