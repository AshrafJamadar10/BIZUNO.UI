import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/inventory";
import type { ID, ListQuery } from "@/types";

export const inventoryKeys = {
  all: ["inventory"] as const,
  summary: ["inventory", "summary"] as const,
  list: (q: ListQuery) => ["inventory", "list", q] as const,
  warehouses: ["inventory", "warehouses"] as const,
  movements: (id?: ID) => ["inventory", "movements", id ?? "all"] as const,
};

export const useInventorySummary = () =>
  useQuery({ queryKey: inventoryKeys.summary, queryFn: api.getInventorySummary });

export const useInventory = (query: ListQuery) =>
  useQuery({ queryKey: inventoryKeys.list(query), queryFn: () => api.listInventory(query) });

export const useWarehouses = () =>
  useQuery({ queryKey: inventoryKeys.warehouses, queryFn: api.listWarehouses });

export const useStockMovements = (productId?: ID) =>
  useQuery({
    queryKey: inventoryKeys.movements(productId),
    queryFn: () => api.listStockMovements(productId),
  });

export function useTransferStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: api.TransferInput) => api.transferStock(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
