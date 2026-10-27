import type { ReactNode } from "react";
import { holdFocusOnSubmit } from "@/lib/forms";
import { cn } from "@/lib/utils";

/** One card on the program's Settings tab: an h2, one line about it, and its controls. */
export function SettingsSection({
  id,
  title,
  description,
  tone = "default",
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  /** "danger" marks the delete card. */
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className={cn(
        "flex flex-col gap-5 rounded-xl border bg-card p-5",
        tone === "danger" && "border-destructive/40",
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-heading`} className="text-lg font-semibold">
          {title}
        </h2>
        {description && (
          <p className="max-w-prose text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

/** The save row under a settings form, holding focus in the field on press (see forms.ts). */
export function SettingsActions({ children }: { children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: only cancels the focus shift on press; the button inside handles the action.
    <div
      onMouseDown={holdFocusOnSubmit}
      className="flex flex-wrap items-center justify-end gap-2 border-t pt-4"
    >
      {children}
    </div>
  );
}
