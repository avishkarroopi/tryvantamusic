import type { NotificationItem } from "@/domain/types";
import { notifications as mockNotifications } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface NotificationService {
  listNotifications(): Promise<NotificationItem[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

const store: NotificationItem[] = clone(mockNotifications);

export const notificationService: NotificationService = {
  async listNotifications() {
    return withDelay(clone(store).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async markRead(id) {
    const target = store.find((n) => n.id === id);
    if (target) target.read = true;
    await withDelay(null, 150);
  },
  async markAllRead() {
    store.forEach((n) => (n.read = true));
    await withDelay(null, 150);
  },
};
