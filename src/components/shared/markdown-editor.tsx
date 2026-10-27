"use client";

import { cn } from "cn";
import dynamic from "next/dynamic";
import type { ComponentProps, ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// The preview pulls in the Markdown renderer, so it loads only when someone opens the tab.
const MarkdownView = dynamic(
  () => import("@/components/shared/markdown-view").then((m) => m.MarkdownView),
  { loading: () => <Skeleton className="h-24 w-full" /> },
);

export type MarkdownTab = "write" | "preview";

/**
 * A Markdown textarea with a Write/Preview switch. The form owns the tab, so it can switch
 * back to Write before focusing the textarea on a validation error.
 */
export function MarkdownEditor({
  tab,
  onTabChange,
  value,
  toolbar,
  className,
  ...textarea
}: ComponentProps<typeof Textarea> & {
  tab: MarkdownTab;
  onTabChange: (tab: MarkdownTab) => void;
  value: string;
  /** Extra controls on the right of the Write/Preview switch. */
  toolbar?: ReactNode;
}) {
  return (
    <Tabs
      value={tab}
      onValueChange={(next) => onTabChange(next as MarkdownTab)}
      className="gap-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="write">Write</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        {toolbar}
      </div>
      {/* Kept mounted while Preview shows, so the label and error focus still have a
          textarea to point at. */}
      <TabsContent
        value="write"
        forceMount
        className="data-[state=inactive]:hidden"
      >
        <Textarea
          {...textarea}
          value={value}
          className={cn("font-mono md:pointer-fine:text-sm", className)}
        />
      </TabsContent>
      <TabsContent
        value="preview"
        className="min-h-40 rounded-lg border bg-card p-4"
      >
        {value.trim() ? (
          <MarkdownView source={value} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nothing to preview yet.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
