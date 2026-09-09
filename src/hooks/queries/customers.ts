import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/customers";
import type { CustomerInput, ID, ListQuery } from "@/types";

export const customerKeys = {
  all: ["customers"] as const,
  list: (q: ListQuery) => ["customers", "list", q] as const,
  detail: (id: ID) => ["customers", "detail", id] as const,
  invoices: (id: ID) => ["customers", id, "invoices"] as const,
  payments: (id: ID) => ["customers", id, "payments"] as const,
};

export const useCustomers = (query: ListQuery) =>
  useQuery({ queryKey: customerKeys.list(query), queryFn: () => api.listCustomers(query) });

export const useCustomer = (id: ID) =>
  useQuery({ queryKey: customerKeys.detail(id), queryFn: () => api.getCustomer(id) });

export const useCustomerInvoices = (id: ID) =>
  useQuery({ queryKey: customerKeys.invoices(id), queryFn: () => api.getCustomerInvoices(id) });

export const useCustomerPayments = (id: ID) =>
  useQuery({ queryKey: customerKeys.payments(id), queryFn: () => api.getCustomerPayments(id) });

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) => api.createCustomer(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: ID; input: Partial<CustomerInput> }) =>
      api.updateCustomer(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => api.deleteCustomer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}
