import { type ReactNode, ViewTransition } from "react";

/**
 * Animates a page in and out on client navigation (the classes live in globals.css). It goes
 * in each page, not the layout: layouts persist across navigations, so enter and exit would
 * never fire there. Its one child must be a DOM element.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
