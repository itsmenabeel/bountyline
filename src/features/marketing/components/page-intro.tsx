import type { ReactNode } from "react";

/** The title block of a public content page: an eyebrow, the page's h1, and a lede. */
export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <p className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
        {title}
      </h1>
      <div className="flex flex-col gap-3 text-base text-pretty text-muted-foreground md:text-lg">
        {children}
      </div>
    </div>
  );
}
