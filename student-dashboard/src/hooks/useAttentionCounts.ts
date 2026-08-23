import { useEffect, useState } from "react";
import { messageService, notificationService } from "@/services";

export interface AttentionCounts {
  notifications: number;
  messages: number;
}

const EMPTY: AttentionCounts = { notifications: 0, messages: 0 };

// Same lightweight pub/sub pattern as the Teacher Dashboard's
// useAttentionCounts — the sidebar/topbar badges (mounted once, outside any
// single page) refresh whenever another page mutates notification/message
// state. Pages call `notifyAttentionChanged()` after such a mutation.
const listeners = new Set<() => void>();

export function notifyAttentionChanged(): void {
  listeners.forEach((fn) => fn());
}

/** Powers the sidebar/topbar "needs attention" badges from live mock service state. */
export function useAttentionCounts(): AttentionCounts {
  const [counts, setCounts] = useState<AttentionCounts>(EMPTY);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    listeners.add(bump);
    return () => {
      listeners.delete(bump);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([notificationService.listNotifications(), messageService.listChannels()]).then(
      ([notifications, channels]) => {
        if (cancelled) return;
        setCounts({
          notifications: notifications.filter((n) => !n.read).length,
          messages: channels.reduce((sum, c) => sum + c.unreadCount, 0),
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return counts;
}
