/** Live channel state: chat, typing, hand queue, reactions, polls, notifications. */
import { useEffect, useMemo, useRef, useState } from "react";
import { RealtimeClient } from "../../../lib/realtimeClient";

export interface ChatMsg {
  id: string; user_id: string; display_name: string; body: string; created_at: string;
}
export interface Poll {
  id: string; question: string; options: string[]; counts: number[];
  total_votes: number; anonymous: boolean; closed: boolean;
}
export interface Reaction { emoji: string; user_id: string; display_name: string; key: number; }
export interface Notice { kind: string; text: string; }

export function useRealtime(opts: {
  wsBase: string; token: string; sessionId: string; role: string; name: string;
}) {
  const client = useMemo(() => {
    const q = new URLSearchParams({ token: opts.token, role: opts.role, name: opts.name });
    return new RealtimeClient(`${opts.wsBase}/v1/rt/sessions/${opts.sessionId}?${q}`);
  }, [opts.wsBase, opts.token, opts.sessionId, opts.role, opts.name]);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState<string[]>([]);
  const [handQueue, setHandQueue] = useState<string[]>([]);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const reactKey = useRef(0);

  useEffect(() => {
    const offs = [
      client.on("chat.message", (m) => { setMessages((x) => [...x, m]); setUnread((u) => u + 1); }),
      client.on("chat.typing", (d) =>
        setTyping((t) => (d.typing ? [...new Set([...t, d.display_name])] : t.filter((n) => n !== d.display_name)))),
      client.on("hand.queue", (d) => setHandQueue(d.queue ?? [])),
      client.on("poll.state", (p) => setPoll(p)),
      client.on("poll.results", (p) => setPoll(p)),
      client.on("reaction", (r) =>
        setReactions((x) => [...x, { ...r, key: ++reactKey.current }].slice(-40))),
      client.on("notification", (n) => setNotices((x) => [...x.slice(-20), n])),
    ];
    client.connect();
    return () => { offs.forEach((off) => off()); client.close(); };
  }, [client]);

  return {
    // PRODUCTION FIX (integration audit): the whiteboard feature is explicitly
    // documented (Whiteboard.tsx) to "take the SAME RealtimeClient the
    // classroom already opened (one socket per lesson)" so board ops ride
    // alongside chat — but this hook never exposed the client it built, so no
    // caller could actually satisfy that. Opening a second socket instead
    // would silently kick the first: the server hub keys one connection per
    // user_id per session (see `mcam-backend/app/features/realtime/hub.py`),
    // so a second WS from the same user replaces the first, breaking chat.
    // Exposing the instance is the minimal fix and changes no existing
    // behavior for callers that don't use it.
    client,
    messages, typing, handQueue, poll, reactions, notices, unread,
    clearUnread: () => setUnread(0),
    sendChat: (body: string) => client.send("chat.send", { body }),
    setTypingState: (t: boolean) => client.send("chat.typing", { typing: t }),
    raiseHand: () => client.send("hand.raise"),
    lowerHand: (user_id?: string) => client.send("hand.lower", user_id ? { user_id } : {}),
    react: (emoji: string) => client.send("reaction", { emoji }),
    announce: (body: string) => client.send("announce", { body }),
    setMediaState: (s: { mic_on: boolean; cam_on: boolean; sharing: boolean }) =>
      client.send("media.state", s),
    createPoll: (question: string, options: string[], anonymous: boolean) =>
      client.send("poll.create", { question, options, anonymous }),
    vote: (poll_id: string, option_index: number) =>
      client.send("poll.vote", { poll_id, option_index }),
  };
}
