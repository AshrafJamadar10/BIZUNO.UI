import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/notifications";
import type { ID } from "@/types";

export const notificationKeys = { all: ["notifications"] as const };

export const useNotifications = () =>
  useQuery({ queryKey: notificationKeys.all, queryFn: api.listNotifications });

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => api.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
