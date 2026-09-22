import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/platform";

export const platformKeys = { all: ["platform"] as const, tenants: ["platform", "tenants"] as const, packages: ["platform", "packages"] as const, subscriptions: ["platform", "subscriptions"] as const };
export const packageScopesKey = ["platform", "package-scopes"] as const;
export const usePlatformTenants = () => useQuery({ queryKey: platformKeys.tenants, queryFn: api.listTenants });
export const useSubscriptionPackages = () => useQuery({ queryKey: platformKeys.packages, queryFn: api.listPackages });
export const usePackageScopes = () => useQuery({ queryKey: packageScopesKey, queryFn: api.listPackageScopes });
export const useTenantSubscriptions = () => useQuery({ queryKey: platformKeys.subscriptions, queryFn: api.listSubscriptions });
export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: api.createTenant, onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.all }) });
}
export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<Pick<api.Tenant, "businessName" | "ownerName" | "email" | "plan" | "status">> }) => api.updateTenant(id, input), onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.all }) });
}
export function useUpdatePackage() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<Omit<api.SubscriptionPackage, "id">> }) => api.updatePackage(id, input), onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.all }) });
}
export function useCreatePackage() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: api.createPackage, onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.all }) });
}
