"use client";

import { Toaster } from "@/components/ui/sonner";
import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * Toasts sit bottom-right on desktop and top-center on phones, where the bottom edge belongs
 * to the thumb and the browser's own bars (design-plan §9.3). Four seconds; Sonner announces
 * them politely and never moves focus.
 */
export function AppToaster() {
  const isPhone = useMediaQuery("(max-width: 767px)");
  return (
    <Toaster
      position={isPhone ? "top-center" : "bottom-right"}
      duration={4_000}
      closeButton
    />
  );
}
