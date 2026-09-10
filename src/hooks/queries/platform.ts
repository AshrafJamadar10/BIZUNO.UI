import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/platform";

export const platformKeys = { all: ["platform"] as const, tenants: ["platform", "tenants"] as const, packages: ["platform", "packages"] as const, subscriptions: ["platform", "subscriptions"] as const };
export const usePlatformTenants = () => useQuery({ queryKey: platformKeys.tenants, queryFn: api.listTenants });
export const useSubscriptionPackages = () => useQuery({ queryKey: platformKeys.packages, queryFn: api.listPackages });
export const useTenantSubscriptions = () => useQuery({ queryKey: platformKeys.subscriptions, queryFn: api.listSubscriptions });
export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: api.createTenant, onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.all }) });
}
