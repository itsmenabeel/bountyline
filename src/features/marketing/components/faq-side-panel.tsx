import { CircleQuestionMark } from "lucide-react";
import Link from "next/link";

/** A slow orbit of the role colors around a question mark. Decoration only. */
function OrbitGraphic() {
  return (
    <div aria-hidden="true" className="relative mx-auto size-40">
      <div className="orbit absolute inset-0 rounded-full border border-dashed border-input/60">
        <span className="orbit-dot tone-researcher" />
        <span className="orbit-dot orbit-dot-opposite tone-organization" />
      </div>
      <div className="orbit orbit-reverse absolute inset-6 rounded-full border border-input/40">
        <span className="orbit-dot tone-triage" />
      </div>
      <span className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <CircleQuestionMark className="size-8" />
      </span>
    </div>
  );
}

/** The FAQ's side column on large screens: the graphic, links to each group, and a way out. */
export function FaqSidePanel({
  groups,
}: {
  groups: { id: string; title: string; count: number; tone: string }[];
}) {
  return (
    <aside className="rise-in sticky top-24 hidden flex-col gap-6 rounded-xl border bg-card p-6 [--enter-i:2] lg:flex">
      <OrbitGraphic />
      <nav aria-label="FAQ groups" className="flex flex-col gap-1">
        {groups.map((group) => (
          <a
            key={group.id}
            href={`#${group.id}`}
            className={`${group.tone} flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors duration-(--motion-fast) hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/70`}
          >
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-(--tone)"
            />
            {group.title}
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              {group.count}
            </span>
          </a>
        ))}
      </nav>
      <p className="border-t pt-4 text-sm text-muted-foreground">
        Not listed here?{" "}
        <Link
          href="/contact"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Write to us
        </Link>
        .
      </p>
    </aside>
  );
}
