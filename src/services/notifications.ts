import { notifications } from "@/services/apis/db";
import { request } from "@/services/apis/client";
import type { AppNotification, ID } from "@/types";

export function listNotifications(): Promise<AppNotification[]> {
  return request(() => [...notifications], 160);
}

export function markRead(id: ID): Promise<void> {
  return request(() => {
    const item = notifications.find((n) => n.id === id);
    if (item) item.read = true;
  }, 100);
}

export function markAllRead(): Promise<void> {
  return request(() => {
    notifications.forEach((n) => (n.read = true));
  }, 100);
}
