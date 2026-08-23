import { useEffect, useState } from "react";
import { messageService, notificationService, trialService } from "@/services";

export interface AttentionCounts {
  notifications: number;
  messages: number;
  opportunities: number;
}

const EMPTY: AttentionCounts = { notifications: 0, messages: 0, opportunities: 0 };

// Lightweight pub/sub so the sidebar/topbar badges (mounted once, outside any
// single page) refresh whenever another page mutates notification/message/trial
// state — e.g. marking a notification read, opening a chat, claiming a trial.
// Pages call `notifyAttentionChanged()` after such a mutation; every mounted
// `useAttentionCounts()` instance re-fetches in response.
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
    Promise.all([
      notificationService.listNotifications(),
      messageService.listChannels(),
      trialService.listOpportunities(),
    ]).then(([notifications, channels, opportunities]) => {
      if (cancelled) return;
      setCounts({
        notifications: notifications.filter((n) => !n.read).length,
        messages: channels.reduce((sum, c) => sum + c.unreadCount, 0),
        opportunities: opportunities.length,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return counts;
}
