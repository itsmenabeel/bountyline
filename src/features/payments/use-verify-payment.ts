"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { programKeys } from "@/features/programs/queries";
import { clientRequest } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";
import type { Payment } from "@/types/api";
import { paymentEndpoints } from "./endpoints";
import { paymentKeys } from "./queries";

/**
 * POST /payments/:id/verify. The answer replaces the payment in the cache, in its detail
 * and in every list row, then lists refetch (a status filter may no longer match). A
 * payment that cleared also refreshes programs, since their pool just grew. Callers show
 * their own messages (`meta.silentToast`).
 */
export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientRequest(paymentEndpoints.verify(id)),
    meta: { silentToast: true },
    onSuccess: (payment) => {
      queryClient.setQueryData(paymentKeys.detail(payment.id), payment);
      queryClient.setQueriesData<Paginated<Payment>>(
        { queryKey: paymentKeys.lists() },
        (page) =>
          page && {
            ...page,
            items: page.items.map((row) =>
              row.id === payment.id ? payment : row,
            ),
          },
      );
      void queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      if (payment.status === "SUCCEEDED") {
        void queryClient.invalidateQueries({ queryKey: programKeys.all });
      }
    },
  });
}
