/**
 * Typed WebSocket client for a live classroom. One socket carries chat, hand,
 * reactions, polls, media-state and notifications (matches the server's single
 * envelope protocol). Auto-reconnects with backoff; dispatches to typed handlers.
 */
export type MsgType =
  | "chat.send" | "chat.typing" | "chat.pin" | "announce"
  | "hand.raise" | "hand.lower" | "reaction" | "media.state"
  | "poll.create" | "poll.vote"
  | "board.op" | "board.lock" | "board.clear" // PRODUCTION FIX (integration
  // audit): the whiteboard feature (useWhiteboard.ts) already sent/listened for
  // these — and the server protocol (protocol.py MsgType) already defined them
  // — but they were missing from this union, so every board.* call was a type
  // error under real `tsc` (the source manifest could only structurally
  // brace-balance-check the frontend, never actually compile it). Added to
  // match the server protocol; no runtime behavior changed.
  | "roster" | "chat.message" | "chat.pinned" | "announcement"
  | "hand.queue" | "poll.state" | "poll.results"
  | "board.state" // server -> client snapshot-on-join (protocol.py BOARD_STATE)
  | "notification" | "error";

export interface Envelope<T = any> {
  type: MsgType;
  data: T;
}

type Handler = (data: any) => void;

export class RealtimeClient {
  private ws?: WebSocket;
  private handlers = new Map<MsgType, Set<Handler>>();
  private queue: Envelope[] = [];
  private closedByUser = false;
  private backoff = 500;

  constructor(
    private url: string, // wss://host/v1/rt/sessions/{id}?token=...&role=...&name=...
  ) {}

  connect(): void {
    this.closedByUser = false;
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      this.backoff = 500;
      this.queue.forEach((e) => this.ws!.send(JSON.stringify(e)));
      this.queue = [];
    };
    this.ws.onmessage = (ev) => {
      const env = JSON.parse(ev.data) as Envelope;
      this.handlers.get(env.type)?.forEach((h) => h(env.data));
    };
    this.ws.onclose = () => {
      if (this.closedByUser) return;
      setTimeout(() => this.connect(), this.backoff);
      this.backoff = Math.min(this.backoff * 2, 8000);
    };
  }

  on(type: MsgType, handler: Handler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)!.delete(handler);
  }

  send(type: MsgType, data: Record<string, unknown> = {}): void {
    const env: Envelope = { type, data };
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(env));
    else this.queue.push(env); // buffered until (re)connected
  }

  close(): void {
    this.closedByUser = true;
    this.ws?.close();
  }
}
