import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/suppliers";
import type { ListQuery, Supplier } from "@/types";

export const supplierKeys = { all: ["suppliers"] as const, list: (q: ListQuery) => ["suppliers", "list", q] as const, orders: (q: ListQuery) => ["suppliers", "orders", q] as const };
export const useSuppliers = (query: ListQuery) => useQuery({ queryKey: supplierKeys.list(query), queryFn: () => api.listSuppliers(query) });
export const usePurchaseOrders = (query: ListQuery) => useQuery({ queryKey: supplierKeys.orders(query), queryFn: () => api.listPurchaseOrders(query) });
export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (input: Omit<Supplier, "id" | "createdAt" | "outstanding">) => api.createSupplier(input), onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.all }) });
}
