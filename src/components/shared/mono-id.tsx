"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { shortId } from "@/lib/ids";
import { cn } from "@/lib/utils";

/**
 * A short id ("R-8F2C1A") that copies the full UUID. The tooltip shows the full id on hover
 * and focus; the button's name says what it copies, for people who never see the tooltip.
 */
export function MonoId({
  id,
  prefix,
  label,
  className,
}: {
  id: string;
  prefix: string;
  /** What the id belongs to, e.g. "report". */
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const short = shortId(id, prefix);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2_000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
    } catch {
      toast.error(
        "Your browser blocked the copy. Select the id and copy it instead.",
      );
    }
  }

  const Icon = copied ? CheckIcon : CopyIcon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label} id ${short}`}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-md px-1.5 font-mono text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/70 pointer-coarse:h-11",
            className,
          )}
        >
          {short}
          <Icon aria-hidden="true" className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="font-mono">
        {copied ? "Copied" : id}
      </TooltipContent>
    </Tooltip>
  );
}
