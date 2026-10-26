import type { ComponentProps, ReactNode } from "react";
import Markdown, { type Components, defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// Report bodies are written by researchers, so this renders Markdown only: raw HTML is
// dropped (`skipHtml`), unsafe URL schemes are removed (`defaultUrlTransform`), links open
// with nofollow, and images become plain links so a report can't load anything into the
// page (implementation-plan K6). No hooks, so it renders on the server or in a preview.

const LINK_REL = "nofollow noopener noreferrer";
const linkClass =
  "font-medium text-primary underline underline-offset-4 [overflow-wrap:anywhere]";

function ExternalLink({
  href,
  children,
}: {
  href: string | undefined;
  children: ReactNode;
}) {
  if (!href) return <span>{children}</span>;
  return (
    <a href={href} rel={LINK_REL} target="_blank" className={linkClass}>
      {children}
    </a>
  );
}

// The page owns h1 and the section h2s, so Markdown headings start at h3.
const heading =
  (Tag: "h3" | "h4" | "h5" | "h6", className: string) =>
  ({ children }: ComponentProps<"h1">) => (
    <Tag className={cn("font-semibold tracking-tight", className)}>
      {children}
    </Tag>
  );

const components: Components = {
  h1: heading("h3", "text-xl"),
  h2: heading("h4", "text-lg"),
  h3: heading("h5", "text-base"),
  h4: heading("h6", "text-base"),
  h5: heading("h6", "text-sm"),
  h6: heading("h6", "text-sm"),
  a: ({ href, children }) => (
    <ExternalLink href={href}>{children}</ExternalLink>
  ),
  img: ({ src, alt }) => {
    const href = typeof src === "string" ? src : undefined;
    return (
      <ExternalLink href={href}>
        {alt ? `Image: ${alt}` : (href ?? "Image")}
      </ExternalLink>
    );
  },
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-sm leading-relaxed">
      {children}
    </pre>
  ),
  code: ({ className, children }) => (
    <code
      className={cn(
        "font-mono text-[0.9em]",
        // Inline code gets a chip; code inside <pre> inherits the block's background.
        !className &&
          "rounded bg-muted px-1 py-0.5 [pre_&]:bg-transparent [pre_&]:p-0",
        className,
      )}
    >
      {children}
    </code>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border px-3 py-1.5 text-left font-medium">{children}</th>
  ),
  td: ({ children }) => <td className="border px-3 py-1.5">{children}</td>,
};

export function MarkdownView({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex max-w-prose min-w-0 flex-col gap-4 text-base leading-relaxed [overflow-wrap:anywhere]",
        "[&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
        "[&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1",
        "[&_hr]:border-border",
        className,
      )}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={defaultUrlTransform}
        components={components}
      >
        {source}
      </Markdown>
    </div>
  );
}
