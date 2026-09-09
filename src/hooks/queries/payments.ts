import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/payments";
import type { ListQuery } from "@/types";

export const paymentKeys = {
  all: ["payments"] as const,
  list: (q: ListQuery) => ["payments", "list", q] as const,
};

export const usePayments = (query: ListQuery) =>
  useQuery({ queryKey: paymentKeys.list(query), queryFn: () => api.listPayments(query) });

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: api.RecordPaymentInput) => api.recordPayment(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
