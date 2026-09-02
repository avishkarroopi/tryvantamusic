// ============================================================================
// Event bus consumer (Phase 3).
//
// Replaces the previous behaviour where emit() just wrote a row to
// agents_events that nothing ever read. This reads agents_subscriptions to
// find who cares about each unprocessed event and dispatches a real
// executeAgent(..., "event", ...) run for each active subscriber, then
// marks the event processed. Fan-out depth / cycle protection lives in
// agent-execution.server.ts's emit() closure (see MAX_FAN_OUT_DEPTH there)
// since that's where new events are actually created; this consumer just
// respects whatever depth an event already carries.
// ============================================================================
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types";
import { executeAgent, type AgentHandler } from "../src/lib/agent-execution.server";
import { log } from "./log";

type EventRow = Database["public"]["Tables"]["agents_events"]["Row"];

// How many unprocessed events to pull per tick. Kept modest -- this loop
// runs frequently (see index.ts's poll interval), so a backlog drains
// steadily rather than needing a huge batch.
const BATCH_SIZE = 25;

export async function processPendingEvents(
  supa: SupabaseClient<Database>,
  handlers: Record<string, AgentHandler>,
): Promise<{ eventsProcessed: number; dispatches: number }> {
  const { data: events, error } = await supa
    .from("agents_events")
    .select("*")
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (error) throw new Error(error.message);
  const rows = (events ?? []) as EventRow[];
  if (rows.length === 0) return { eventsProcessed: 0, dispatches: 0 };

  let dispatches = 0;
  for (const ev of rows) {
    try {
      const subscriberSlugs = await resolveSubscribers(supa, ev);
      for (const slug of subscriberSlugs) {
        // Never let an event re-dispatch to its own emitter -- a handler
        // reacting to its own event is exactly the shape of an accidental
        // infinite loop, and it's never a legitimate use case (an agent
        // that wants to act on its own output just does so inline, it
        // doesn't need the event bus to talk to itself).
        if (slug === ev.from_agent) continue;
        try {
          const result = await executeAgent(supa, slug, "event", handlers, {
            causationEventId: ev.id,
          });
          dispatches++;
          if (!result.ok)
            log.warn(`Event-triggered run of "${slug}" failed`, {
              eventId: ev.id,
              eventType: ev.event_type,
              error: result.error,
            });
        } catch (err) {
          // Same defensive stance as the scheduler: one subscriber's setup
          // problem (disabled agent, etc.) must not stop the rest of the
          // fan-out or leave the event stuck unprocessed forever.
          log.error(`executeAgent threw for event subscriber "${slug}"`, {
            eventId: ev.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } finally {
      // Mark processed regardless of subscriber outcomes above -- a failed
      // handler run is already recorded on its own agents_runs row (with
      // its own retry lifecycle via Phase 4); re-processing the SAME event
      // repeatedly would just re-dispatch duplicate runs on every tick.
      await supa
        .from("agents_events")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", ev.id);
    }
  }
  return { eventsProcessed: rows.length, dispatches };
}

/**
 * A directed event (to_agent set) goes only to that one agent, bypassing
 * the subscriptions table entirely -- this is the "point-to-point message"
 * case (e.g. marketing directly notifying sales), distinct from "broadcast
 * event other agents may have subscribed to."
 */
async function resolveSubscribers(supa: SupabaseClient<Database>, ev: EventRow): Promise<string[]> {
  if (ev.to_agent) return [ev.to_agent];
  const { data: subs, error } = await supa
    .from("agents_subscriptions")
    .select("agent_slug")
    .eq("event_type", ev.event_type)
    .eq("active", true);
  if (error) {
    log.error("Failed to resolve subscribers", { eventType: ev.event_type, error: error.message });
    return [];
  }
  return (subs ?? []).map((s) => s.agent_slug as string);
}
