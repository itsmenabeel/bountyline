"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { createQueryClient } from "@/lib/query/query-client";

/** The browser's QueryClient, created once per page load. Failures nobody else shows become toasts. */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() =>
    createQueryClient({
      onBackgroundError: (error) =>
        toast.error("We couldn't refresh this page.", {
          description: error.userMessage,
        }),
      onMutationError: (error) => toast.error(error.userMessage),
    }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
