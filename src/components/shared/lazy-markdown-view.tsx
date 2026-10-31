"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * MarkdownView for client components, in its own chunk: the renderer is the heaviest thing
 * they would otherwise ship. Server components import MarkdownView directly, which sends
 * the page its HTML and no renderer.
 */
export const LazyMarkdownView = dynamic(
  () => import("@/components/shared/markdown-view").then((m) => m.MarkdownView),
  { loading: () => <Skeleton className="h-16 w-full" /> },
);
