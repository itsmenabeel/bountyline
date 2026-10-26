import { NotFoundState } from "./not-found-state";

/**
 * notFound() inside a role area: a missing record, or one this role can't see (the backend
 * answers both with a 404, so the page doesn't tell them apart either).
 */
export function DashboardNotFound({ home }: { home: string }) {
  return (
    <NotFoundState
      description="It may have been deleted, or it belongs to an account you can't see from here."
      home={{ href: home, label: "Go to overview" }}
    />
  );
}
