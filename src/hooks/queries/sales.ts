import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/sales";
import type { ID, ListQuery } from "@/types";

export const salesKeys = {
  all: ["sales"] as const,
  summary: ["sales", "summary"] as const,
  list: (q: ListQuery) => ["sales", "list", q] as const,
  detail: (id: ID) => ["sales", "detail", id] as const,
};

export const useSalesSummary = () =>
  useQuery({ queryKey: salesKeys.summary, queryFn: api.getSalesSummary });

export const useInvoices = (query: ListQuery) =>
  useQuery({ queryKey: salesKeys.list(query), queryFn: () => api.listInvoices(query) });

export const useInvoice = (id: ID) =>
  useQuery({ queryKey: salesKeys.detail(id), queryFn: () => api.getInvoice(id) });

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: api.CreateSaleInput) => api.createSale(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.all });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => api.cancelInvoice(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.all }),
  });
}
