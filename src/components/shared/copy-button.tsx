"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Copies `value` and says "Copied" for two seconds; the label names what gets copied. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2_000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      toast.error("Your browser blocked the copy. Select the text instead.");
    }
  }

  const Icon = copied ? CheckIcon : CopyIcon;
  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      <Icon aria-hidden="true" />
      {copied ? "Copied" : label}
    </Button>
  );
}
