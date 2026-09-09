import { useQuery } from "@tanstack/react-query";
import * as api from "@/services/dashboard";
import type { DateRangeKey } from "@/services/dashboard";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  metrics: (range: DateRangeKey) => ["dashboard", "metrics", range] as const,
};

export const useMetrics = (range: DateRangeKey) =>
  useQuery({ queryKey: dashboardKeys.metrics(range), queryFn: () => api.getMetrics(range) });

export const useSalesSeries = () =>
  useQuery({ queryKey: ["dashboard", "series"], queryFn: api.getSalesSeries });

export const useTopProducts = () =>
  useQuery({ queryKey: ["dashboard", "top-products"], queryFn: api.getTopProducts });

export const useCategoryBreakdown = () =>
  useQuery({ queryKey: ["dashboard", "categories"], queryFn: api.getCategoryBreakdown });

export const usePaymentStatusBreakdown = () =>
  useQuery({ queryKey: ["dashboard", "payment-status"], queryFn: api.getPaymentStatusBreakdown });

export const useRecentTransactions = () =>
  useQuery({ queryKey: ["dashboard", "transactions"], queryFn: api.getRecentTransactions });

export const useLowStockProducts = () =>
  useQuery({ queryKey: ["dashboard", "low-stock"], queryFn: api.getLowStockProducts });

export const useOutstandingCustomers = () =>
  useQuery({ queryKey: ["dashboard", "outstanding"], queryFn: api.getOutstandingCustomers });

export const useRecentActivity = () =>
  useQuery({ queryKey: ["dashboard", "activity"], queryFn: api.getRecentActivity });
