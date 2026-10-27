"use client";

import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { type MouseEvent, type ReactNode, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

/**
 * A multi-step form's frame (design-plan §8): the step list, "Step 2 of 4" over the step's
 * heading, and the step itself. Finished steps are buttons back to themselves; later steps
 * open only through the step's own Continue button, which validates first. Focus moves to the
 * heading on every step change, so screen readers announce where the person landed.
 */
export function WizardShell({
  steps,
  current,
  onStepSelect,
  description,
  children,
}: {
  steps: readonly string[];
  current: number;
  /** Omit to make the step list read-only, such as while the final submit runs. */
  onStepSelect?: (step: number) => void;
  /** One line under the heading about this step. */
  description?: ReactNode;
  children: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const shown = useRef(current);

  useEffect(() => {
    // Not on first render: the page's own h1 comes first then.
    if (shown.current === current) return;
    shown.current = current;
    heading.current?.focus();
  }, [current]);

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Steps">
        <ol className="flex items-center gap-2">
          {steps.map((label, index) => {
            const done = index < current;
            const isCurrent = index === current;
            const marker = (
              <>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium tabular-nums",
                    done && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary",
                    !done && !isCurrent && "text-muted-foreground",
                  )}
                >
                  {done ? <CheckIcon className="size-4" /> : index + 1}
                </span>
                {/* Phones show the markers only; the heading below names the step. */}
                <span
                  className={cn(
                    "text-sm whitespace-nowrap max-sm:sr-only",
                    isCurrent
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {label}
                  {done && <span className="sr-only"> (done)</span>}
                </span>
              </>
            );
            return (
              <li
                key={label}
                aria-current={isCurrent ? "step" : undefined}
                className="flex min-w-0 flex-1 items-center gap-2 last:flex-none"
              >
                {done && onStepSelect ? (
                  <button
                    type="button"
                    onClick={() => onStepSelect(index)}
                    className="-m-1 flex items-center gap-2 rounded-md p-1 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/70 pointer-coarse:min-h-11 [&>span:last-child]:hover:text-foreground"
                  >
                    {marker}
                  </button>
                ) : (
                  <span className="flex items-center gap-2">{marker}</span>
                )}
                {index < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-px min-w-3 flex-1",
                      done ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <section
        aria-labelledby="wizard-step-heading"
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground tabular-nums">
            Step {current + 1} of {steps.length}
          </p>
          <h2
            id="wizard-step-heading"
            ref={heading}
            tabIndex={-1}
            className="text-xl font-semibold tracking-tight outline-none"
          >
            {steps[current]}
          </h2>
          {description && (
            <p className="max-w-prose text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {children}
      </section>
    </div>
  );
}

/**
 * Pressing a submit button blurs the field being edited, and with `mode: "onTouched"` that
 * field's error can render before the button is released, pushing the button down so the
 * release misses it and the click never fires. Keeping focus in the field until the click
 * avoids the shift; the submit then validates every field and moves focus itself.
 */
function holdFocusOnSubmit(event: MouseEvent<HTMLDivElement>) {
  if ((event.target as Element).closest("button[type=submit]")) {
    event.preventDefault();
  }
}

/** Back on the left, the step's forward action on the right; stacked on phones. */
export function WizardActions({
  onBack,
  backDisabled,
  children,
}: {
  onBack?: () => void;
  backDisabled?: boolean;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: only cancels the focus shift on press; the buttons inside handle the action.
    <div
      onMouseDown={holdFocusOnSubmit}
      className="flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      {onBack ? (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onBack}
          disabled={backDisabled}
        >
          Back
        </Button>
      ) : (
        // Holds the forward actions to the right on wider screens.
        <span className="max-sm:hidden" />
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row">{children}</div>
    </div>
  );
}
