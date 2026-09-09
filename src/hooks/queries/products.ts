import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/products";
import type { ID, ListQuery, ProductInput } from "@/types";

export const productKeys = {
  all: ["products"] as const,
  list: (q: ListQuery) => ["products", "list", q] as const,
  detail: (id: ID) => ["products", "detail", id] as const,
  sales: (id: ID) => ["products", id, "sales"] as const,
  categories: ["products", "categories"] as const,
};

export const useProducts = (query: ListQuery) =>
  useQuery({ queryKey: productKeys.list(query), queryFn: () => api.listProducts(query) });

export const useProduct = (id: ID) =>
  useQuery({ queryKey: productKeys.detail(id), queryFn: () => api.getProduct(id) });

export const useProductSales = (id: ID) =>
  useQuery({ queryKey: productKeys.sales(id), queryFn: () => api.getProductSales(id) });

export const useCategories = () =>
  useQuery({ queryKey: productKeys.categories, queryFn: api.listCategories });

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => api.createProduct(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: ID; input: Partial<ProductInput> }) =>
      api.updateProduct(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => api.deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}
